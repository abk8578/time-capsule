import { createClient } from "@supabase/supabase-js";
import type { ICapsuleImage } from "@/types";

export const BUCKET_NAME = "capsule-images";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILE_COUNT = 5;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
] as const;

export type AllowedAudioMimeType = (typeof ALLOWED_AUDIO_MIME_TYPES)[number];

export const AUDIO_MIME_TO_EXT: Record<AllowedAudioMimeType, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "audio/wav": "wav",
};

export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Returns a Supabase client authenticated with the Service Role key.
 * SECURITY: Must only ever be called in server environments. Never expose to client.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Inspects binary magic bytes to ensure file content actually matches an allowed image type.
 * Prevents attackers from uploading malicious executables, SVGs (XSS), or scripts with spoofed extensions.
 */
export function verifyImageMagicBytes(buffer: Buffer): {
  isValid: boolean;
  mimeType?: AllowedMimeType;
} {
  if (buffer.length < 12) {
    return { isValid: false };
  }

  // 1. JPEG: Starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: "image/jpeg" };
  }

  // 2. PNG: Starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mimeType: "image/png" };
  }

  // 3. WebP: Starts with RIFF (bytes 0-3) and WEBP (bytes 8-11)
  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return { isValid: true, mimeType: "image/webp" };
  }

  return { isValid: false };
}

/**
 * Inspects binary magic bytes for audio files strictly against the user's claimed MIME type:
 * - audio/mpeg: ID3 / MPEG sync (49 44 33 or 0xFF [0xE0..])
 * - audio/mp4: ftyp box type at index 4..7
 * - audio/webm: 1A 45 DF A3 EBML header
 * - audio/wav: RIFF (bytes 0..3) + WAVE (bytes 8..11)
 *
 * Rejects if magic bytes do not match the claimed MIME type or if buffer is malformed.
 */
export function verifyAudioMagicBytes(
  buffer: Buffer,
  claimedMime: string
): {
  isValid: boolean;
  mimeType?: AllowedAudioMimeType;
  error?: string;
} {
  const normalizedClaimed = claimedMime.split(";")[0].trim().toLowerCase();

  if (!ALLOWED_AUDIO_MIME_TYPES.includes(normalizedClaimed as AllowedAudioMimeType)) {
    return {
      isValid: false,
      error: `Claimed MIME "${claimedMime}" is not an allowed audio format. Allowed: ${ALLOWED_AUDIO_MIME_TYPES.join(", ")}.`,
    };
  }

  // Minimum header size required to verify all signatures (WAV needs 12 bytes)
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: "Audio data too short to verify valid signature." };
  }

  // 1. WAV (audio/wav): RIFF at 0..3 and WAVE at 8..11
  if (normalizedClaimed === "audio/wav") {
    const riff = buffer.subarray(0, 4).toString("ascii");
    const wave = buffer.subarray(8, 12).toString("ascii");
    if (riff === "RIFF" && wave === "WAVE") {
      return { isValid: true, mimeType: "audio/wav" };
    }
    return { isValid: false, error: "Audio file signature does not match authentic RIFF/WAVE container." };
  }

  // 2. WebM (audio/webm): Starts with 0x1A 0x45 0xDF 0xA3 (EBML Header)
  if (normalizedClaimed === "audio/webm") {
    if (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    ) {
      return { isValid: true, mimeType: "audio/webm" };
    }
    return { isValid: false, error: "Audio file signature does not match authentic WebM EBML header." };
  }

  // 3. MP4 / M4A (audio/mp4): Starts with 4-byte size followed by "ftyp" box type at index 4..7
  if (normalizedClaimed === "audio/mp4") {
    const ftyp = buffer.subarray(4, 8).toString("ascii");
    if (ftyp === "ftyp") {
      return { isValid: true, mimeType: "audio/mp4" };
    }
    return { isValid: false, error: "Audio file signature does not match authentic MP4/M4A ftyp container." };
  }

  // 4. MP3 (audio/mpeg): Starts with ID3 (bytes 0-2) or MPEG frame sync header (0xFF and high 3 bits of byte 1 set)
  if (normalizedClaimed === "audio/mpeg") {
    const id3 = buffer.subarray(0, 3).toString("ascii");
    if (id3 === "ID3") {
      return { isValid: true, mimeType: "audio/mpeg" };
    }
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
      return { isValid: true, mimeType: "audio/mpeg" };
    }
    return { isValid: false, error: "Audio file signature does not match authentic MPEG/MP3 frame sync or ID3 tag." };
  }

  return { isValid: false, error: "Unsupported audio format." };
}

/**
 * Partial object read: reads only the first N bytes (default: 16) and retrieves the total object size
 * using a short-lived signed URL with a Range header / HEAD request.
 * Avoids downloading the entire file (saves memory and bandwidth).
 */
export async function readStorageObjectHeaderAndPrefix(
  key: string,
  byteCount: number = 16
): Promise<{ size: number; prefixBuffer: Buffer } | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(key, 60);

    if (error || !data?.signedUrl) {
      console.error(`[Storage] Failed to generate signed URL for partial read: ${key}`, error);
      return null;
    }

    // 1. Partial read using HTTP Range request
    const rangeRes = await fetch(data.signedUrl, {
      headers: {
        Range: `bytes=0-${byteCount - 1}`,
      },
    });

    if (!rangeRes.ok && rangeRes.status !== 206) {
      console.error(`[Storage] Range request failed for ${key}: HTTP ${rangeRes.status}`);
      return null;
    }

    // Extract total size from Content-Range header: "bytes 0-15/456789"
    let totalSize = 0;
    const contentRange = rangeRes.headers.get("content-range");
    if (contentRange) {
      const parts = contentRange.split("/");
      if (parts.length === 2) {
        totalSize = parseInt(parts[1], 10) || 0;
      }
    }

    // Fallback to HEAD request if Content-Range was omitted
    if (!totalSize) {
      const headRes = await fetch(data.signedUrl, { method: "HEAD" });
      const cl = headRes.headers.get("content-length");
      if (cl) totalSize = parseInt(cl, 10) || 0;
    }

    const arrayBuf = await rangeRes.arrayBuffer();
    const prefixBuffer = Buffer.from(arrayBuf);

    return {
      size: totalSize,
      prefixBuffer,
    };
  } catch (err) {
    console.error(`[Storage] Unexpected error during partial read for ${key}:`, err);
    return null;
  }
}

/**
 * Generates short-lived signed read URLs for unlocked capsules.
 * Valid for 15 minutes (900 seconds).
 */
export async function generateSignedReadUrls(
  images: ICapsuleImage[]
): Promise<{ url: string; mimeType: string }[]> {
  if (!images || images.length === 0) return [];

  const supabase = getSupabaseAdmin();

  const results = await Promise.all(
    images.map(async (img) => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(img.key, 900); // 15 minutes

      if (error || !data?.signedUrl) {
        console.error(`[Storage] Failed to create signed read URL for ${img.key}:`, error);
        return null;
      }

      return {
        url: data.signedUrl,
        mimeType: img.mimeType,
      };
    })
  );

  return results.filter(
    (item): item is { url: string; mimeType: string } => item !== null
  );
}

/**
 * Generates a short-lived signed read URL for a media file (audio).
 * Valid for 15 minutes (900 seconds).
 */
export async function generateSignedMediaUrl(
  key: string
): Promise<string | null> {
  if (!key) return null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(key, 900); // 15 minutes

    if (error || !data?.signedUrl) {
      console.error(`[Storage] Failed to create signed media URL for ${key}:`, error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error(`[Storage] Unexpected error creating signed media URL for ${key}:`, err);
    return null;
  }
}

/**
 * Deletes objects from Supabase storage (used for transactional rollback on failures).
 */
export async function deleteStorageObjects(keys: string[]) {
  if (!keys || keys.length === 0) return;
  try {
    const supabase = getSupabaseAdmin();
    await supabase.storage.from(BUCKET_NAME).remove(keys);
  } catch (err) {
    console.error("[Storage Rollback Error] Failed to delete objects:", err);
  }
}
