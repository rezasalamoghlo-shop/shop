import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const {data,error}=await db.from("shipping_methods").select("id,name,description,cost,estimated_delivery").eq("is_active",true).order("sort_order").order("created_at");
    if(error)throw error;
    return NextResponse.json({methods:data||[]},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"روش‌های ارسال در دسترس نیستند."},{status:503})}
}
