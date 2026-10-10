import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin-auth";

const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
const CART_PREFIX="[[GALAXY_CART_ADD]]";

export async function GET(request:Request){
  const visitorId=new URL(request.url).searchParams.get("visitor_id")?.trim();
  if(!visitorId)return NextResponse.json({error:"شناسه کاربر الزامی است."},{status:400});
  const s=db();
  const {data:order,error}=await s.from("special_orders").select("*").eq("visitor_id",visitorId).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(error)return NextResponse.json({error:"دریافت وضعیت گفتگو ناموفق بود."},{status:500});
  if(!order)return NextResponse.json({active:false,status:"none",messages:[],cart_additions:[]});
  const {data:rows}=await s.from("special_order_messages").select("*").eq("special_order_id",order.id).order("created_at",{ascending:true});
  const all=rows||[];
  const cart_additions=all.filter((m:any)=>typeof m.content==="string"&&m.content.startsWith(CART_PREFIX)).map((m:any)=>{try{return {id:m.id,...JSON.parse(m.content.slice(CART_PREFIX.length))}}catch{return null}}).filter(Boolean);
  const messages=all.filter((m:any)=>!(typeof m.content==="string"&&m.content.startsWith(CART_PREFIX))).map((m:any)=>({id:m.id,role:m.role,content:m.content,created_at:m.created_at}));
  return NextResponse.json({active:["pending","in_progress"].includes(order.status),status:order.status,order_id:order.id,messages,cart_additions});
}

export async function POST(request:Request){
  try{
    const b=await request.json();
    const visitorId=String(b.visitor_id||"").trim();
    const content=String(b.content||"").trim();
    if(!visitorId||!content)return NextResponse.json({error:"پیام معتبر نیست."},{status:400});
    const s=db();
    const {data:order}=await s.from("special_orders").select("id,status").eq("visitor_id",visitorId).in("status",["pending","in_progress"]).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(!order)return NextResponse.json({error:"درخواست فعالی برای گفتگو وجود ندارد."},{status:404});
    if(order.status!=="in_progress")return NextResponse.json({error:"گفتگو هنوز توسط کارشناس آغاز نشده است."},{status:423});
    const {error}=await s.from("special_order_messages").insert({special_order_id:order.id,role:"user",content});
    if(error)return NextResponse.json({error:"ارسال پیام انجام نشد."},{status:500});
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:"ارسال پیام انجام نشد."},{status:500})}
}

export async function PUT(request:Request){
  if(!await isAdmin())return NextResponse.json({error:"دسترسی غیرمجاز است."},{status:401});
  try{
    const b=await request.json();
    const id=String(b.id||"").trim();
    const action=String(b.action||"");
    if(!id)return NextResponse.json({error:"شناسه درخواست الزامی است."},{status:400});
    const s=db();
    const {data:order,error:findError}=await s.from("special_orders").select("*").eq("id",id).maybeSingle();
    if(findError||!order)return NextResponse.json({error:"درخواست پیدا نشد."},{status:404});
    if(action==="start"){
      if(order.status!=="pending")return NextResponse.json({error:"این درخواست قبلاً تعیین تکلیف شده یا گفتگو آغاز شده است."},{status:409});
      const {error}=await s.from("special_orders").update({status:"in_progress"}).eq("id",id);
      if(error)return NextResponse.json({error:"شروع گفتگو انجام نشد."},{status:500});
      await s.from("special_order_messages").insert({special_order_id:id,role:"assistant",content:"کارشناس عطر کهکشان گفتگو را آغاز کرد. پیام‌های بعدی مستقیماً بین شما و کارشناس ردوبدل می‌شوند."});
      return NextResponse.json({ok:true});
    }
    if(action==="message"){
      const content=String(b.content||"").trim();
      if(!content)return NextResponse.json({error:"متن پیام خالی است."},{status:400});
      if(order.status!=="in_progress")return NextResponse.json({error:"ابتدا گفتگو را آغاز کنید."},{status:409});
      const {error}=await s.from("special_order_messages").insert({special_order_id:id,role:"assistant",content});
      if(error)return NextResponse.json({error:"ارسال پیام انجام نشد."},{status:500});
      return NextResponse.json({ok:true});
    }
    if(action==="add_to_cart"){
      if(order.status!=="in_progress")return NextResponse.json({error:"ابتدا گفتگو را آغاز کنید."},{status:409});
      const productId=String(b.product_id||"").trim();
      if(!productId)return NextResponse.json({error:"محصولی انتخاب نشده است."},{status:400});
      const {data:p,error:productError}=await s.from("products").select("id,name,description,price,stock,image_url,discount_percent,discount_start,discount_end,full_size_ml,price_per_ml,per_ml_discount_percent,product_sizes(size_ml,price,discount_percent,stock,is_active)").eq("id",productId).single();
      if(productError||!p||Number(p.stock)<1)return NextResponse.json({error:"محصول انتخاب‌شده موجود نیست."},{status:400});
      const now=Date.now(),start=p.discount_start?new Date(p.discount_start).getTime():-Infinity,end=p.discount_end?new Date(p.discount_end).getTime():Infinity;
      const discount=Number(p.discount_percent||0)>0&&now>=start&&now<=end?Number(p.discount_percent):0;
      const cartItem={...p,quantity:1,size_ml:Number(p.full_size_ml)||100,pricing_type:"full",unit_price:Math.round(Number(p.price)*(1-discount/100)),categories:[],category_ids:[],sizes:p.product_sizes||[]};
      const {error:messageError}=await s.from("special_order_messages").insert({special_order_id:id,role:"assistant",content:CART_PREFIX+JSON.stringify({cartItem,order_id:id})});
      if(messageError)return NextResponse.json({error:"افزودن محصول به سبد خرید انجام نشد."},{status:500});
      const {error:statusError}=await s.from("special_orders").update({status:"completed"}).eq("id",id);
      if(statusError)return NextResponse.json({error:"محصول ثبت شد اما بستن درخواست انجام نشد. با پشتیبانی تماس بگیرید."},{status:500});
      await s.from("special_order_messages").insert({special_order_id:id,role:"assistant",content:"محصول نهایی به سبد خرید شما اضافه شد و درخواست ویژه پایان یافت. اکنون می‌توانید گفتگوی جدیدی با مشاور آغاز کنید."});
      return NextResponse.json({ok:true});
    }
    return NextResponse.json({error:"عملیات ناشناخته است."},{status:400});
  }catch{return NextResponse.json({error:"انجام عملیات ناموفق بود."},{status:500})}
}

export async function DELETE(request:Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه درخواست الزامی است." }, { status: 400 });
  const supabaseAdmin = db();
  const { error } = await supabaseAdmin.from("special_orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "حذف درخواست انجام نشد." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
