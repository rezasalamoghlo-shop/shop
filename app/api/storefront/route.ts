import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";

export const revalidate=30;

const getStorefront=unstable_cache(
  async()=>{
    const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [{data:products,error:productsError},{data:settings,error:settingsError}]=await Promise.all([
      db.from("products").select("id,name,description,price,image_url,discount_percent,discount_start,discount_end").order("created_at",{ascending:false}),
      db.from("store_settings").select("*").limit(1).maybeSingle()
    ]);
    if(productsError) throw productsError;
    if(settingsError) throw settingsError;
    return {products:products??[],settings:settings??null};
  },
  ["galaxy-storefront-v1"],
  {revalidate:30}
);

export async function GET(){
  try{
    const data=await getStorefront();
    return NextResponse.json(data,{
      headers:{"Cache-Control":"public, s-maxage=30, stale-while-revalidate=300"}
    });
  }catch{
    return NextResponse.json({error:"خطا در دریافت اطلاعات فروشگاه."},{status:503});
  }
}
