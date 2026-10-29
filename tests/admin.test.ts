import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateAdminTargetAction } from "../src/lib/admin";
import { GET as getAdminStats } from "../src/app/api/admin/stats/route";
import { GET as getAdminUsers } from "../src/app/api/admin/users/route";
import { GET as getAdminCapsules } from "../src/app/api/admin/capsules/route";

describe("Admin Dashboard Security & Safeguards", () => {
  it("validateAdminTargetAction blocks self-suspension or self-deletion", () => {
    const adminId = "507f1f77bcf86cd799439011";
    const targetUser = { _id: "507f1f77bcf86cd799439011", role: "admin" };

    const result = validateAdminTargetAction(adminId, targetUser);
    assert.equal(result.allowed, false);
    assert.ok(result.error?.includes("cannot modify, suspend, or delete your own"));
  });

  it("validateAdminTargetAction blocks actions against other admins", () => {
    const currentAdminId = "507f1f77bcf86cd799439011";
    const otherAdminUser = { _id: "507f191e810c19729de860ea", role: "admin" };

    const result = validateAdminTargetAction(currentAdminId, otherAdminUser);
    assert.equal(result.allowed, false);
    assert.ok(result.error?.includes("Admins cannot suspend or delete other admin users"));
  });

  it("validateAdminTargetAction allows modifying regular users", () => {
    const currentAdminId = "507f1f77bcf86cd799439011";
    const regularUser = { _id: "507f191e810c19729de86099", role: "user" };

    const result = validateAdminTargetAction(currentAdminId, regularUser);
    assert.equal(result.allowed, true);
    assert.equal(result.error, undefined);
  });

  it("GET /api/admin/stats returns 401 when no admin session is present", async () => {
    const res = await getAdminStats();
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.toLowerCase().includes("unauthorized"));
  });

  it("GET /api/admin/users returns 401 when no admin session is present", async () => {
    const req = new Request("http://localhost:3000/api/admin/users");
    const res = await getAdminUsers(req);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.toLowerCase().includes("unauthorized"));
  });

  it("signs and cryptographically verifies an admin JWT with jose HS256", async () => {
    const { signAdminJwt, verifyAdminJwt } = await import("../src/lib/admin");
    const payload = {
      id: "507f1f77bcf86cd799439011",
      email: "admin@timecapsule.com",
      role: "admin" as const,
    };

    const token = await signAdminJwt(payload);
    assert.ok(typeof token === "string" && token.length > 20);

    const decoded = await verifyAdminJwt(token);
    assert.ok(decoded);
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.email, payload.email);
    assert.equal(decoded.role, "admin");

    // Invalid / tampered token
    const tampered = token.slice(0, -6) + "xxxxxx";
    const invalidResult = await verifyAdminJwt(tampered);
    assert.equal(invalidResult, null);
  });
});
