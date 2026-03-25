import { Product } from "@/lib/models/Product";
import { Review } from "@/lib/models/Review";
import { connectToDatabase } from "@/lib/server/db";

export async function GET() {
  await connectToDatabase();
  const [reviews, productReviews] = await Promise.all([
    Review.find().sort({ createdAt: -1 }).lean<any[]>(),
    Product.find({ isDeleted: { $ne: true }, isActive: true, "reviews.0": { $exists: true } })
      .select("name reviews")
      .lean<any[]>()
  ]);

  const embeddedReviews = productReviews.flatMap((product) =>
    (product.reviews ?? []).map((review: any, index: number) => ({
      _id: `${product._id.toString()}-${index}`,
      name: review.name,
      text: review.comment,
      imageUrl: "",
      createdAt: new Date(review.date ?? new Date()).toISOString()
    }))
  );

  const combinedReviews = [
    ...reviews.map((review) => ({
      _id: review._id.toString(),
      name: review.name,
      text: review.text,
      imageUrl: review.imageUrl ?? "",
      createdAt: new Date(review.createdAt).toISOString()
    })),
    ...embeddedReviews
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return Response.json({
    success: true,
    reviews: combinedReviews
  });
}
