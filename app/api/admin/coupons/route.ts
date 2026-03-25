import { z } from "zod";

import { Coupon } from "@/lib/models/Coupon";
import { isDuplicateKeyError, isObjectId, logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const couponSchema = z.object({
  code: z.string().trim().min(3).max(40),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().min(1),
  autoApply: z.union([z.literal("true"), z.literal("false")]).optional()
});

const couponUpdateSchema = couponSchema.extend({
  id: z.string()
});

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return Response.json({
    coupons: (coupons as any[]).map((coupon) => ({
      _id: coupon._id.toString(),
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      autoApply: coupon.autoApply
    }))
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = couponSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid coupon payload." }, { status: 400 });
    }

    await connectToDatabase();
    const coupon = await Coupon.create({
      code: parsed.data.code.toUpperCase(),
      type: parsed.data.type,
      value: parsed.data.value,
      autoApply: parsed.data.autoApply === "true",
      minOrderValue: 999,
      isActive: true
    });

    return Response.json({ coupon: { _id: coupon._id.toString(), code: coupon.code } });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "A coupon with this code already exists." }, { status: 409 });
    }

    logApiError("api/admin/coupons:POST", error);
    return Response.json({ error: "Could not create coupon right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = couponUpdateSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Invalid coupon payload." }, { status: 400 });
    }
    if (!isObjectId(parsed.data.id)) {
      return Response.json({ error: "Invalid coupon id." }, { status: 400 });
    }

    await connectToDatabase();
    const updated = await Coupon.findByIdAndUpdate(parsed.data.id, {
      code: parsed.data.code.toUpperCase(),
      type: parsed.data.type,
      value: parsed.data.value,
      autoApply: parsed.data.autoApply === "true"
    });
    if (!updated) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "A coupon with this code already exists." }, { status: 409 });
    }

    logApiError("api/admin/coupons:PATCH", error);
    return Response.json({ error: "Could not update coupon right now." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !isObjectId(id)) {
    return Response.json({ error: "Coupon id required." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    logApiError("api/admin/coupons:DELETE", error);
    return Response.json({ error: "Could not delete coupon right now." }, { status: 500 });
  }
}
