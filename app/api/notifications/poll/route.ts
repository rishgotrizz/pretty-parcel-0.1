import { NotificationMessage } from "@/lib/models/NotificationMessage";
import { requireUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) {
    return Response.json({ notifications: [] });
  }

  await connectToDatabase();
  const notifications = await NotificationMessage.find({
    user: user._id,
    readAt: { $exists: false }
  })
    .sort({ createdAt: 1 })
    .limit(5)
    .lean<any[]>();

  if (notifications.length) {
    await NotificationMessage.updateMany(
      { _id: { $in: notifications.map((notification) => notification._id) } },
      { $set: { readAt: new Date() } }
    );
  }

  return Response.json({
    notifications: notifications.map((notification) => ({
      id: notification._id.toString(),
      message: notification.message,
      createdAt: new Date(notification.createdAt).toISOString()
    }))
  });
}
