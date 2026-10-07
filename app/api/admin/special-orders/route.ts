import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه درخواست الزامی است." }, { status: 400 });
  const { error } = await supabaseAdmin.from("special_orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "حذف درخواست انجام نشد." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
