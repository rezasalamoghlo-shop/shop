import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return NextResponse.json({ discount_percent: 0, discount_active: false }, { headers: { "Cache-Control": "no-store" } });
  try {
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: authResult, error: authError } = await s.auth.getUser(auth.slice(7));
    if (authError || !authResult.user) return NextResponse.json({ discount_percent: 0, discount_active: false }, { headers: { "Cache-Control": "no-store" } });
    const now = new Date();
    const { error: cleanupError } = await s.from("club_discount_campaigns").delete().lte("ends_at", now.toISOString());
    if (cleanupError) throw cleanupError;
    const { data: campaign, error } = await s.from("club_discount_campaigns").select("discount_percent,starts_at,ends_at").eq("id", 1).maybeSingle();
    if (error) throw error;
    const active = Boolean(campaign && new Date(campaign.starts_at).getTime() <= now.getTime() && new Date(campaign.ends_at).getTime() > now.getTime());
    return NextResponse.json({
      discount_percent: active && campaign ? Math.max(0, Math.min(100, Number(campaign.discount_percent) || 0)) : 0,
      discount_active: active,
      ends_at: active && campaign ? campaign.ends_at : null
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ discount_percent: 0, discount_active: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
