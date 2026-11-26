import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const dynamic="force-dynamic";
export const revalidate=0;

async function getStorefront(){
    const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const [{data:products,error:productsError},{data:settings,error:settingsError},{data:categories,error:categoriesError},{data:links,error:linksError},{data:sizes,error:sizesError}]=await Promise.all([
      db.from("products").select("id,name,description,price,stock,image_url,discount_percent,discount_start,discount_end,full_size_ml,price_per_ml,per_ml_discount_percent").order("created_at",{ascending:false}),
      db.from("store_settings").select("*").limit(1).maybeSingle(),
      db.from("categories").select("id,name,slug,description,sort_order").eq("is_active",true).order("sort_order").order("name"),
      db.from("product_categories").select("product_id,category_id"),
      db.from("product_sizes").select("id,product_id,size_ml,price,discount_percent,stock,is_active").order("size_ml")
    ]);
    if(productsError) throw productsError;
    if(settingsError) throw settingsError;
    if(categoriesError) throw categoriesError;
    if(linksError) throw linksError;
    if(sizesError) throw sizesError;

    const categoryById=new Map<string,any>((categories??[]).map((category:any)=>[String(category.id),category] as [string,any]));
    const linksByProduct=new Map<string,string[]>();
    for(const link of links??[]){
      const list=linksByProduct.get(link.product_id)||[];
      list.push(link.category_id);
      linksByProduct.set(link.product_id,list);
    }
    const sizesByProduct=new Map<string,any[]>();
    for(const size of sizes??[]){
      const list=sizesByProduct.get(size.product_id)||[];
      list.push(size);
      sizesByProduct.set(size.product_id,list);
    }
    const productList=(products??[]).map((product:any)=>{
      const categoryIds=linksByProduct.get(product.id)||[];
      const productSizes=sizesByProduct.get(product.id)||[];
      return {
        ...product,
        category_ids:categoryIds,
        categories:categoryIds.map(id=>categoryById.get(id)).filter(Boolean),
        sizes:productSizes.map((size:any)=>({
          ...size,
          stock:Math.floor(Number(product.stock||0)/Math.max(1,Number(size.size_ml)||1))
        }))
      };
    });
    return {products:productList,settings:settings??null,categories:categories??[]};
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
