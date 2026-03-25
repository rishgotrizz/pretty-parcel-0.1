import { z } from "zod";

import { Cart } from "@/lib/models/Cart";
import { User } from "@/lib/models/User";
import { isDuplicateKeyError, logApiError, parseJsonBody } from "@/lib/server/api";
import { createAuthResponse, hashPassword } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(128)
});

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Please provide a valid name, email, and password." }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
    if (existingUser) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await hashPassword(password),
      role: "customer",
      wishlist: [],
      preferences: {
        favoriteCategories: []
      },
      lastSeenAt: new Date(),
      lastLogin: new Date(),
      orderCount: 0,
      visitCount: 1
    });

    await Cart.updateOne(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          items: []
        }
      },
      { upsert: true }
    );

    return createAuthResponse({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      wishlist: []
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    logApiError("api/auth/register", error);
    return Response.json({ error: "We could not create your account right now." }, { status: 500 });
  }
}
