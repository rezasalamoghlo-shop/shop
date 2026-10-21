"use client";
import { useEffect, useState, type FormEvent } from "react";

type Article = { id: string; title: string; slug: string; excerpt: string; content: string; image_url: string; is_published: boolean; created_at: string };
const empty = { title: "", slug: "", excerpt: "", content: "", is_published: false };
const panel: React.CSSProperties = { background: "#171322", border: "1px solid #393047", borderRadius: 18, padding: 20, color: "#f8f5ff" };
const field: React.CSSProperties = { width: "100%", padding: "11px 12px", marginTop: 6, borderRadius: 10, border: "1px solid #4a405a", background: "#0f0b17", color: "#fff", boxSizing: "border-box" };
export default function AdminMagazine() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    const r = await fetch("/api/admin/magazine", { cache: "no-store" });
    if (r.status === 401) { location.href = "/admin/login"; return; }
    const d = await r.json();
    if (r.ok) setArticles(d.articles || []); else setMessage(d.error || "بارگذاری انجام نشد.");
  }
  useEffect(() => { void load(); }, []);
  function reset() { setForm(empty); setEditId(""); setImage(null); setCurrentImage(""); const input = document.getElementById("magazine-image") as HTMLInputElement | null; if (input) input.value = ""; }
  async function save(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    if (!editId && !image) { setMessage("برای مطلب جدید یک تصویر انتخاب کنید."); return; }
    setBusy(true); setMessage("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k,v]) => data.set(k, String(v)));
      if (editId) data.set("id", editId);
      if (image) data.set("image", image);
      const r = await fetch("/api/admin/magazine", { method: "POST", body: data });
      const d = await r.json();
      if (!r.ok) { setMessage(d.error || "ذخیره انجام نشد."); return; }
      setMessage("مطلب مجله ذخیره شد.");
      reset(); await load();
    } catch { setMessage("ارتباط با سرور برقرار نشد."); }
    finally { setBusy(false); }
  }
  function edit(a: Article) { setEditId(a.id); setForm({ title: a.title, slug: a.slug, excerpt: a.excerpt || "", content: a.content, is_published: a.is_published }); setCurrentImage(a.image_url); setImage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function remove(a: Article) {
    if (!confirm("مطلب «" + a.title + "» و تصویر آن حذف شود؟")) return;
    const r = await fetch("/api/admin/magazine?id=" + encodeURIComponent(a.id), { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) { setMessage(d.error || "حذف انجام نشد."); return; }
    setArticles(xs => xs.filter(x => x.id !== a.id)); if (editId === a.id) reset(); setMessage("مطلب و تصویر آن حذف شد.");
  }
  async function toggle(a: Article) {
    const data = new FormData(); data.set("id", a.id); data.set("title", a.title); data.set("slug", a.slug); data.set("excerpt", a.excerpt || ""); data.set("content", a.content); data.set("is_published", String(!a.is_published));
    const r = await fetch("/api/admin/magazine", { method: "POST", body: data }); const d = await r.json();
    if (!r.ok) { setMessage(d.error || "تغییر وضعیت انجام نشد."); return; }
    setArticles(xs => xs.map(x => x.id === a.id ? d.article : x)); setMessage(a.is_published ? "مطلب از سایت پنهان شد." : "مطلب منتشر شد.");
  }
  return <main dir="rtl" style={{ minHeight: "100vh", padding: "24px max(16px,calc((100vw - 1100px)/2))", background: "radial-gradient(circle at top,#302044,#0b0811 55%)", color: "#fff", fontFamily: "inherit" }}>
    <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 24 }}>
      <div><small style={{ color: "#c4a4ff", letterSpacing: 2 }}>GALAXY EDITORIAL</small><h1 style={{ margin: "8px 0" }}>مدیریت مجلهٔ عطر کهکشان</h1><p style={{ color: "#c7bfce", margin: 0 }}>تصویر و مقاله اضافه کن؛ مطالب منتشرشده در اسلایدر مجله و صفحهٔ اختصاصی نمایش داده می‌شوند.</p></div>
      <div style={{ display: "flex", gap: 8 }}><a href="/admin" style={{ color: "#fff", padding: 10, border: "1px solid #645675", borderRadius: 10, textDecoration: "none" }}>پنل مدیریت</a><a href="/magazine" style={{ color: "#fff", padding: 10, border: "1px solid #645675", borderRadius: 10, textDecoration: "none" }}>مشاهده مجله</a></div>
    </header>
    {message && <p role="status" style={{ background: "#292037", padding: 12, borderRadius: 10 }}>{message}</p>}
    <section style={panel}>
      <h2 style={{ marginTop: 0 }}>{editId ? "ویرایش مطلب" : "افزودن مطلب تازه"}</h2>
      <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        <label>عنوان مطلب<input required style={field} value={form.title} onChange={e => setForm(x => ({ ...x, title: e.target.value }))} placeholder="مثلاً راهنمای انتخاب عطر برای هر فصل" /></label>
        <label>نشانی انگلیسی یا فارسی (اختیاری)<input style={field} value={form.slug} onChange={e => setForm(x => ({ ...x, slug: e.target.value }))} placeholder="اگر خالی باشد از عنوان ساخته می‌شود" /></label>
        <label>خلاصه کوتاه<textarea rows={2} style={field} value={form.excerpt} onChange={e => setForm(x => ({ ...x, excerpt: e.target.value }))} placeholder="خلاصه‌ای که روی کارت مجله دیده می‌شود" /></label>
        <label>متن کامل مطلب<textarea required rows={10} style={field} value={form.content} onChange={e => setForm(x => ({ ...x, content: e.target.value }))} placeholder="متن مقاله را بنویسید. فاصله‌ها و خط‌های جدید حفظ می‌شوند." /></label>
        <label>تصویر کاور (حداکثر ۸ مگابایت){currentImage && <img src={currentImage} alt="تصویر فعلی" style={{ display: "block", width: 180, height: 120, objectFit: "cover", borderRadius: 12, marginTop: 8 }} />}<input id="magazine-image" type="file" accept="image/*" style={{ ...field, padding: 8 }} onChange={e => setImage(e.target.files?.[0] || null)} />{editId && <small style={{ color: "#b9afc7" }}>اگر تصویر جدیدی انتخاب نکنی، تصویر فعلی باقی می‌ماند.</small>}</label>
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" checked={form.is_published} onChange={e => setForm(x => ({ ...x, is_published: e.target.checked }))} /> انتشار در سایت (نمایش در اسلایدر و صفحهٔ مجله)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}><button disabled={busy} style={{ border: 0, borderRadius: 10, padding: "12px 20px", background: "#c8a5ff", color: "#160d22", fontWeight: 700, cursor: "pointer" }}>{busy ? "در حال ذخیره..." : "ذخیره مطلب"}</button>{editId && <button type="button" onClick={reset} style={{ borderRadius: 10, padding: "12px 20px", background: "transparent", color: "#fff", border: "1px solid #655777" }}>لغو ویرایش</button>}</div>
      </form>
    </section>
    <section style={{ marginTop: 26 }}>
      <h2>مطالب ثبت‌شده ({articles.length})</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {articles.map(a => <article key={a.id} style={{ ...panel, padding: 14 }}>
          <img src={a.image_url} alt={a.title} style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 12 }} />
          <h3>{a.title}</h3><p style={{ color: "#c8bfd3", whiteSpace: "pre-wrap" }}>{a.excerpt || a.content.slice(0, 150)}</p>
          <p><span style={{ color: a.is_published ? "#83e4b2" : "#edc77c" }}>{a.is_published ? "منتشرشده" : "پیش‌نویس"}</span></p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><button onClick={() => edit(a)} style={{ padding: 8, borderRadius: 8 }}>ویرایش</button><button onClick={() => void toggle(a)} style={{ padding: 8, borderRadius: 8 }}>{a.is_published ? "پنهان‌کردن" : "انتشار"}</button><button onClick={() => void remove(a)} style={{ padding: 8, borderRadius: 8, color: "#a11" }}>حذف</button>{a.is_published && <a href={"/magazine/" + encodeURIComponent(a.slug)} style={{ padding: 8, color: "#d7baff" }}>نمایش مطلب</a>}</div>
        </article>)}
      </div>
    </section>
  </main>;
}
