import { Types } from "mongoose";

export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON payload.");
  }
}

export function isObjectId(value: string) {
  return Types.ObjectId.isValid(value);
}

export function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "number" &&
    (error as { code: number }).code === 11000
  );
}

export function logApiError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}
