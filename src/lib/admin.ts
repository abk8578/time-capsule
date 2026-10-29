import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import type { IUser } from "@/types";

export const ADMIN_COOKIE_NAME = "admin_token";

export interface AdminJwtPayload {
  id: string;
  email: string;
  role: "admin";
}

export interface AdminAuthResult {
  authorized: boolean;
  user?: IUser;
  sessionUserId?: string;
  response?: NextResponse;
}

/**
 * Returns Uint8Array secret key for HS256 JWT signatures.
 */
function getAdminJwtSecretKey(): Uint8Array {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "temporal-vault-fallback-admin-jwt-secret-do-not-use-in-prod-32bytes";
  return new TextEncoder().encode(secret);
}

/**
 * Signs an 8-hour HS256 JWT using jose.
 */
export async function signAdminJwt(payload: AdminJwtPayload): Promise<string> {
  const secretKey = getAdminJwtSecretKey();
  return new SignJWT({
    id: payload.id,
    email: payload.email.toLowerCase().trim(),
    role: "admin",
    type: "admin_access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

/**
 * Cryptographically verifies the admin JWT token using jose.
 */
export async function verifyAdminJwt(
  token: string
): Promise<AdminJwtPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }
  try {
    const secretKey = getAdminJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      payload &&
      payload.role === "admin" &&
      typeof payload.id === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        id: payload.id,
        email: payload.email,
        role: "admin",
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Standard cookie attributes for the admin_token JWT.
 */
export function getAdminJwtCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours in seconds
  };
}

/**
 * Defense-in-depth API guard:
 * 1. Checks & verifies the cryptographic JWT from the "admin_token" cookie.
 * 2. As fallback, verifies NextAuth session.
 * 3. Re-checks the live MongoDB DATABASE to confirm role === "admin" & !isSuspended.
 */
export async function requireAdmin(req?: Request): Promise<AdminAuthResult> {
  let userId: string | null = null;

  // 1. Check admin_token JWT from cookie header or server cookies()
  let adminToken: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(
        new RegExp(`(?:^|; )${ADMIN_COOKIE_NAME}=([^;]*)`)
      );
      if (match) adminToken = decodeURIComponent(match[1]);
    }
  }

  if (!adminToken) {
    try {
      const cookieStore = await cookies();
      adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    } catch {
      // Outside Request / Server component context
    }
  }

  if (adminToken) {
    const verifiedJwt = await verifyAdminJwt(adminToken);
    if (verifiedJwt) {
      userId = verifiedJwt.id;
    }
  }

  // 2. NextAuth session check as fallback
  if (!userId) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // Ignore
    }
  }

  if (!userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized. Please log in as an administrator." },
        { status: 401 }
      ),
    };
  }

  // 3. Live database verification
  await connectToDatabase();

  const dbUser = await User.findById(userId).select(
    "+role +isSuspended email name createdAt"
  );

  if (!dbUser || dbUser.isSuspended) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden. Account is inactive or suspended." },
        { status: 403 }
      ),
    };
  }

  if (dbUser.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden. Admin privileges required." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: dbUser,
    sessionUserId: dbUser._id.toString(),
  };
}

/**
 * Server Component page guard:
 * Verifies admin JWT and confirms role directly against the MongoDB database.
 */
export async function requireAdminPage() {
  let userId: string | null = null;

  // 1. Check admin_token JWT cookie
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (adminToken) {
      const verified = await verifyAdminJwt(adminToken);
      if (verified) userId = verified.id;
    }
  } catch {
    // safe
  }

  // 2. Fallback to NextAuth session
  if (!userId) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) userId = session.user.id;
    } catch {
      // safe
    }
  }

  if (!userId) {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const dbUser = await User.findById(userId).select(
    "+role +isSuspended email name createdAt"
  );

  if (!dbUser || dbUser.isSuspended || dbUser.role !== "admin") {
    redirect("/");
  }

  return {
    user: dbUser,
  };
}

/**
 * Protection rule: An admin cannot delete or suspend themselves or other admins.
 */
export function validateAdminTargetAction(
  currentAdminId: string,
  targetUser: { _id: unknown; role?: string }
): { allowed: boolean; error?: string } {
  const targetIdStr = String(targetUser._id);
  const currentAdminIdStr = String(currentAdminId);

  if (targetIdStr === currentAdminIdStr) {
    return {
      allowed: false,
      error: "Security restriction: You cannot modify, suspend, or delete your own admin account.",
    };
  }

  if (targetUser.role === "admin") {
    return {
      allowed: false,
      error: "Security restriction: Admins cannot suspend or delete other admin users.",
    };
  }

  return { allowed: true };
}
