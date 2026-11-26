import type {MetadataRoute} from "next";
import {createClient} from "@supabase/supabase-js";

export const revalidate=3600;

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base="https://shop-gamma-wheat.vercel.app";
  const fixed:MetadataRoute.Sitemap=[
    {url:base+"/",lastModified:new Date(),changeFrequency:"daily",priority:1},
    {url:base+"/store",lastModified:new Date(),changeFrequency:"daily",priority:.9},
    {url:base+"/store/all",lastModified:new Date(),changeFrequency:"daily",priority:.85},
    {url:base+"/magazine",lastModified:new Date(),changeFrequency:"daily",priority:.8}
  ];
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return fixed;
  try{
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const [{data:categories,error:categoriesError},{data:articles,error:articlesError}]=await Promise.all([
      db.from("categories").select("slug,created_at").eq("is_active",true),
      db.from("magazine_articles").select("slug,updated_at,created_at").eq("is_published",true)
    ]);
    if(categoriesError||articlesError)throw new Error("sitemap data unavailable");
    const categoryUrls=(categories??[]).map((category:any)=>({
      url:base+"/store/"+encodeURIComponent(category.slug),
      lastModified:new Date(category.updated_at||category.created_at||Date.now()),
      changeFrequency:"weekly" as const,
      priority:.75
    }));
    const articleUrls=(articles??[]).map((article:any)=>({
      url:base+"/magazine/"+encodeURIComponent(article.slug),
      lastModified:new Date(article.updated_at||article.created_at||Date.now()),
      changeFrequency:"monthly" as const,
      priority:.65
    }));
    return fixed.concat(categoryUrls,articleUrls);
  }catch{return fixed;}
}
