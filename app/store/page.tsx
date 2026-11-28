import type {Metadata} from "next";
import {createClient} from "@supabase/supabase-js";
import StoreCategories from "@/app/components/store-categories";

export const revalidate=60;
export const metadata:Metadata={
  title:"فروشگاه عطر کهکشان | دسته‌بندی و خرید عطر",
  description:"دسته‌بندی عطرها و ادکلن‌های فروشگاه عطر کهکشان را ببینید، نام رایحه دلخواهتان را جست‌وجو کنید و محصولات را بررسی کنید.",
  alternates:{canonical:"/store"}
};

type StoreCategory={id:string;name:string;slug:string;description:string|null;sort_order:number};
type StoreProduct={id:string;category_ids:string[]};

async function getStoreCategories(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return {categories:[] as StoreCategory[],products:[] as StoreProduct[]};
  try{
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const [{data:categories,error:categoryError},{data:products,error:productError},{data:links,error:linkError}]=await Promise.all([
      db.from("categories").select("id,name,slug,description,sort_order").eq("is_active",true).order("sort_order").order("name"),
      db.from("products").select("id"),
      db.from("product_categories").select("product_id,category_id")
    ]);
    if(categoryError||productError||linkError)throw new Error("store categories unavailable");
    const categoryIdsByProduct=new Map<string,string[]>();
    for(const link of links??[]){
      const ids=categoryIdsByProduct.get(link.product_id)||[];
      ids.push(link.category_id);
      categoryIdsByProduct.set(link.product_id,ids);
    }
    return {
      categories:(categories??[]) as StoreCategory[],
      products:(products??[]).map(product=>({id:product.id,category_ids:categoryIdsByProduct.get(product.id)||[]})) as StoreProduct[]
    };
  }catch{
    return {categories:[] as StoreCategory[],products:[] as StoreProduct[]};
  }
}

export default async function StorePage(){
  const {categories,products}=await getStoreCategories();
  return <StoreCategories categories={categories} products={products}/>;
}
