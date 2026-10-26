import test from "node:test";
import assert from "node:assert/strict";
import { verifyAudioMagicBytes } from "../src/lib/storage";

test("verifyAudioMagicBytes - audio/mpeg (MP3)", () => {
  // Valid ID3v2 container header
  const validId3 = Buffer.alloc(16);
  validId3.set([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const resId3 = verifyAudioMagicBytes(validId3, "audio/mpeg");
  assert.equal(resId3.isValid, true);
  assert.equal(resId3.mimeType, "audio/mpeg");

  // Valid MPEG frame sync header (0xFF 0xFB)
  const validMpegSync = Buffer.alloc(16);
  validMpegSync.set([0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const resSync = verifyAudioMagicBytes(validMpegSync, "audio/mpeg");
  assert.equal(resSync.isValid, true);
  assert.equal(resSync.mimeType, "audio/mpeg");

  // Invalid: Plain ASCII or random payload claiming to be audio/mpeg
  const invalidMp3 = Buffer.from("NOT_AN_MP3_FILE_CORRUPT");
  const resInvalid = verifyAudioMagicBytes(invalidMp3, "audio/mpeg");
  assert.equal(resInvalid.isValid, false);
});

test("verifyAudioMagicBytes - audio/mp4 (M4A/AAC in MP4)", () => {
  // Valid MP4 container: 4 bytes length followed by 'ftyp'
  const validMp4 = Buffer.alloc(16);
  validMp4.set([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20]);
  const resMp4 = verifyAudioMagicBytes(validMp4, "audio/mp4");
  assert.equal(resMp4.isValid, true);
  assert.equal(resMp4.mimeType, "audio/mp4");

  // Invalid: missing 'ftyp'
  const invalidMp4 = Buffer.alloc(16);
  invalidMp4.set([0x00, 0x00, 0x00, 0x20, 0x6d, 0x6f, 0x6f, 0x76, 0x00, 0x00, 0x00, 0x00]);
  const resInvalid = verifyAudioMagicBytes(invalidMp4, "audio/mp4");
  assert.equal(resInvalid.isValid, false);
});

test("verifyAudioMagicBytes - audio/webm", () => {
  // Valid WebM EBML header (1A 45 DF A3)
  const validWebm = Buffer.alloc(16);
  validWebm.set([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81]);
  const resWebm = verifyAudioMagicBytes(validWebm, "audio/webm");
  assert.equal(resWebm.isValid, true);
  assert.equal(resWebm.mimeType, "audio/webm");

  // Invalid WebM bytes
  const invalidWebm = Buffer.alloc(16);
  invalidWebm.set([0x1a, 0x45, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const resInvalid = verifyAudioMagicBytes(invalidWebm, "audio/webm");
  assert.equal(resInvalid.isValid, false);
});

test("verifyAudioMagicBytes - audio/wav", () => {
  // Valid WAV container: RIFF at 0..3 and WAVE at 8..11
  const validWav = Buffer.alloc(16);
  validWav.write("RIFF", 0, "ascii");
  validWav.writeUInt32LE(36, 4);
  validWav.write("WAVE", 8, "ascii");
  validWav.write("fmt ", 12, "ascii");

  const resWav = verifyAudioMagicBytes(validWav, "audio/wav");
  assert.equal(resWav.isValid, true);
  assert.equal(resWav.mimeType, "audio/wav");

  // Invalid: RIFF container with WEBP instead of WAVE
  const invalidWav = Buffer.alloc(16);
  invalidWav.write("RIFF", 0, "ascii");
  invalidWav.write("WEBP", 8, "ascii");
  const resInvalid = verifyAudioMagicBytes(invalidWav, "audio/wav");
  assert.equal(resInvalid.isValid, false);
});

test("verifyAudioMagicBytes - Claimed MIME Mismatch Protection", () => {
  // A valid WebM file claiming to be audio/mpeg
  const validWebm = Buffer.alloc(16);
  validWebm.set([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const resMismatch = verifyAudioMagicBytes(validWebm, "audio/mpeg");
  assert.equal(resMismatch.isValid, false);

  // A valid WAV file claiming to be audio/webm
  const validWav = Buffer.alloc(16);
  validWav.write("RIFF", 0, "ascii");
  validWav.write("WAVE", 8, "ascii");
  const resMismatch2 = verifyAudioMagicBytes(validWav, "audio/webm");
  assert.equal(resMismatch2.isValid, false);
});

test("verifyAudioMagicBytes - Malicious Executables & Scripts Blocked", () => {
  // Linux ELF binary
  const elf = Buffer.alloc(16);
  elf.set([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
  assert.equal(verifyAudioMagicBytes(elf, "audio/mp4").isValid, false);
  assert.equal(verifyAudioMagicBytes(elf, "audio/webm").isValid, false);

  // Windows PE EXE (MZ header)
  const mz = Buffer.alloc(16);
  mz.set([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  assert.equal(verifyAudioMagicBytes(mz, "audio/mpeg").isValid, false);

  // Shell script / HTML script
  const script = Buffer.from("#!/bin/bash\nrm -rf /");
  assert.equal(verifyAudioMagicBytes(script, "audio/wav").isValid, false);
});

test("verifyAudioMagicBytes - Truncated Buffer & Non-whitelisted MIME", () => {
  // Truncated buffer (< 12 bytes)
  const shortBuf = Buffer.from([0x1a, 0x45]);
  assert.equal(verifyAudioMagicBytes(shortBuf, "audio/webm").isValid, false);

  // Non-whitelisted MIME (audio/aac, audio/flac)
  const validId3 = Buffer.alloc(16);
  validId3.set([0x49, 0x44, 0x33, 0x04]);
  assert.equal(verifyAudioMagicBytes(validId3, "audio/aac").isValid, false);
  assert.equal(verifyAudioMagicBytes(validId3, "audio/flac").isValid, false);
});
