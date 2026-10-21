import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const imagePath = (url: string | null) => {
  if (!url) return null;
  try { const u = new URL(url); const marker = "/storage/v1/object/public/product-images/"; const i = u.pathname.indexOf(marker); return i >= 0 ? decodeURIComponent(u.pathname.slice(i + marker.length)) : null; } catch { return null; }
};
const slugify = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("fa").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "magazine-article";

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await db().from("magazine_articles").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "دریافت مطالب مجله انجام نشد." }, { status: 500 });
  return NextResponse.json({ articles: data || [] });
}
export async function POST(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "نشست مدیریت معتبر نیست؛ دوباره وارد پنل شوید." }, { status: 401 });
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const title = String(form.get("title") || "").trim();
  const excerpt = String(form.get("excerpt") || "").trim();
  const content = String(form.get("content") || "").trim();
  const is_published = String(form.get("is_published") || "false") === "true";
  const file = form.get("image");
  if (!title || !content) return NextResponse.json({ error: "عنوان و متن مطلب الزامی است." }, { status: 400 });
  if (file instanceof File && file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "حجم تصویر باید کمتر از ۸ مگابایت باشد." }, { status: 400 });
  if (file instanceof File && file.size && !file.type.startsWith("image/")) return NextResponse.json({ error: "فایل انتخاب‌شده باید تصویر باشد." }, { status: 400 });
  const s = db();
  let previous: any = null;
  if (id) {
    const old = await s.from("magazine_articles").select("*").eq("id", id).maybeSingle();
    if (old.error || !old.data) return NextResponse.json({ error: "مطلب پیدا نشد." }, { status: 404 });
    previous = old.data;
  }
  let image_url = previous?.image_url || "";
  let uploadedPath: string | null = null;
  if (file instanceof File && file.size) {
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "webp";
    uploadedPath = "magazine/" + crypto.randomUUID() + "." + ext;
    const upload = await s.storage.from("product-images").upload(uploadedPath, file, { contentType: file.type, upsert: false });
    if (upload.error) return NextResponse.json({ error: "آپلود تصویر انجام نشد؛ دوباره تلاش کنید." }, { status: 500 });
    image_url = s.storage.from("product-images").getPublicUrl(uploadedPath).data.publicUrl;
  }
  if (!image_url) return NextResponse.json({ error: "برای مطلب یک تصویر انتخاب کنید." }, { status: 400 });
  let slug = slugify(String(form.get("slug") || title));
  const duplicate = await s.from("magazine_articles").select("id").eq("slug", slug).neq("id", id || "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (duplicate.data) slug = slug + "-" + (id ? id.slice(0, 6) : crypto.randomUUID().slice(0, 6));
  const row = { title, slug, excerpt, content, image_url, is_published, updated_at: new Date().toISOString() };
  const saved = id ? await s.from("magazine_articles").update(row).eq("id", id).select("*").single() : await s.from("magazine_articles").insert(row).select("*").single();
  if (saved.error) {
    if (uploadedPath) await s.storage.from("product-images").remove([uploadedPath]);
    return NextResponse.json({ error: "ذخیره مطلب انجام نشد." }, { status: 500 });
  }
  if (uploadedPath && previous?.image_url) {
    const oldPath = imagePath(previous.image_url);
    if (oldPath) await s.storage.from("product-images").remove([oldPath]);
  }
  return NextResponse.json({ ok: true, article: saved.data });
}
export async function DELETE(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه مطلب نامعتبر است." }, { status: 400 });
  const s = db();
  const old = await s.from("magazine_articles").select("image_url").eq("id", id).maybeSingle();
  if (old.error) return NextResponse.json({ error: "دریافت مطلب انجام نشد." }, { status: 500 });
  const deleted = await s.from("magazine_articles").delete().eq("id", id);
  if (deleted.error) return NextResponse.json({ error: "حذف مطلب انجام نشد." }, { status: 500 });
  const path = imagePath(old.data?.image_url || null);
  if (path) await s.storage.from("product-images").remove([path]);
  return NextResponse.json({ ok: true });
}
