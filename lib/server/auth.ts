import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { User } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/server/db";
import { getEnv } from "@/lib/server/env";

const AUTH_COOKIE = "pretty_parcel_token";

type AuthToken = {
  userId: string;
  role: "user" | "customer" | "admin";
  email: string;
};

export type CurrentUser = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "customer" | "admin";
  wishlist: string[];
  notificationPermission?: "default" | "granted" | "denied";
  notificationEnabled?: boolean;
  notificationRewardClaimed?: boolean;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signAuthToken(payload: AuthToken) {
  const secret = new TextEncoder().encode(getEnv().jwtSecret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAuthToken(token: string) {
  const secret = new TextEncoder().encode(getEnv().jwtSecret);
  const { payload } = await jwtVerify(token, secret);
  return payload as AuthToken;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAuthToken(token);
    await connectToDatabase();
    const user = await User.findById(payload.userId)
      .select("name email role wishlist notificationPermission notificationEnabled notificationRewardClaimed")
      .lean<any>();
    if (!user) {
      return null;
    }

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      notificationPermission: user.notificationPermission ?? "default",
      notificationEnabled: Boolean(user.notificationEnabled),
      notificationRewardClaimed: Boolean(user.notificationRewardClaimed),
      wishlist:
        user.wishlist?.map((item: { _id?: { toString(): string }; toString?: () => string }) =>
          item._id?.toString?.() ?? item.toString?.() ?? ""
        ) ?? []
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

export async function createAuthResponse(user: {
  _id: string;
  role: "user" | "customer" | "admin";
  email: string;
  name?: string;
  wishlist?: string[];
}) {
  const token = await signAuthToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email
  });

  const response = NextResponse.json({
    success: true,
    user
  });

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
