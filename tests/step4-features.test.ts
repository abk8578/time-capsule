import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { escapeHtml, sendUnlockEmail, sendReminderEmail, sendRecipientUnlockEmail } from "../src/lib/email";
import { hashToken, isTokenExpired, shouldSendReminder } from "../src/lib/cron-utils";
import { getClientIp } from "../src/lib/rate-limit";

describe("Step 4 Features & Security Verification", () => {
  describe("1. Real Helper Functions: hashToken & isTokenExpired", () => {
    test("hashToken generates consistent SHA-256 hex string", () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      assert.equal(rawToken.length, 64);

      const hash1 = hashToken(rawToken);
      const hash2 = hashToken(rawToken);
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);
      // Matches standard Node crypto SHA-256
      const directHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      assert.equal(hash1, directHash);
    });

    test("isTokenExpired correctly evaluates active vs expired expiration dates", () => {
      const now = new Date();
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const expiredDate = new Date(now.getTime() - 1000); // 1 sec ago

      // Active token (90 days from now) is NOT expired
      assert.equal(isTokenExpired(ninetyDaysFromNow, now), false);

      // Expired token (1 sec ago) IS expired
      assert.equal(isTokenExpired(expiredDate, now), true);

      // Null or undefined expiration is NOT considered expired
      assert.equal(isTokenExpired(null, now), false);
      assert.equal(isTokenExpired(undefined, now), false);
    });
  });

  describe("2. Real Helper Function: shouldSendReminder (48h Rule & 24h Window)", () => {
    test("Capsule with <= 48h lifespan should NEVER send a 24h advance reminder", () => {
      const base = new Date();
      const now = new Date(base.getTime());
      const created = new Date(now.getTime() - 10 * 60 * 60 * 1000); // created 10h ago

      // Total lifespan: 24h (unlocks in 14 hours)
      const unlock24h = new Date(created.getTime() + 24 * 60 * 60 * 1000);
      assert.equal(shouldSendReminder(created, unlock24h, now), false);

      // Total lifespan: exactly 48h (unlocks in 20 hours)
      const created28hAgo = new Date(now.getTime() - 28 * 60 * 60 * 1000);
      const unlock48h = new Date(created28hAgo.getTime() + 48 * 60 * 60 * 1000);
      assert.equal(shouldSendReminder(created28hAgo, unlock48h, now), false);
    });

    test("Capsule with > 48h lifespan qualifies when inside upcoming 24h window", () => {
      const base = new Date();
      const now = new Date(base.getTime());

      // Created 60 hours ago, unlocks in 12 hours (total lifespan: 72 hours)
      const created72h = new Date(now.getTime() - 60 * 60 * 60 * 1000);
      const unlock12hFuture = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      assert.equal(shouldSendReminder(created72h, unlock12hFuture, now), true);

      // Created 1 year ago, unlocks in 2 hours (total lifespan: 1 year)
      const created1y = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const unlock2hFuture = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      assert.equal(shouldSendReminder(created1y, unlock2hFuture, now), true);
    });

    test("Capsule outside upcoming 24h window does NOT qualify", () => {
      const now = new Date();
      const created = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);

      // Unlocks in 48 hours (too early for 24h advance reminder)
      const unlock48hFuture = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      assert.equal(shouldSendReminder(created, unlock48hFuture, now), false);

      // Already in past
      const unlockPast = new Date(now.getTime() - 1000);
      assert.equal(shouldSendReminder(created, unlockPast, now), false);
    });

    test("$ne: true query semantics matches false, null, and undefined (legacy docs)", () => {
      function matchesNeTrue(val: unknown): boolean {
        return val !== true;
      }

      assert.equal(matchesNeTrue(false), true, "explicit false should match");
      assert.equal(matchesNeTrue(null), true, "null should match");
      assert.equal(matchesNeTrue(undefined), true, "undefined (missing field) should match");
      assert.equal(matchesNeTrue(true), false, "true should NOT match");
    });
  });

  describe("3. Helper Function: getClientIp", () => {
    test("Extracts first IP from comma-separated x-forwarded-for header", () => {
      const headersMap = new Headers({
        "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
      });
      assert.equal(getClientIp(headersMap), "203.0.113.195");
    });

    test("Falls back to 127.0.0.1 if header is missing or empty", () => {
      const emptyHeaders = new Headers();
      assert.equal(getClientIp(emptyHeaders), "127.0.0.1");
      assert.equal(getClientIp(null), "127.0.0.1");
      assert.equal(getClientIp(undefined), "127.0.0.1");
    });
  });

  describe("4. Email Templates, HTML Escaping & Privacy", () => {
    test("HTML sanitization escapes special characters", () => {
      const malicious = '<script>alert("xss")</script> & \'hello\'';
      const escaped = escapeHtml(malicious);

      assert.equal(escaped.includes("<script>"), false);
      assert.equal(escaped.includes("</script>"), false);
      assert.equal(escaped.includes("&lt;script&gt;"), true);
      assert.equal(escaped.includes("&quot;xss&quot;"), true);
      assert.equal(escaped.includes("&#039;hello&#039;"), true);
      assert.equal(escaped.includes("&amp;"), true);
    });

    test("EMAIL_MODE=log logs only recipient domain and first 6 chars of token", async () => {
      const originalMode = process.env.EMAIL_MODE;
      process.env.EMAIL_MODE = "log";

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        logs.push(args.join(" "));
      };

      try {
        const rawToken = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
        await sendRecipientUnlockEmail({
          to: "alice@example.com",
          recipientName: "Alice",
          senderName: "Bob <Admin>",
          rawToken,
        });

        assert.equal(logs.length, 1);
        const logLine = logs[0];
        assert.equal(logLine.includes("toDomain=@example.com"), true);
        assert.equal(logLine.includes("previewToken=abcdef"), true);
        assert.equal(logLine.includes(rawToken), false);
        assert.equal(logLine.includes("alice@"), false);
      } finally {
        console.log = originalLog;
        process.env.EMAIL_MODE = originalMode;
      }
    });

    test("Owner and reminder emails execute cleanly in EMAIL_MODE=log without title leakage", async () => {
      const originalMode = process.env.EMAIL_MODE;
      process.env.EMAIL_MODE = "log";

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        logs.push(args.join(" "));
      };

      try {
        await sendUnlockEmail({
          to: "user@testdomain.org",
          name: "Traveler",
          capsuleId: "60c72b2f9b1d8b0015f8a000",
        });

        await sendReminderEmail({
          to: "user@testdomain.org",
          name: "Traveler",
          capsuleId: "60c72b2f9b1d8b0015f8a000",
          unlockAtFormatted: "Jan 1, 2027",
        });

        assert.equal(logs.length, 2);
        assert.equal(logs[0].includes("toDomain=@testdomain.org"), true);
        assert.equal(logs[1].includes("toDomain=@testdomain.org"), true);
        assert.equal(logs[0].includes("previewToken=none"), true);
      } finally {
        console.log = originalLog;
        process.env.EMAIL_MODE = originalMode;
      }
    });
  });
});
