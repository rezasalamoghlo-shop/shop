import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {isAdmin} from "@/lib/admin-auth";
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET(){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data,error}=await db().from("shipping_methods").select("*").order("sort_order").order("created_at");
  if(error)return NextResponse.json({error:"دریافت روش‌های ارسال ناموفق بود."},{status:500});
  return NextResponse.json({methods:data||[]});
}
export async function POST(r:Request){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const b=await r.json(),name=String(b.name||"").trim(),cost=Number(b.cost);
    if(!name||!Number.isFinite(cost)||cost<0||!String(b.estimated_delivery||"").trim())return NextResponse.json({error:"نام، هزینه معتبر و زمان تحویل را وارد کنید."},{status:400});
    const {data,error}=await db().from("shipping_methods").insert({name,description:String(b.description||"").trim()||null,cost,estimated_delivery:String(b.estimated_delivery).trim(),is_active:b.is_active!==false,sort_order:Number(b.sort_order)||0}).select("*").single();
    if(error)throw error;return NextResponse.json({method:data});
  }catch{return NextResponse.json({error:"ذخیره روش ارسال انجام نشد."},{status:500})}
}
export async function PUT(r:Request){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const b=await r.json(),id=String(b.id||""),name=String(b.name||"").trim(),cost=Number(b.cost);
    if(!id||!name||!Number.isFinite(cost)||cost<0||!String(b.estimated_delivery||"").trim())return NextResponse.json({error:"اطلاعات روش ارسال کامل نیست."},{status:400});
    const {data,error}=await db().from("shipping_methods").update({name,description:String(b.description||"").trim()||null,cost,estimated_delivery:String(b.estimated_delivery).trim(),is_active:b.is_active!==false,sort_order:Number(b.sort_order)||0,updated_at:new Date().toISOString()}).eq("id",id).select("*").single();
    if(error)throw error;return NextResponse.json({method:data});
  }catch{return NextResponse.json({error:"ویرایش روش ارسال انجام نشد."},{status:500})}
}
export async function DELETE(r:Request){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  const id=new URL(r.url).searchParams.get("id");
  if(!id)return NextResponse.json({error:"شناسه روش ارسال لازم است."},{status:400});
  const {error}=await db().from("shipping_methods").delete().eq("id",id);
  if(error)return NextResponse.json({error:"حذف روش ارسال انجام نشد."},{status:500});
  return NextResponse.json({ok:true});
}
