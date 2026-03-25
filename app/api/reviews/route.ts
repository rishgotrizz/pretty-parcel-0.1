import { Review } from "@/lib/models/Review";
import { connectToDatabase } from "@/lib/server/db";

export async function GET() {
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
