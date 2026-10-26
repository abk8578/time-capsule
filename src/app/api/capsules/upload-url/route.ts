import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getSupabaseAdmin,
  BUCKET_NAME,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_COUNT,
  MIME_TO_EXT,
  type AllowedMimeType,
  ALLOWED_AUDIO_MIME_TYPES,
  MAX_AUDIO_SIZE,
  AUDIO_MIME_TO_EXT,
  type AllowedAudioMimeType,
} from "@/lib/storage";

const UploadItemSchema = z.object({
  mimeType: z.string().trim(),
  size: z.number().positive("File size must be greater than 0."),
  mediaType: z.enum(["image", "audio"]).optional(),
});

const UploadRequestSchema = z.object({
  files: z
    .array(UploadItemSchema)
    .min(1, "No files specified for upload.")
    .max(6, "Cannot upload more than 6 items at once."),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upload files." },
        { status: 401 }
      );
    }

    // Per-user rate limiting (30 upload requests per 10 minutes)
    const rateLimit = checkRateLimit(`upload_url:${session.user.id}`, 30, 10 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many upload requests. Please wait a few moments before trying again." },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const parseResult = UploadRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid upload request parameters." },
        { status: 400 }
      );
    }

    const { files } = parseResult.data;

    let imageCount = 0;
    let audioCount = 0;

    // Validate mime types and sizes against strict whitelists
    for (const file of files) {
      const normalizedMime = file.mimeType.split(";")[0].trim().toLowerCase();
      const isAudio =
        file.mediaType === "audio" ||
        (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(normalizedMime);

      if (isAudio) {
        audioCount++;
        if (audioCount > 1) {
          return NextResponse.json(
            { error: "Only 1 audio recording or file can be attached per capsule." },
            { status: 400 }
          );
        }

        if (!(ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(normalizedMime)) {
          return NextResponse.json(
            {
              error: `Invalid audio type "${normalizedMime}". Allowed formats: MP3, M4A, WebM, WAV.`,
            },
            { status: 400 }
          );
        }

        if (file.size > MAX_AUDIO_SIZE) {
          return NextResponse.json(
            { error: "Audio file exceeds the 25 MB size limit." },
            { status: 400 }
          );
        }
      } else {
        imageCount++;
        if (imageCount > MAX_FILE_COUNT) {
          return NextResponse.json(
            { error: `You can upload a maximum of ${MAX_FILE_COUNT} images per capsule.` },
            { status: 400 }
          );
        }

        if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(normalizedMime)) {
          return NextResponse.json(
            {
              error: `Invalid image type "${normalizedMime}". Only JPEG, PNG, and WebP are allowed.`,
            },
            { status: 400 }
          );
        }

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "Image file exceeds the 5 MB limit." },
            { status: 400 }
          );
        }
      }
    }

    const supabase = getSupabaseAdmin();
    const uploadUrls: { key: string; signedUrl: string; token: string; mediaType: "image" | "audio" }[] = [];

    for (const file of files) {
      const normalizedMime = file.mimeType.split(";")[0].trim().toLowerCase();
      const isAudio =
        file.mediaType === "audio" ||
        (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(normalizedMime);

      const uuid = crypto.randomUUID();

      let key: string;
      let mediaType: "image" | "audio";

      if (isAudio) {
        const ext = AUDIO_MIME_TO_EXT[normalizedMime as AllowedAudioMimeType] || "webm";
        // Key format: capsules/<userId>/audio/<uuid>.<ext>
        key = `capsules/${session.user.id}/audio/${uuid}.${ext}`;
        mediaType = "audio";
      } else {
        const ext = MIME_TO_EXT[normalizedMime as AllowedMimeType] || "jpg";
        // Key format: capsules/<userId>/<uuid>.<ext>
        key = `capsules/${session.user.id}/${uuid}.${ext}`;
        mediaType = "image";
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(key);

      if (error || !data) {
        console.error("[Storage Error] Failed to generate signed upload URL:", error);
        return NextResponse.json(
          { error: "Failed to generate signed upload URL from storage." },
          { status: 500 }
        );
      }

      uploadUrls.push({
        key,
        signedUrl: data.signedUrl,
        token: data.token,
        mediaType,
      });
    }

    return NextResponse.json({ uploadUrls });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Upload URL API Error]:", msg);
    return NextResponse.json(
      { error: "Failed to prepare file upload." },
      { status: 500 }
    );
  }
}
