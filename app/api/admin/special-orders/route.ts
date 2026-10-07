import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin-auth";

export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه درخواست الزامی است." }, { status: 400 });
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabaseAdmin.from("special_orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "حذف درخواست انجام نشد." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
