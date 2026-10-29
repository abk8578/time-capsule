import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local for database tests
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

import { POST as forgotPasswordPost } from "../src/app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "../src/app/api/auth/reset-password/route";

describe("Forgot & Reset Password API Verification", () => {
  after(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore
    }
  });
  it("POST /api/auth/forgot-password rejects invalid emails", async () => {
    const req = new Request("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });

    const res = await forgotPasswordPost(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("valid"));
  });

  it("POST /api/auth/reset-password rejects missing token or short password", async () => {
    // Missing token
    const req1 = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "", password: "password123" }),
    });
    const res1 = await resetPasswordPost(req1);
    assert.equal(res1.status, 400);

    // Password too short (< 8 chars)
    const req2 = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "sometoken", password: "123" }),
    });
    const res2 = await resetPasswordPost(req2);
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.ok(data2.error.includes("8 characters"));
  });

  it("POST /api/auth/reset-password returns 400 for unknown or expired tokens", async () => {
    const fakeToken = crypto.randomBytes(32).toString("hex");
    const req = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: fakeToken, password: "NewValidPassword123!" }),
    });

    const res = await resetPasswordPost(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("expired") || data.error.includes("invalid"));
  });
});
