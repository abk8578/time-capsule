import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import { getSupabaseAdmin, BUCKET_NAME, deleteStorageObjects } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Timing-safe string comparison to prevent timing side-channel attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

interface StorageFile {
  name: string;
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Helper to fetch all items in a Supabase storage directory using pagination
 */
async function listAllInDirectory(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  folderPath: string
): Promise<StorageFile[]> {
  const allItems: StorageFile[] = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath, { limit, offset });

    if (error || !data || data.length === 0) {
      break;
    }

    allItems.push(...(data as StorageFile[]));

    if (data.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allItems;
}

export async function GET(req: Request) {
  try {
    // 1. Verify Authorization header using timingSafeEqual
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");

    if (!cronSecret || !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authorization header or secret unconfigured." },
        { status: 401 }
      );
    }

    const expectedHeader = `Bearer ${cronSecret}`;
    if (!safeCompare(authHeader, expectedHeader)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid cron authorization token." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isDryRun = searchParams.get("dryRun") === "1" || searchParams.get("dryRun") === "true";

    await connectToDatabase();

    // 2. Query all existing capsules and collect all active media & image keys in a Set
    const capsules = await Capsule.find({}).select("images media").lean();
    const referencedKeys = new Set<string>();

    for (const cap of capsules) {
      if (cap.images && Array.isArray(cap.images)) {
        cap.images.forEach((img) => {
          if (img.key) referencedKeys.add(img.key);
        });
      }
      if (cap.media && cap.media.key) {
        referencedKeys.add(cap.media.key);
      }
    }

    // 3. Scan Supabase storage with pagination for files older than 24 hours
    const supabase = getSupabaseAdmin();
    const orphanKeys: string[] = [];
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // List all user directories inside "capsules/"
    const userDirs = await listAllInDirectory(supabase, "capsules");

    for (const userDir of userDirs) {
      if (!userDir.name || userDir.name.startsWith(".")) continue;

      const userPath = `capsules/${userDir.name}`;
      const userItems = await listAllInDirectory(supabase, userPath);

      for (const item of userItems) {
        if (item.name === "audio") {
          // Paginated list of audio subfolder
          const audioItems = await listAllInDirectory(supabase, `${userPath}/audio`);
          for (const audio of audioItems) {
            const fullAudioKey = `${userPath}/audio/${audio.name}`;
            const rawTime = audio.created_at || audio.updated_at;
            const fileTime = rawTime ? new Date(rawTime).getTime() : 0;

            if (fileTime > 0 && fileTime < twentyFourHoursAgo && !referencedKeys.has(fullAudioKey)) {
              orphanKeys.push(fullAudioKey);
            }
          }
        } else if (item.id || item.created_at) {
          // Root user file (photographic image relic)
          const fullImageKey = `${userPath}/${item.name}`;
          const rawTime = item.created_at || item.updated_at;
          const fileTime = rawTime ? new Date(rawTime).getTime() : 0;

            if (fileTime > 0 && fileTime < twentyFourHoursAgo && !referencedKeys.has(fullImageKey)) {
            orphanKeys.push(fullImageKey);
          }
        }
      }
    }

    // 4. In dry-run mode, report findings without deleting
    if (isDryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        scannedDirectories: userDirs.length,
        orphanCount: orphanKeys.length,
        orphanKeys,
      });
    }

    // 5. Delete orphans in batches of 100
    let totalDeleted = 0;
    if (orphanKeys.length > 0) {
      for (let i = 0; i < orphanKeys.length; i += 100) {
        const batch = orphanKeys.slice(i, i + 100);
        await deleteStorageObjects(batch);
        totalDeleted += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      deletedCount: totalDeleted,
      orphanKeys,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cleanup Orphans Cron Error]:", msg);
    return NextResponse.json(
      { error: "Failed to execute orphan file cleanup." },
      { status: 500 }
    );
  }
}
