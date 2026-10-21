import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://shop-gamma-wheat.vercel.app";
  const fixed: MetadataRoute.Sitemap = [{ url: base + "/", lastModified: new Date(), changeFrequency: "daily", priority: 1 }, { url: base + "/magazine", lastModified: new Date(), changeFrequency: "daily", priority: .8 }];
  try {
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await s.from("magazine_articles").select("slug,updated_at,created_at").eq("is_published", true);
    return fixed.concat((data || []).map((a: any) => ({ url: base + "/magazine/" + encodeURIComponent(a.slug), lastModified: new Date(a.updated_at || a.created_at), changeFrequency: "monthly" as const, priority: .65 })));
  } catch { return fixed; }
}
