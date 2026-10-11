import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
function normalizePhone(value:string){let d=value.replace(/[^0-9]/g,"");if(d.startsWith("00"))d=d.slice(2);if(d.startsWith("0")&&d.length===11)d="98"+d.slice(1);else if(d.length===10&&d.startsWith("9"))d="98"+d;return "+"+d}
export async function POST(r:Request){
  try{
    const b=await r.json(),token=String(b.token||"");
    if(!token)return NextResponse.json({error:"شناسه سفارش نامعتبر است."},{status:400});
    const access=(r.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
    if(!access)return NextResponse.json({error:"ورود لازم است."},{status:401});
    const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const {data:{user},error:ue}=await s.auth.getUser(access);
    if(ue||!user)return NextResponse.json({error:"جلسه کاربر معتبر نیست."},{status:401});
    const {data:o,error}=await s.from("orders").select("id,status,payment_status,phone,user_id").eq("public_token",token).maybeSingle();
    if(error||!o)return NextResponse.json({error:"سفارش پیدا نشد."},{status:404});
    if(o.payment_status!=="paid"&&o.status!=="paid")return NextResponse.json({error:"اتصال سفارش فقط پس از تأیید پرداخت ممکن است."},{status:403});
    if(!user.phone||normalizePhone(user.phone)!==normalizePhone(String(o.phone||"")))return NextResponse.json({error:"شماره تماس حساب با سفارش یکسان نیست."},{status:403});
    if(o.user_id&&o.user_id!==user.id)return NextResponse.json({error:"این سفارش به حساب دیگری متصل است."},{status:409});
    if(o.user_id===user.id)return NextResponse.json({ok:true,attached:true});
    const {data:updated,error:linkError}=await s.from("orders").update({user_id:user.id}).eq("id",o.id).is("user_id",null).select("id").maybeSingle();
    if(linkError)return NextResponse.json({error:"اتصال سفارش انجام نشد."},{status:500});
    return NextResponse.json({ok:true,attached:!!updated});
  }catch{return NextResponse.json({error:"خطا در اتصال سفارش."},{status:500})}
}