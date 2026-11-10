import { NextResponse } from "next/server";
import {
  adminToken,
  hasAdminAuthConfiguration,
  validCredentials,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "درخواست ورود معتبر نیست." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "درخواست ورود معتبر نیست." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { username, password } = body as {
    username?: unknown;
    password?: unknown;
  };

  // Distinguish a server configuration problem from genuinely incorrect
  // credentials. Never return or log environment values.
  if (!hasAdminSessionConfiguration()) {
    return NextResponse.json(
      { error: "ورود مدیریت در سرور به‌درستی پیکربندی نشده است." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!validCredentials(username, password)) {
    return NextResponse.json(
      { error: "نام کاربری یا رمز عبور نادرست است." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const token = adminToken();
  if (!token) {
    return NextResponse.json(
      { error: "ساخت نشست مدیریت ناموفق بود." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );

  response.cookies.set("galaxy_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
