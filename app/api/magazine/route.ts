import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const revalidate = 60;
export async function GET(request: Request) {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const slug = new URL(request.url).searchParams.get("slug");
  if (slug) {
    const { data, error } = await s.from("magazine_articles").select("id,title,slug,excerpt,content,image_url,created_at,updated_at").eq("slug", slug).eq("is_published", true).maybeSingle();
    if (error) return NextResponse.json({ error: "دریافت مطلب انجام نشد." }, { status: 500 });
    if (!data) return NextResponse.json({ error: "مطلب پیدا نشد." }, { status: 404 });
    return NextResponse.json({ article: data });
  }
  const { data, error } = await s.from("magazine_articles").select("id,title,slug,excerpt,image_url,created_at").eq("is_published", true).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "دریافت مجله انجام نشد." }, { status: 500 });
  return NextResponse.json({ articles: data || [] });
}
