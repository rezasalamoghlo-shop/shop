import crypto from "crypto";
import { cookies } from "next/headers";

const secret = process.env.ADMIN_SESSION_SECRET;

const token = () => {
  if (!secret || secret.length < 32) return "";
  return crypto.createHmac("sha256", secret).update("galaxy-admin").digest("hex");
};

export async function isAdmin() {
  const expected = token();
  if (!expected) return false;
  return (await cookies()).get("galaxy_admin")?.value === expected;
}

export function validCredentials(u: string, p: string) {
  return !!secret && secret.length >= 32 &&
    !!process.env.ADMIN_USERNAME &&
    !!process.env.ADMIN_PASSWORD &&
    u === process.env.ADMIN_USERNAME &&
    p === process.env.ADMIN_PASSWORD;
}

export function adminToken() {
  return token();
}
