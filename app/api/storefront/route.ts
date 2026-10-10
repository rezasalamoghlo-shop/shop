import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const dynamic="force-dynamic";
export const revalidate=0;

async function getStorefront(){
    const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [{data:products,error:productsError},{data:settings,error:settingsError},{data:categories,error:categoriesError},{data:links,error:linksError},{data:sizes,error:sizesError}]=await Promise.all([
      db.from("products").select("id,name,description,price,stock,image_url,discount_percent,discount_start,discount_end,full_size_ml,price_per_ml,per_ml_discount_percent").order("created_at",{ascending:false}),
      db.from("store_settings").select("*").limit(1).maybeSingle(),
      db.from("categories").select("id,name,slug,description,sort_order").eq("is_active",true).order("sort_order").order("name"),
      db.from("product_categories").select("product_id,category_id"),
      db.from("product_sizes").select("id,product_id,size_ml,price,discount_percent,stock,is_active").eq("is_active",true).order("size_ml")
    ]);
    if(productsError) throw productsError;
    if(settingsError) throw settingsError;if(categoriesError) throw categoriesError;if(linksError) throw linksError;if(sizesError) throw sizesError;const cats=categories??[];const productList=(products??[]).map((p:any)=>({...p,category_ids:(links??[]).filter((z:any)=>z.product_id===p.id).map((z:any)=>z.category_id),categories:(links??[]).filter((z:any)=>z.product_id===p.id).map((z:any)=>cats.find((k:any)=>k.id===z.category_id)).filter(Boolean),sizes:(sizes??[]).filter((z:any)=>z.product_id===p.id)}));return {products:productList,settings:settings??null,categories:cats};
}

export async function GET(){
  try{
    const data=await getStorefront();
    return NextResponse.json(data,{
      headers:{"Cache-Control":"no-store, no-cache, must-revalidate, max-age=0"}
    });
  }catch{
    return NextResponse.json({error:"خطا در دریافت اطلاعات فروشگاه."},{status:503});
  }
}
