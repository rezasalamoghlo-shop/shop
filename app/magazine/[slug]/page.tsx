import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
async function getArticle(slug: string) {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await s.from("magazine_articles").select("title,slug,excerpt,content,image_url,created_at,updated_at").eq("slug", decodeURIComponent(slug)).eq("is_published", true).maybeSingle();
  return data;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const a = await getArticle(slug);
  if (!a) return { title: "مطلب پیدا نشد | مجله عطر کهکشان" };
  return { title: a.title + " | مجله عطر کهکشان", description: a.excerpt || a.content.slice(0, 155), alternates: { canonical: "/magazine/" + a.slug }, openGraph: { title: a.title, description: a.excerpt || a.content.slice(0, 155), images: [a.image_url], type: "article", publishedTime: a.created_at } };
}
export default async function MagazineArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const a = await getArticle(slug); if (!a) notFound();
  return <main dir="rtl" style={{ minHeight: "100vh", background: "radial-gradient(circle at top,#2b1b3a,#0b0810 55%)", color: "#fff", padding: "26px max(16px,calc((100vw - 900px)/2)", fontFamily: "inherit" }}>
    <a href="/magazine" style={{ color: "#d1aaff", textDecoration: "none" }}>← بازگشت به مجله</a>
    <article style={{ marginTop: 24, background: "#171120", border: "1px solid #392b46", borderRadius: 22, overflow: "hidden" }}>
      <img src={a.image_url} alt={a.title} style={{ width: "100%", maxHeight: 520, objectFit: "cover", display: "block" }} />
      <div style={{ padding: "clamp(20px,5vw,48px)" }}><small style={{ color: "#c7a0f4" }}>مجلهٔ عطر کهکشان · {new Date(a.created_at).toLocaleDateString("fa-IR")}</small><h1 style={{ fontSize: "clamp(28px,5vw,44px)", lineHeight: 1.7 }}>{a.title}</h1>{a.excerpt && <p style={{ color: "#d8cde3", fontSize: 18, lineHeight: 2 }}>{a.excerpt}</p>}<div style={{ whiteSpace: "pre-wrap", lineHeight: 2.25, fontSize: 17 }}>{a.content}</div></div>
    </article>
  </main>;
}
