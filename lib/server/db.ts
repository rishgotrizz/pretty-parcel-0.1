import mongoose from "mongoose";

import { getEnv } from "@/lib/server/env";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;
mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const { mongoUri, mongoDbName } = getEnv();
    cached.promise = mongoose
      .connect(mongoUri, {
        dbName: mongoDbName,
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
