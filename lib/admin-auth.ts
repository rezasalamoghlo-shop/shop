import crypto from "crypto";
import { cookies } from "next/headers";

// Read server environment values at request time. Dynamic lookup prevents
// credentials from being frozen into a build when Vercel env values change.
function env(name: string): string {
  return process.env[name] ?? "";
}

function sessionToken(): string {
  const secret = env("ADMIN_SESSION_SECRET");
  if (secret.length < 32) return "";
  return crypto.createHmac("sha256", secret).update("galaxy-admin").digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAdmin() {
  const expected = sessionToken();
  if (!expected) return false;
  const actual = (await cookies()).get("galaxy_admin")?.value ?? "";
  return safeEqual(actual, expected);
}

export function validCredentials(username: unknown, password: unknown): boolean {
  if (typeof username !== "string" || typeof password !== "string") return false;

  const expectedUsername = env("ADMIN_USERNAME").trim();
  const expectedPassword = env("ADMIN_PASSWORD");
  if (!expectedUsername || !expectedPassword) return false;

  // Username whitespace is accidental in most dashboard setups; passwords
  // remain byte-for-byte exact so intentional spaces are preserved.
  return safeEqual(username.trim(), expectedUsername) &&
    safeEqual(password, expectedPassword);
}

export function adminToken(): string {
  return sessionToken();
}

export function hasAdminSessionConfiguration(): boolean {
  return env("ADMIN_SESSION_SECRET").length >= 32;
}
