import { NextResponse } from "next/server";
import { config } from "@/lib/config";

const ADMIN_COOKIE = "quickgist_admin";

interface LoginBody {
  key?: string;
  next?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const expected = config.adminApiKey;
  if (!expected) {
    return NextResponse.json({ error: "Admin disabled in this environment" }, { status: 503 });
  }
  if (!body.key || body.key !== expected) {
    return NextResponse.json({ error: "invalid_key" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, next: body.next ?? "/admin" });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: expected,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: config.isProduction,
    maxAge: 60 * 60 * 8 // 8 hours
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    path: "/",
    maxAge: 0
  });
  return response;
}
