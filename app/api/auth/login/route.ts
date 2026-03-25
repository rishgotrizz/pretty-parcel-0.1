import { z } from "zod";

import { User } from "@/lib/models/User";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { createAuthResponse, verifyPassword } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { getCustomerLevel } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128)
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Please provide a valid email and password." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+password");
    if (!user?.password) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(parsed.data.password, user.password);
    if (!isValid) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const now = new Date();
    user.lastSeenAt = now;
    user.lastLogin = now;
    user.level = getCustomerLevel(user.orderCount ?? 0);
    await user.save();

    return createAuthResponse({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      level: user.level,
      wishlist: user.wishlist?.map((item: { toString(): string }) => item.toString()) ?? []
    });
  } catch (error) {
    logApiError("api/auth/login", error);
    return Response.json({ error: "We could not log you in right now." }, { status: 500 });
  }
}
