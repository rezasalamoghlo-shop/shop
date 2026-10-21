"use client";
import { useEffect, useState } from "react";
type Article = { id: string; title: string; slug: string; excerpt: string; image_url: string; created_at: string };
export default function MagazineCarousel({ articles }: { articles: Article[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => { if (articles.length < 2) return; const timer = window.setInterval(() => setActive(i => (i + 1) % articles.length), 5500); return () => window.clearInterval(timer); }, [articles.length]);
  if (!articles.length) return <div style={{ padding: 30, border: "1px dashed #71617e", borderRadius: 20, textAlign: "center" }}>هنوز مطلبی منتشر نشده است. به‌زودی راهنماهای رایحه در این بخش قرار می‌گیرند.</div>;
  const a = articles[active % articles.length];
  return <section aria-label="مجله عطر کهکشان" style={{ color: "#fff" }}>
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, minHeight: 360, background: "#171020", border: "1px solid #493750" }}>
      <img key={a.id} src={a.image_url} alt={a.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .55, animation: "galaxyMagazineFade 700ms ease" }} />
      <div style={{ position: "relative", zIndex: 1, minHeight: 360, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "end", padding: "clamp(22px,5vw,48px)", background: "linear-gradient(0deg,rgba(13,7,20,.96),rgba(13,7,20,.05) 90%)" }}>
        <span style={{ color: "#d6b3ff", letterSpacing: 3, fontSize: 12 }}>GALAXY PERFUME JOURNAL · {active + 1}/{articles.length}</span>
        <h2 style={{ fontSize: "clamp(26px,4vw,42px)", margin: "12px 0" }}>{a.title}</h2>
        <p style={{ maxWidth: 700, lineHeight: 2, whiteSpace: "pre-wrap", color: "#eee6f7" }}>{a.excerpt}</p>
        <div><a href={"/magazine/" + encodeURIComponent(a.slug)} style={{ display: "inline-block", marginTop: 10, padding: "11px 18px", borderRadius: 12, background: "#d2afff", color: "#170d20", fontWeight: 700, textDecoration: "none" }}>مطالعهٔ مقاله ←</a></div>
      </div>
      {articles.length > 1 && <><button aria-label="مطلب قبلی" onClick={() => setActive(i => (i - 1 + articles.length) % articles.length)} style={{ position: "absolute", zIndex: 2, top: "50%", right: 12, borderRadius: 50, width: 42, height: 42, border: "1px solid #ffffff80", background: "#160e24b8", color: "#fff", cursor: "pointer" }}>›</button><button aria-label="مطلب بعدی" onClick={() => setActive(i => (i + 1) % articles.length)} style={{ position: "absolute", zIndex: 2, top: "50%", left: 12, borderRadius: 50, width: 42, height: 42, border: "1px solid #ffffff80", background: "#160e24b8", color: "#fff", cursor: "pointer" }}>‹</button></>}
    </div>
    <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16 }}>{articles.map((item, i) => <button key={item.id} aria-label={"نمایش مطلب " + (i + 1)} onClick={() => setActive(i)} style={{ width: i === active ? 28 : 9, height: 9, borderRadius: 99, border: 0, background: i === active ? "#caa1ff" : "#6f5b7b", cursor: "pointer", transition: "all .25s" }} />)}</div>
    <style jsx>{`@keyframes galaxyMagazineFade { from { opacity: .15; transform: scale(1.025); } to { opacity: .55; transform: scale(1); } }`}</style>
  </section>;
}
