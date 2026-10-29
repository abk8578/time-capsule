import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import User from "@/models/User";
import { encryptContent } from "@/lib/crypto";
import {
  getSupabaseAdmin,
  BUCKET_NAME,
  MAX_FILE_COUNT,
  MAX_FILE_SIZE,
  MAX_AUDIO_SIZE,
  verifyImageMagicBytes,
  verifyAudioMagicBytes,
  readStorageObjectHeaderAndPrefix,
  deleteStorageObjects,
} from "@/lib/storage";
import type { ICapsuleImage, ICapsuleMedia } from "@/types";

const CreateCapsuleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title must be between 1 and 100 characters.")
    .max(100, "Title cannot exceed 100 characters."),
  content: z
    .string()
    .min(1, "Content must be between 1 and 10,000 characters.")
    .max(10000, "Content cannot exceed 10,000 characters."),
  unlockAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format. Please provide a valid ISO date.",
    }),
  imageKeys: z.array(z.string()).max(MAX_FILE_COUNT).optional(),
  audioKey: z.string().optional(),
  audioMime: z.string().optional(),
  recipientEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Recipient email cannot exceed 254 characters.")
    .email("Please provide a valid recipient email address.")
    .optional()
    .or(z.literal("")),
  recipientName: z
    .string()
    .trim()
    .max(100, "Recipient name cannot exceed 100 characters.")
    .optional()
    .or(z.literal("")),
});

export async function POST(req: Request) {
  let committed = false;
  const uploadedKeysToRollback: string[] = [];

  try {
    const rawBody = await req.json().catch(() => null);

    // Track any uploaded storage keys immediately so early returns can purge them in finally
    if (rawBody && typeof rawBody === "object") {
      if (Array.isArray(rawBody.imageKeys)) {
        for (const k of rawBody.imageKeys) {
          if (typeof k === "string" && k.length > 0 && !uploadedKeysToRollback.includes(k)) {
            uploadedKeysToRollback.push(k);
          }
        }
      }
      if (
        typeof rawBody.audioKey === "string" &&
        rawBody.audioKey.length > 0 &&
        !uploadedKeysToRollback.includes(rawBody.audioKey)
      ) {
        uploadedKeysToRollback.push(rawBody.audioKey);
      }
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to create a capsule." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const currentUser = await User.findById(session.user.id).select("+isSuspended");
    if (!currentUser || currentUser.isSuspended) {
      return NextResponse.json(
        { error: "Your account is suspended. Capsule creation is disabled." },
        { status: 403 }
      );
    }

    const parseResult = CreateCapsuleSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      unlockAt,
      imageKeys,
      audioKey,
      audioMime,
      recipientEmail,
      recipientName,
    } = parseResult.data;

    const normalizedRecipientEmail =
      recipientEmail && recipientEmail.trim().length > 0
        ? recipientEmail.trim().toLowerCase()
        : null;
    const normalizedRecipientName =
      recipientName && recipientName.trim().length > 0 ? recipientName.trim() : null;

    const unlockDate = new Date(unlockAt);
    if (isNaN(unlockDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Please provide a valid ISO date." },
        { status: 400 }
      );
    }

    // Must be at least 1 minute in the future
    const now = Date.now();
    const minUnlockTime = now + 60 * 1000;
    if (unlockDate.getTime() < minUnlockTime) {
      return NextResponse.json(
        { error: "Unlock date must be at least 1 minute in the future." },
        { status: 400 }
      );
    }

    // Rate limit checks when recipientEmail is provided
    if (normalizedRecipientEmail) {
      await connectToDatabase();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

      // 1. Max 10 recipient capsules per user per day
      const recipientCountToday = await Capsule.countDocuments({
        userId: session.user.id,
        recipientEmail: { $ne: null },
        createdAt: { $gte: oneDayAgo },
      });

      if (recipientCountToday >= 10) {
        return NextResponse.json(
          {
            error:
              "Daily limit reached: You can create a maximum of 10 recipient capsules in a 24-hour period.",
          },
          { status: 429 }
        );
      }

      // 2. Max 3 pending (locked) capsules from same sender to same recipient email
      const pendingForRecipient = await Capsule.countDocuments({
        userId: session.user.id,
        recipientEmail: normalizedRecipientEmail,
        unlockAt: { $gt: new Date() },
      });

      if (pendingForRecipient >= 3) {
        return NextResponse.json(
          {
            error:
              "Recipient pending limit reached: You can have at most 3 pending locked capsules for this recipient at one time.",
          },
          { status: 429 }
        );
      }
    }

    const hasImages = Boolean(imageKeys && Array.isArray(imageKeys) && imageKeys.length > 0);
    const supabase = hasImages ? getSupabaseAdmin() : null;

    // 1. Validate and inspect uploaded images if any
    const validatedImages: ICapsuleImage[] = [];

    if (imageKeys && Array.isArray(imageKeys) && imageKeys.length > 0) {
      if (imageKeys.length > MAX_FILE_COUNT) {
        return NextResponse.json(
          { error: `Maximum ${MAX_FILE_COUNT} images allowed per capsule.` },
          { status: 400 }
        );
      }

      const userPrefix = `capsules/${session.user.id}/`;

      for (const key of imageKeys) {
        // Security check: Must belong strictly to the authenticated user directory
        if (
          typeof key !== "string" ||
          !key.startsWith(userPrefix) ||
          key.includes("..")
        ) {
          return NextResponse.json(
            { error: "Invalid image storage key provided." },
            { status: 400 }
          );
        }

        // Verify object existence and fetch content to inspect real magic bytes
        const { data, error } = await supabase!.storage
          .from(BUCKET_NAME)
          .download(key);

        if (error || !data) {
          return NextResponse.json(
            { error: `Uploaded image not found in storage: ${key}` },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await data.arrayBuffer());

        // Validate actual file size
        if (buffer.length > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "One or more uploaded images exceed the 5 MB limit." },
            { status: 400 }
          );
        }

        // Validate real file type from binary magic bytes (never trust extension or client MIME)
        const magic = verifyImageMagicBytes(buffer);
        if (!magic.isValid || !magic.mimeType) {
          return NextResponse.json(
            {
              error:
                "Invalid image file signature. Only authentic JPEG, PNG, and WebP files are accepted.",
            },
            { status: 400 }
          );
        }

        validatedImages.push({
          key,
          mimeType: magic.mimeType,
          size: buffer.length,
        });
      }
    }

    // 2. Validate and inspect uploaded audio file if present
    let validatedMedia: ICapsuleMedia | null = null;

    if (audioKey) {
      const audioPrefix = `capsules/${session.user.id}/audio/`;

      // Security check: Key must strictly start with capsules/<userId>/audio/
      if (
        typeof audioKey !== "string" ||
        !audioKey.startsWith(audioPrefix) ||
        audioKey.includes("..") ||
        audioKey.includes("//")
      ) {
        return NextResponse.json(
          { error: "Invalid audio storage key format or directory traversal detected." },
          { status: 400 }
        );
      }

      // Ensure filename portion is a clean single filename without slashes
      const filename = audioKey.slice(audioPrefix.length);
      if (!filename || filename.includes("/") || !/^[a-zA-Z0-9_.-]+$/.test(filename)) {
        return NextResponse.json(
          { error: "Invalid audio filename in storage key." },
          { status: 400 }
        );
      }

      // Determine claimed MIME type from request or file extension
      let claimedMime = audioMime ? audioMime.split(";")[0].trim().toLowerCase() : "";
      if (!claimedMime) {
        const ext = filename.split(".").pop()?.toLowerCase();
        if (ext === "mp3") claimedMime = "audio/mpeg";
        else if (ext === "m4a" || ext === "mp4") claimedMime = "audio/mp4";
        else if (ext === "webm") claimedMime = "audio/webm";
        else if (ext === "wav") claimedMime = "audio/wav";
      }

      // Partial read: Read only first 16 bytes and get total size via Range/HEAD request
      const headerInfo = await readStorageObjectHeaderAndPrefix(audioKey, 16);
      if (!headerInfo) {
        return NextResponse.json(
          { error: `Uploaded audio not found in storage: ${audioKey}` },
          { status: 400 }
        );
      }

      // Validate actual file size from storage metadata against 25 MB limit
      if (headerInfo.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: "Audio file exceeds the 25 MB size limit." },
          { status: 400 }
        );
      }

      // Validate magic bytes strictly against the claimed MIME type
      const audioMagic = verifyAudioMagicBytes(headerInfo.prefixBuffer, claimedMime);
      if (!audioMagic.isValid || !audioMagic.mimeType) {
        return NextResponse.json(
          {
            error:
              audioMagic.error ||
              "Invalid audio file signature. Only authentic MP3, M4A, WebM, and WAV audio files matching their format are accepted.",
          },
          { status: 400 }
        );
      }

      validatedMedia = {
        key: audioKey,
        mimeType: audioMagic.mimeType,
        size: headerInfo.size,
        mediaType: "audio",
      };
    }

    await connectToDatabase();

    // Encrypt content with AES-256-GCM using unique per-capsule IV
    const { ciphertext, iv, authTag } = encryptContent(content);

    // Set userId strictly from the authenticated session, never from the request body
    const newCapsule = await Capsule.create({
      userId: session.user.id,
      title: title.trim(),
      content: ciphertext,
      isEncrypted: true,
      iv,
      authTag,
      images: validatedImages,
      media: validatedMedia,
      recipientEmail: normalizedRecipientEmail || undefined,
      recipientName: normalizedRecipientName || undefined,
      recipientNotified: false,
      reminderSent: false,
      unlockAt: unlockDate, // Persisted as UTC Date
      notified: false,
    });

    // Mark committed = true only after document is successfully persisted in MongoDB
    committed = true;

    // Successfully saved: Do NOT return content or internal storage keys
    return NextResponse.json(
      {
        message: "Capsule created and sealed successfully.",
        capsule: {
          id: newCapsule._id.toString(),
          title: newCapsule.title,
          unlockAt: newCapsule.unlockAt.toISOString(),
          createdAt: newCapsule.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Create Capsule API Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while sealing your capsule." },
      { status: 500 }
    );
  } finally {
    // Guarantees any uploaded assets are purged on any early return or unexpected exception
    if (!committed && uploadedKeysToRollback.length > 0) {
      try {
        await deleteStorageObjects(uploadedKeysToRollback);
      } catch (cleanupErr) {
        console.error("[Storage Rollback Error in finally]:", cleanupErr);
      }
    }
  }
}
