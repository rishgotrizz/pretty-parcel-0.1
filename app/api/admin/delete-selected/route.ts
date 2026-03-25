import { z } from "zod";

import { AnalyticsEvent } from "@/lib/models/AnalyticsEvent";
import { Cart } from "@/lib/models/Cart";
import { Coupon } from "@/lib/models/Coupon";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { logApiError, parseJsonBody } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

const deleteSelectedSchema = z
  .object({
    deleteProducts: z.boolean().default(false),
    deleteOrders: z.boolean().default(false),
    deleteUsers: z.boolean().default(false),
    deleteCoupons: z.boolean().default(false)
  })
  .refine((value) => Object.values(value).some(Boolean), {
    message: "Select at least one data group to delete."
  });

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = deleteSelectedSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Nothing selected to delete." }, { status: 400 });
    }

    await connectToDatabase();

    const result = {
      products: 0,
      orders: 0,
      users: 0,
      coupons: 0
    };

    console.log("[DangerZone] admin deletion requested", {
      adminId: admin._id,
      adminEmail: admin.email,
      ...parsed.data
    });

    if (parsed.data.deleteProducts) {
      const deletedProducts = await Product.deleteMany({});
      result.products = deletedProducts.deletedCount ?? 0;
      await Promise.all([
        Cart.updateMany({}, { $set: { items: [] } }),
        User.updateMany({}, { $set: { wishlist: [] } })
      ]);
    }

    if (parsed.data.deleteOrders) {
      const deletedOrders = await Order.deleteMany({});
      result.orders = deletedOrders.deletedCount ?? 0;
    }

    if (parsed.data.deleteUsers) {
      const usersToDelete = await User.find({ role: { $ne: "admin" } }).select("_id").lean<any[]>();
      const userIds = usersToDelete.map((user) => user._id);
      if (userIds.length) {
        const deletedUsers = await User.deleteMany({ _id: { $in: userIds } });
        result.users = deletedUsers.deletedCount ?? 0;
        await Promise.all([
          Cart.deleteMany({ user: { $in: userIds } }),
          AnalyticsEvent.deleteMany({ user: { $in: userIds } })
        ]);
      }
    }

    if (parsed.data.deleteCoupons) {
      const deletedCoupons = await Coupon.deleteMany({});
      result.coupons = deletedCoupons.deletedCount ?? 0;
    }

    console.log("[DangerZone] admin deletion completed", {
      adminId: admin._id,
      deleted: result
    });

    return Response.json({
      success: true,
      deleted: result
    });
  } catch (error) {
    logApiError("api/admin/delete-selected", error);
    return Response.json({ error: "Could not delete selected data right now." }, { status: 500 });
  }
}
