import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import MagazineCarousel from "./magazine-carousel";
export const metadata: Metadata = { title: "مجله عطر کهکشان | راهنمای عطر و ادکلن", description: "راهنماها و مقاله‌های عطر کهکشان درباره انتخاب رایحه، نت‌های بویایی، ماندگاری عطر و روش استفاده از عطر و ادکلن.", alternates: { canonical: "/magazine" } };
export const revalidate = 60;
export default async function MagazinePage() {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await s.from("magazine_articles").select("id,title,slug,excerpt,image_url,created_at").eq("is_published", true).order("created_at", { ascending: false });
  const articles = data || [];
  return <main dir="rtl" style={{ minHeight: "100vh", background: "radial-gradient(circle at top,#2b1b3a,#0b0810 58%)", color: "#fff", padding: "28px max(16px,calc((100vw - 1120px)/2))", fontFamily: "inherit" }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 30 }}><div><small style={{ letterSpacing: 4, color: "#c7a0f4" }}>GALAXY · PERFUME JOURNAL</small><h1 style={{ fontSize: "clamp(30px,5vw,48px)", margin: "10px 0" }}>مجلهٔ عطر کهکشان</h1><p style={{ color: "#c8bdcf", lineHeight: 2 }}>دنیای رایحه‌ها، نت‌های بویایی و راهنمای انتخاب عطر در چند ورق خواندنی.</p></div><a href="/" style={{ color: "#f8efff", textDecoration: "none", border: "1px solid #6b577b", padding: "10px 14px", borderRadius: 12 }}>بازگشت به فروشگاه</a></header>
    <MagazineCarousel articles={articles as any} />
    <section style={{ marginTop: 24 }}><h2 style={{ fontSize: 24 }}>همهٔ مقاله‌ها</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 }}>{articles.map((a:any) => <article key={a.id} style={{ overflow: "hidden", background: "#171120", border: "1px solid #392b46", borderRadius: 18 }}><a href={"/magazine/" + encodeURIComponent(a.slug)} style={{ color: "inherit", textDecoration: "none" }}><img src={a.image_url} alt={a.title} loading="lazy" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} /><div style={{ padding: 16 }}><h3 style={{ marginTop: 0 }}>{a.title}</h3><p style={{ color: "#c8bdcf", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{a.excerpt}</p><span style={{ color: "#d1aaff" }}>ادامهٔ مطلب ←</span></div></a></article>)}</div></section>
  </main>;
}
