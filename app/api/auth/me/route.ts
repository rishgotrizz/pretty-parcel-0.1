import { getCurrentUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({
    success: true,
    data: {
      user
    },
    error: null,
    user
  });
}
