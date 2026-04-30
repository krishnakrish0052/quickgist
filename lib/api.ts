import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}

export function internalGuard(request: Request): NextResponse | null {
  const supplied = request.headers.get("x-admin-api-key") ?? new URL(request.url).searchParams.get("key");
  const isDevKey = config.adminApiKey === "dev-admin-key";
  if (isDevKey && !supplied) return null;
  if (supplied === config.adminApiKey) return null;
  return NextResponse.json({ error: "Unauthorized internal service request" }, { status: 401 });
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}
