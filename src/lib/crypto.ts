import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM

/**
 * Derives a strict 32-byte Buffer from the environment encryption key.
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.CONTENT_ENCRYPTION_KEY?.trim();

  if (!keyEnv) {
    throw new Error(
      "[Crypto] CONTENT_ENCRYPTION_KEY is not set in environment variables. Ensure it is defined."
    );
  }

  // If 64 hex characters (32 bytes), parse directly
  if (/^[0-9a-fA-F]{64}$/.test(keyEnv)) {
    return Buffer.from(keyEnv, "hex");
  }

  // If exactly 32 utf-8 characters
  if (Buffer.byteLength(keyEnv, "utf-8") === 32) {
    return Buffer.from(keyEnv, "utf-8");
  }

  // Deterministic 32-byte hash fallback to prevent key length mismatch
  return crypto.createHash("sha256").update(keyEnv).digest();
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts plain text content using AES-256-GCM with a unique 12-byte random IV.
 */
export function encryptContent(plainText: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plainText, "utf8", "hex");
  ciphertext += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using the given IV and authentication tag.
 * Validates integrity via authTag to protect against tampering.
 */
export function decryptContent(
  ciphertext: string,
  iv: string,
  authTag: string
): string {
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hashes tokens (such as recipient access tokens) using SHA-256.
 * Ensures raw tokens are never persisted in plaintext in MongoDB.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
