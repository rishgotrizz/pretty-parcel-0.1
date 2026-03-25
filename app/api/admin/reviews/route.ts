import { z } from "zod";

import { Review } from "@/lib/models/Review";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const reviewSchema = z.object({
  name: z.string().trim().min(3, "Reviewer name must be at least 3 characters."),
  text: z.string().trim().min(10, "Review text must be at least 10 characters."),
  imageUrl: z.string().trim().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = reviewSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid review." }, { status: 400 });
    }

    await connectToDatabase();
    const review = await Review.create({
      name: parsed.data.name,
      text: parsed.data.text,
      imageUrl: parsed.data.imageUrl ?? ""
    });

    return Response.json({
      success: true,
      review: {
        _id: review._id.toString(),
        name: review.name,
        text: review.text,
        imageUrl: review.imageUrl ?? "",
        createdAt: review.createdAt.toISOString()
      }
    });
  } catch (error) {
    logApiError("api/admin/reviews", error);
    return Response.json({ success: false, error: "Could not save review right now." }, { status: 500 });
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const reviews = await Review.find().sort({ createdAt: -1 }).lean<any[]>();

  return Response.json({
    success: true,
    reviews: reviews.map((review) => ({
      _id: review._id.toString(),
      name: review.name,
      text: review.text,
      imageUrl: review.imageUrl ?? "",
      createdAt: new Date(review.createdAt).toISOString()
    }))
  });
}
