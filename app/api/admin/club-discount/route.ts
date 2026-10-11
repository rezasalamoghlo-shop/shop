import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin-auth";

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function currentCampaign() {
  const s = db();
  const now = new Date().toISOString();
  const { error: cleanupError } = await s.from("club_discount_campaigns").delete().lte("ends_at", now);
  if (cleanupError) throw cleanupError;
  const { data, error } = await s.from("club_discount_campaigns").select("id,discount_percent,starts_at,ends_at,created_at").eq("id", 1).maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.starts_at).getTime() > Date.now() || new Date(data.ends_at).getTime() <= Date.now()) return null;
  return data;
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ campaign: await currentCampaign() });
  } catch {
    return NextResponse.json({ error: "دریافت تخفیف سراسری انجام نشد." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const percent = Number(body.discount_percent);
    const days = Number(body.duration_days);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return NextResponse.json({ error: "درصد تخفیف باید بیشتر از صفر و حداکثر ۱۰۰ باشد." }, { status: 400 });
    }
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      return NextResponse.json({ error: "مدت اعتبار باید عددی بین ۱ تا ۳۶۵۰ روز باشد." }, { status: 400 });
    }
    const now = new Date();
    const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const { data, error } = await db().from("club_discount_campaigns").upsert({
      id: 1,
      discount_percent: percent,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      created_at: now.toISOString()
    }, { onConflict: "id" }).select("id,discount_percent,starts_at,ends_at,created_at").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, campaign: data });
  } catch {
    return NextResponse.json({ error: "ذخیره تخفیف سراسری انجام نشد." }, { status: 500 });
  }
}

export async function DELETE() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { error } = await db().from("club_discount_campaigns").delete().eq("id", 1);
    if (error) throw error;
    return NextResponse.json({ ok: true, campaign: null });
  } catch {
    return NextResponse.json({ error: "حذف تخفیف سراسری انجام نشد." }, { status: 500 });
  }
}
