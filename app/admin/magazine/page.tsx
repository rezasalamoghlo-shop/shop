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
    if (!editId && articles.length >= 5) { setMessage("حداکثر ۵ مطلب برای مجله مجاز است. ابتدا یکی از مطالب قبلی را حذف کنید."); return; }
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
  return <main className="galaxy-magazine-admin" dir="rtl" style={{ minHeight: "100vh", padding: "24px max(16px,calc((100vw - 1100px)/2))", background: "radial-gradient(circle at top,#302044,#0b0811 55%)", color: "#fff", fontFamily: "inherit" }}>
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18, marginBottom: 26, padding: "22px 24px", border: "1px solid #40314f", borderRadius: 20, background: "linear-gradient(135deg,#21152e,#130e1b 70%)", boxShadow: "0 16px 40px #0002" }}>
      <div style={{ maxWidth: 650 }}><small style={{ color: "#c4a4ff", letterSpacing: 2 }}>GALAXY EDITORIAL · مدیریت محتوا</small><h1 style={{ display: "block", position: "static", margin: "10px 0 12px", padding: 0, fontSize: "clamp(25px,4vw,34px)", lineHeight: 1.5, color: "#fff", textAlign: "right" }}>مدیریت مجلهٔ عطر کهکشان</h1><p style={{ display: "block", position: "static", color: "#c7bfce", margin: 0, padding: 0, lineHeight: 2, fontSize: 14, textAlign: "right" }}>هر مطلب یک صفحه از مجله است: تصویر، عنوان و متن را وارد کن و پس از انتشار، در مجلهٔ صفحهٔ اصلی نمایش داده می‌شود. صفحه‌ها هر ۱۵ ثانیه جابه‌جا می‌شوند.</p></div>
      <nav aria-label="دسترسی سریع" style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        <a href="/admin" style={{ color: "#fff", padding: "11px 14px", border: "1px solid #645675", borderRadius: 11, textDecoration: "none", background: "#ffffff08" }}>← مدیریت فروشگاه</a>
        <a href="/#magazine" style={{ color: "#1b1023", padding: "11px 14px", border: "1px solid #d0adf5", borderRadius: 11, textDecoration: "none", background: "#d0adf5", fontWeight: 700 }}>پیش‌نمایش مجله ↗</a>
      </nav>
    </div>
    {message && <p role="status" style={{ background: "#292037", padding: 12, borderRadius: 10 }}>{message}</p>}
    <section style={{ ...panel, maxWidth: 900, margin: "0 auto", boxShadow: "0 14px 36px #0002", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div><h2 style={{ display: "block", margin: "0 0 8px", lineHeight: 1.6, fontSize: 22, color: "#fff" }}>{editId ? "ویرایش صفحهٔ مجله" : "افزودن صفحهٔ جدید"}</h2><p style={{ display: "block", color: "#bdb1ca", margin: 0, fontSize: 14, lineHeight: 1.9 }}>عنوان و متن را بنویس، تصویر را انتخاب کن و در پایان منتشر کن.</p></div>
        <span style={{ border: "1px solid #5c4770", color: "#d9c2f4", borderRadius: 99, padding: "6px 11px", fontSize: 13 }}>{editId ? "حالت ویرایش" : "صفحهٔ تازه"}</span>
      </div>
      <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
        <label>عنوان مطلب<input required style={field} value={form.title} onChange={e => setForm(x => ({ ...x, title: e.target.value }))} placeholder="مثلاً راهنمای انتخاب عطر برای هر فصل" /></label>
        <label>نشانی انگلیسی یا فارسی (اختیاری)<input style={field} value={form.slug} onChange={e => setForm(x => ({ ...x, slug: e.target.value }))} placeholder="اگر خالی باشد از عنوان ساخته می‌شود" /></label>
        <label>خلاصه کوتاه<textarea rows={2} style={field} value={form.excerpt} onChange={e => setForm(x => ({ ...x, excerpt: e.target.value }))} placeholder="خلاصه‌ای که روی کارت مجله دیده می‌شود" /></label>
        <label>متن کامل مطلب<textarea required rows={10} style={field} value={form.content} onChange={e => setForm(x => ({ ...x, content: e.target.value }))} placeholder="متن مقاله را بنویسید. فاصله‌ها و خط‌های جدید حفظ می‌شوند." /></label>
        <label>تصویر کاور (حداکثر ۸ مگابایت){currentImage && <img src={currentImage} alt="تصویر فعلی" style={{ display: "block", width: 180, height: 120, objectFit: "cover", borderRadius: 12, marginTop: 8 }} />}<input id="magazine-image" type="file" accept="image/*" style={{ ...field, padding: 8 }} onChange={e => setImage(e.target.files?.[0] || null)} />{editId && <small style={{ color: "#b9afc7" }}>اگر تصویر جدیدی انتخاب نکنی، تصویر فعلی باقی می‌ماند.</small>}</label>
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" checked={form.is_published} onChange={e => setForm(x => ({ ...x, is_published: e.target.checked }))} /> انتشار در سایت (نمایش در مجلهٔ صفحهٔ اصلی)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}><button disabled={busy || (!editId && articles.length >= 5)} style={{ border: 0, borderRadius: 10, padding: "12px 20px", background: "#c8a5ff", color: "#160d22", fontWeight: 700, cursor: "pointer" }}>{busy ? "در حال ذخیره..." : (!editId && articles.length >= 5 ? "ظرفیت ۵ مطلب تکمیل است" : "ذخیره مطلب")}</button>{editId && <button type="button" onClick={reset} style={{ borderRadius: 10, padding: "12px 20px", background: "transparent", color: "#fff", border: "1px solid #655777" }}>لغو ویرایش</button>}</div>
      </form>
    </section>
    <section style={{ marginTop: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div><h2 style={{ display: "block", margin: 0, fontSize: 23, lineHeight: 1.7, color: "#fff" }}>صفحه‌های مجله</h2><p style={{ display: "block", color: "#bdb1ca", margin: "6px 0 0", lineHeight: 1.9 }}>مطالب را ویرایش کن، موقتاً پنهان کن یا حذف کن. حداکثر ۵ مطلب قابل ثبت است.</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ border: "1px solid #3b755e", color: "#9ae5bd", borderRadius: 10, padding: "8px 11px" }}>منتشرشده: {articles.filter(a=>a.is_published).length.toLocaleString("fa-IR")}</span>
          <span style={{ border: "1px solid #66543a", color: "#f0d28e", borderRadius: 10, padding: "8px 11px" }}>پیش‌نویس: {articles.filter(a=>!a.is_published).length.toLocaleString("fa-IR")}</span>
          <span style={{ border: "1px solid #645675", color: "#e6d9f4", borderRadius: 10, padding: "8px 11px" }}>مجموع: {articles.length.toLocaleString("fa-IR")} از ۵</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 18, alignItems: "stretch" }}>
        {articles.map(a => <article key={a.id} style={{ ...panel, padding: 14, display: "flex", flexDirection: "column", gap: 10, minWidth: 0, overflow: "hidden", boxShadow: "0 10px 28px #0002" }}>
          <img src={a.image_url} alt={a.title} style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 12 }} />
          <h3 style={{ display: "block", margin: "6px 0 0", lineHeight: 1.8, fontSize: 18, overflowWrap: "anywhere", color: "#fff" }}>{a.title}</h3><p style={{ display: "block", color: "#c8bfd3", whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 2, margin: 0, fontSize: 14 }}>{a.excerpt || a.content.slice(0, 150)}</p>
          <p><span style={{ color: a.is_published ? "#83e4b2" : "#edc77c" }}>{a.is_published ? "منتشرشده" : "پیش‌نویس"}</span></p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><button onClick={() => edit(a)} style={{ padding: 8, borderRadius: 8 }}>ویرایش</button><button onClick={() => void toggle(a)} style={{ padding: 8, borderRadius: 8 }}>{a.is_published ? "پنهان‌کردن" : "انتشار"}</button><button onClick={() => void remove(a)} style={{ padding: 8, borderRadius: 8, color: "#a11" }}>حذف</button>{a.is_published && <a href={"/magazine/" + encodeURIComponent(a.slug)} style={{ padding: 8, color: "#d7baff" }}>نمایش مطلب</a>}</div>
        </article>)}
      </div>
    </section>
  </main>;
}
