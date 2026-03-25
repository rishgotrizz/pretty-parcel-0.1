import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/server/db";

export async function GET() {
  try {
    await connectToDatabase();
    return Response.json({
      ok: true,
      database: mongoose.connection.readyState === 1 ? "connected" : "connecting"
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown database error"
      },
      { status: 500 }
    );
  }
}
