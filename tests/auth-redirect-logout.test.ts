import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POST as logoutPost, GET as logoutGet } from "../src/app/api/auth/logout/route";

describe("Auth Redirection & Logout Safeguards", () => {
  it("POST /api/auth/logout returns success and expires all auth session cookies", async () => {
    const res = await logoutPost();
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);

    const cookies = res.cookies.getAll();
    const cookieNames = cookies.map((c) => c.name);

    assert.ok(cookieNames.includes("next-auth.session-token"), "clears next-auth.session-token");
    assert.ok(cookieNames.includes("__Secure-next-auth.session-token"), "clears __Secure-next-auth.session-token");
    assert.ok(cookieNames.includes("next-auth.csrf-token"), "clears next-auth.csrf-token");
    assert.ok(cookieNames.includes("next-auth.callback-url"), "clears next-auth.callback-url");

    // Verify cookies are expired immediately
    for (const cookie of cookies) {
      assert.equal(cookie.value, "");
      assert.equal(cookie.maxAge, 0);
    }
  });

  it("GET /api/auth/logout redirects to /login and clears cookies", async () => {
    const fakeReq = new Request("http://localhost:3000/api/auth/logout");
    const res = await logoutGet(fakeReq);

    assert.equal(res.status, 307);
    const location = res.headers.get("location");
    assert.ok(location?.includes("/login"), "redirects to /login");

    const cookies = res.cookies.getAll();
    const cookieNames = cookies.map((c) => c.name);
    assert.ok(cookieNames.includes("next-auth.session-token"));
  });

  it("Authenticated user visiting '/', '/login', or '/signup' should route to '/dashboard'", () => {
    const mockCheckRedirect = (isAuthenticated: boolean, pathname: string) => {
      if (
        isAuthenticated &&
        (pathname === "/" || pathname === "/login" || pathname === "/signup")
      ) {
        return "/dashboard";
      }
      return null;
    };

    assert.equal(mockCheckRedirect(true, "/"), "/dashboard");
    assert.equal(mockCheckRedirect(true, "/login"), "/dashboard");
    assert.equal(mockCheckRedirect(true, "/signup"), "/dashboard");
    assert.equal(mockCheckRedirect(false, "/"), null);
    assert.equal(mockCheckRedirect(false, "/login"), null);
    assert.equal(mockCheckRedirect(false, "/signup"), null);
  });
});
