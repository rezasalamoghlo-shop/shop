import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

const BASE_URL = "https://shop-gamma-wheat.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed: MetadataRoute.Sitemap = [
    { url: BASE_URL + "/", changeFrequency: "daily", priority: 1 },
    { url: BASE_URL + "/magazine", changeFrequency: "weekly", priority: 0.8 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return fixed;

  try {
    const db = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const [productsResult, articlesResult] = await Promise.all([
      db.from("products").select("id,created_at").order("created_at", { ascending: false }),
      db.from("magazine_articles").select("slug,updated_at,created_at").eq("is_published", true),
    ]);

    const products: MetadataRoute.Sitemap = (productsResult.data || []).map((product: any) => ({
      url: BASE_URL + "/product/" + encodeURIComponent(product.id),
      lastModified: product.created_at ? new Date(product.created_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

    const articles: MetadataRoute.Sitemap = (articlesResult.data || []).map((article: any) => ({
      url: BASE_URL + "/magazine/" + encodeURIComponent(article.slug),
      lastModified: article.updated_at || article.created_at
        ? new Date(article.updated_at || article.created_at)
        : undefined,
      changeFrequency: "monthly",
      priority: 0.65,
    }));

    return fixed.concat(products, articles);
  } catch {
    return fixed;
  }
}
