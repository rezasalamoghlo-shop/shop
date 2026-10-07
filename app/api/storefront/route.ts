import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";

export const revalidate=15;

const getStorefront=unstable_cache(
  async()=>{
    const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [{data:products,error:productsError},{data:settings,error:settingsError},{data:categories,error:categoriesError},{data:links,error:linksError}]=await Promise.all([
      db.from("products").select("id,name,description,price,stock,image_url,discount_percent,discount_start,discount_end").order("created_at",{ascending:false}),
      db.from("store_settings").select("*").limit(1).maybeSingle(),
      db.from("categories").select("id,name,slug,description,sort_order").eq("is_active",true).order("sort_order").order("name"),
      db.from("product_categories").select("product_id,category_id")
    ]);
    if(productsError) throw productsError;
    if(settingsError) throw settingsError;if(categoriesError) throw categoriesError;if(linksError) throw linksError;const cats=categories??[];const productList=(products??[]).map((p:any)=>({...p,category_ids:(links??[]).filter((z:any)=>z.product_id===p.id).map((z:any)=>z.category_id),categories:(links??[]).filter((z:any)=>z.product_id===p.id).map((z:any)=>cats.find((k:any)=>k.id===z.category_id)).filter(Boolean)}));return {products:productList,settings:settings??null,categories:cats};
  },
  ["galaxy-storefront-v1"],
  {revalidate:15}
);

export async function GET(){
  try{
    const data=await getStorefront();
    return NextResponse.json(data,{
      headers:{"Cache-Control":"public, s-maxage=15, stale-while-revalidate=120"}
    });
  }catch{
    return NextResponse.json({error:"خطا در دریافت اطلاعات فروشگاه."},{status:503});
  }
}
