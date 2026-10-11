import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
function normalizePhone(value:string){
  let digits=value.replace(/[^0-9]/g,"");
  if(digits.startsWith("00"))digits=digits.slice(2);
  if(digits.startsWith("0")&&digits.length===11)digits="98"+digits.slice(1);
  else if(digits.length===10&&digits.startsWith("9"))digits="98"+digits;
  return "+"+digits;
}
export async function POST(r:Request){
  try{
    const b=await r.json(),token=String(b.token||""),rawPhone=String(b.phone||""),password=String(b.password||""),fullName=String(b.full_name||"").trim();
    if(!token||!rawPhone||password.length<8)return NextResponse.json({error:"اطلاعات ثبت‌نام کامل نیست."},{status:400});
    const phone=normalizePhone(rawPhone);
    if(!/^\+[1-9][0-9]{7,14}$/.test(phone))return NextResponse.json({error:"شماره تماس معتبر نیست."},{status:400});
    const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const {data:order,error:oe}=await s.from("orders").select("id,status,phone,customer_full_name,user_id").eq("public_token",token).maybeSingle();
    if(oe||!order)return NextResponse.json({error:"سفارش پیدا نشد."},{status:404});
    if(order.status!=="paid")return NextResponse.json({error:"ساخت حساب فقط پس از تأیید پرداخت توسط مدیر امکان‌پذیر است."},{status:403});
    if(order.user_id)return NextResponse.json({error:"این سفارش قبلاً به یک حساب متصل شده است. از صفحه ورود استفاده کنید."},{status:409});
    if(normalizePhone(String(order.phone||""))!==phone)return NextResponse.json({error:"شماره تماس باید با شماره ثبت‌شده در سفارش یکسان باشد."},{status:403});
    const {data:created,error:ce}=await s.auth.admin.createUser({phone,password,phone_confirm:true,user_metadata:{full_name:fullName||order.customer_full_name||""}});
    if(ce||!created.user){
      const msg=String(ce?.message||"");
      if(/already|registered|exists/i.test(msg))return NextResponse.json({error:"این شماره قبلاً حساب دارد؛ از بخش ورود استفاده کنید."},{status:409});
      return NextResponse.json({error:"ساخت حساب انجام نشد. تنظیمات ورود با شماره تماس را بررسی کنید."},{status:500});
    }
    const {error:linkError}=await s.from("orders").update({user_id:created.user.id}).eq("id",order.id).is("user_id",null);
    if(linkError){await s.auth.admin.deleteUser(created.user.id);return NextResponse.json({error:"اتصال سفارش به حساب انجام نشد."},{status:500})}
    return NextResponse.json({ok:true,phone});
  }catch{return NextResponse.json({error:"خطا در ساخت حساب کاربری."},{status:500})}
}
