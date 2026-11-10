import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

type Category = { id: string; name: string; slug: string; description: string | null };
type CategoryProduct = { id: string; name: string; description: string | null; image_url: string | null };

async function getCategory(slug: string): Promise<{ category: Category; products: CategoryProduct[] } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const db = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: category, error } = await db
    .from("categories")
    .select("id,name,slug,description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !category) return null;

  const { data: relations, error: relationError } = await db
    .from("product_categories")
    .select("product_id")
    .eq("category_id", category.id);
  if (relationError) return { category: category as Category, products: [] };

  const ids = Array.from(new Set((relations || []).map((row: any) => String(row.product_id)).filter(Boolean)));
  if (!ids.length) return { category: category as Category, products: [] };

  const { data: products } = await db
    .from("products")
    .select("id,name,description,image_url")
    .in("id", ids)
    .order("created_at", { ascending: false });

  return { category: category as Category, products: (products || []) as CategoryProduct[] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategory(slug);
  if (!result) return { title: "دسته‌بندی پیدا نشد | عطر کهکشان", robots: { index: false, follow: false } };

  const { category } = result;
  const description = (category.description || `مشاهده و خرید عطرهای دسته ${category.name} در فروشگاه عطر کهکشان.`).replace(/\s+/g, " ").trim().slice(0, 160);
  const title = `خرید عطر ${category.name} | فروشگاه عطر کهکشان`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${encodeURIComponent(category.slug)}` },
    openGraph: { title, description, siteName: "عطر کهکشان", locale: "fa_IR", type: "website" },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCategory(slug);
  if (!result) notFound();
  const { category, products } = result;
  const canonicalUrl = `https://shop-gamma-wheat.vercel.app/category/${encodeURIComponent(category.slug)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `خرید عطر ${category.name} | عطر کهکشان`,
    description: category.description || `مجموعه عطرهای دسته ${category.name} در فروشگاه عطر کهکشان.`,
    url: canonicalUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://shop-gamma-wheat.vercel.app/product/${encodeURIComponent(product.id)}`,
        name: product.name,
      })),
    },
  };

  return (
    <main dir="rtl" lang="fa" style={{ minHeight: "100vh", background: "radial-gradient(circle at top,#281735,#0a0614 60%)", color: "#f6efff", padding: "32px 18px 64px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <nav aria-label="مسیر صفحه" style={{ marginBottom: 24, color: "#cbb6dc" }}>
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>عطر کهکشان</a>
          {" / "}
          <a href="/#products" style={{ color: "inherit", textDecoration: "none" }}>فروشگاه عطر و ادکلن</a>
          {" / "}
          <span>{category.name}</span>
        </nav>
        <header style={{ marginBottom: 30 }}>
          <span style={{ color: "#d9b4ff", letterSpacing: 2 }}>GALAXY PERFUME COLLECTION</span>
          <h1 style={{ fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.5 }}>خرید عطر {category.name}</h1>
          <p style={{ color: "#d8cde3", lineHeight: 2, fontSize: 17 }}>{category.description || `در این بخش می‌توانید عطرهای دسته ${category.name} را در فروشگاه عطر کهکشان بررسی کنید.`}</p>
        </header>
        {products.length ? (
          <section aria-label={`محصولات دسته ${category.name}`} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
            {products.map((product) => (
              <article key={product.id} style={{ background: "rgba(22,14,31,.94)", border: "1px solid rgba(217,70,239,.25)", borderRadius: 18, padding: 16 }}>
                <a href={`/product/${encodeURIComponent(product.id)}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" style={{ width: "100%", height: 220, objectFit: "contain", background: "#120d1b", borderRadius: 12 }} /> : null}
                  <h2 style={{ fontSize: 20, lineHeight: 1.7 }}>{product.name}</h2>
                </a>
                {product.description ? <p style={{ color: "#cbbbd7", lineHeight: 1.9 }}>{product.description.slice(0, 180)}</p> : null}
                <a href={`/product/${encodeURIComponent(product.id)}`} style={{ color: "#d9b4ff", textDecoration: "none" }}>مشاهده مشخصات و قیمت ←</a>
              </article>
            ))}
          </section>
        ) : (
          <p>در حال حاضر محصولی در این دسته‌بندی ثبت نشده است.</p>
        )}
        <a href="/#products" style={{ display: "inline-block", marginTop: 28, padding: "12px 20px", borderRadius: 12, background: "#8a3fe0", color: "#fff", textDecoration: "none" }}>بازگشت به فروشگاه</a>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
