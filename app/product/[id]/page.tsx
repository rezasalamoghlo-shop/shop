import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

type ProductSize = {
  id: string;
  size_ml: number;
  price: number;
  discount_percent: number;
  stock: number;
  is_active: boolean;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  discount_percent: number;
  discount_start: string | null;
  discount_end: string | null;
  full_size_ml: number;
  price_per_ml: number;
  per_ml_discount_percent: number;
  created_at: string | null;
  sizes: ProductSize[];
};

async function getProduct(id: string): Promise<Product | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const db = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: product, error } = await db
    .from("products")
    .select("id,name,description,price,stock,image_url,discount_percent,discount_start,discount_end,full_size_ml,price_per_ml,per_ml_discount_percent,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !product) return null;

  const { data: sizes } = await db
    .from("product_sizes")
    .select("id,size_ml,price,discount_percent,stock,is_active")
    .eq("product_id", id)
    .eq("is_active", true)
    .order("size_ml", { ascending: true });

  return { ...product, sizes: (sizes || []) as ProductSize[] } as Product;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(value)) + " تومان";

function getSizePrice(product: Product, size: ProductSize) {
  const base = Number(size.price) > 0
    ? Number(size.price)
    : (Number(product.price_per_ml) || Number(product.price) / Math.max(1, Number(product.full_size_ml) || 100)) * Number(size.size_ml);
  const discount = Math.max(0, Math.min(100, Number(size.discount_percent) || 0));
  return Math.round(base * (1 - discount / 100));
}

function getAvailableSizes(product: Product) {
  return (product.sizes || [])
    .filter((size) => size.is_active && Number(size.size_ml) > 0)
    .map((size) => ({
      ...size,
      calculatedPrice: getSizePrice(product, size),
      availableUnits: Math.floor(Math.max(0, Number(product.stock) || 0) / Math.max(1, Number(size.size_ml))),
    }));
}

function getProductJsonLd(product: Product, canonicalUrl: string) {
  const sizes = getAvailableSizes(product);
  const purchasable = sizes.filter((size) => size.calculatedPrice > 0);
  const lowestPrice = purchasable.length
    ? Math.min(...purchasable.map((size) => size.calculatedPrice))
    : null;
  const inStock = purchasable.some((size) => size.availableUnits > 0);
  const description = (product.description || "").replace(/\s+/g, " ").trim().slice(0, 5000);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.id,
    url: canonicalUrl,
    ...(product.image_url ? { image: [product.image_url] } : {}),
    ...(lowestPrice !== null ? {
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "IRR",
        price: String(Math.round(lowestPrice * 10)),
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "عطر کهکشان" },
      },
    } : {}),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return {
      title: "محصول پیدا نشد | عطر کهکشان",
      robots: { index: false, follow: false },
    };
  }

  const description = (product.description || `مشاهده مشخصات، توضیحات و حجم‌های قابل سفارش عطر ${product.name} در فروشگاه عطر کهکشان.`)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const title = `خرید ${product.name} | مشخصات و قیمت در عطر کهکشان`;
  return {
    title,
    description,
    alternates: { canonical: `/product/${encodeURIComponent(product.id)}` },
    openGraph: {
      title,
      description,
      url: `/product/${encodeURIComponent(product.id)}`,
      siteName: "عطر کهکشان",
      locale: "fa_IR",
      type: "website",
      ...(product.image_url ? { images: [product.image_url] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const sizes = getAvailableSizes(product);
  const canonicalUrl = `https://shop-gamma-wheat.vercel.app/product/${encodeURIComponent(product.id)}`;
  const jsonLd = getProductJsonLd(product, canonicalUrl);

  return (
    <main dir="rtl" lang="fa" style={{ minHeight: "100vh", background: "radial-gradient(circle at top,#281735,#0a0614 60%)", color: "#f6efff", padding: "32px 18px 64px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <nav aria-label="مسیر صفحه" style={{ marginBottom: 24, color: "#cbb6dc" }}>
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>عطر کهکشان</a>
          {" / "}
          <a href="/#products" style={{ color: "inherit", textDecoration: "none" }}>فروشگاه عطر و ادکلن</a>
          {" / "}
          <span>{product.name}</span>
        </nav>
        <article style={{ display: "grid", gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.15fr)", gap: 32, alignItems: "start", background: "rgba(22,14,31,.94)", border: "1px solid rgba(217,70,239,.25)", borderRadius: 24, padding: "clamp(18px,4vw,40px)" }}>
          <div>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ width: "100%", maxHeight: 520, objectFit: "contain", borderRadius: 18, background: "#120d1b" }} />
            ) : (
              <div role="img" aria-label={product.name} style={{ minHeight: 300, display: "grid", placeItems: "center", borderRadius: 18, background: "#120d1b", color: "#d9b4ff", fontSize: 56 }}>✦</div>
            )}
          </div>
          <div>
            <span style={{ color: "#d9b4ff", letterSpacing: 2 }}>GALAXY PERFUME STORE</span>
            <h1 style={{ fontSize: "clamp(28px,5vw,44px)", lineHeight: 1.6, margin: "12px 0" }}>{product.name}</h1>
            <p style={{ color: "#d8cde3", lineHeight: 2, fontSize: 17 }}>خرید {product.name} از فروشگاه عطر کهکشان؛ مشاهده توضیحات، مشخصات رایحه، حجم‌های فعال و قیمت‌های ثبت‌شده در فروشگاه.</p>
            <section aria-labelledby="product-sizes-title" style={{ marginTop: 28 }}>
              <h2 id="product-sizes-title" style={{ fontSize: 22 }}>حجم‌ها و قیمت‌های قابل سفارش</h2>
              {sizes.length ? (
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
                  {sizes.map((size) => (
                    <li key={size.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: 14, border: "1px solid #493455", borderRadius: 12 }}>
                      <span>{size.size_ml} میلی‌لیتر</span>
                      <strong>{formatPrice(size.calculatedPrice)}</strong>
                      <span style={{ color: size.availableUnits > 0 ? "#b9e6c8" : "#e9a5a5" }}>{size.availableUnits > 0 ? "موجود" : "ناموجود"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>در حال حاضر حجم فعالی برای سفارش این محصول ثبت نشده است.</p>
              )}
            </section>
          </div>
          <section style={{ gridColumn: "1 / -1", borderTop: "1px solid #493455", paddingTop: 24 }}>
            <h2 style={{ fontSize: 24 }}>توضیحات و مشخصات عطر {product.name}</h2>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 2.3, color: "#e4d9ed", fontSize: 17 }}>
              {product.description || "توضیحی برای این محصول ثبت نشده است."}
            </div>
          </section>
        </article>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <a href="/#products" style={{ display: "inline-block", padding: "12px 20px", borderRadius: 12, background: "#8a3fe0", color: "#fff", textDecoration: "none" }}>بازگشت به فروشگاه و افزودن به سبد خرید</a>
          <a href="/magazine" style={{ display: "inline-block", padding: "12px 20px", borderRadius: 12, border: "1px solid #80618f", color: "#f6efff", textDecoration: "none" }}>مطالعه مجله عطر کهکشان</a>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <style>{`@media(max-width:720px){article{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}
