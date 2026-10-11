import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

const digits=(value:string)=>value.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^0-9]/g,"");
const localPhone=(value:string)=>{let d=digits(value);if(d.startsWith("00"))d=d.slice(2);if(d.startsWith("98")&&d.length===12)d="0"+d.slice(2);else if(d.length===10&&d.startsWith("9"))d="0"+d;return d};
const loginEmail=(phone:string)=>"member-"+digits(phone)+"@login.galaxy.invalid";
const phoneVariants=(phone:string)=>{const local=localPhone(phone);const intl=local.startsWith("0")&&local.length===11?"98"+local.slice(1):digits(phone);return Array.from(new Set(["+"+intl,intl,local,local.startsWith("0")?"98"+local.slice(1):""] .filter(Boolean)))};

export async function POST(request:Request){
  try{
    const body=await request.json();
    const phone=localPhone(String(body.phone||""));
    const password=String(body.password||"");
    if(!/^09[0-9]{9}$/.test(phone)||!password)return NextResponse.json({error:"شماره تماس یا رمز عبور صحیح نیست."},{status:400});
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
    const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if(!url||!serviceKey||!publicKey)return NextResponse.json({error:"تنظیمات ورود کامل نیست. لطفاً با پشتیبانی تماس بگیرید."},{status:500});
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const auth=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const {data:list,error:listError}=await admin.auth.admin.listUsers({page:1,perPage:1000});
    if(listError)return NextResponse.json({error:"بررسی حساب کاربری ممکن نشد. دوباره تلاش کنید."},{status:500});
    const user=list.users.find((u:any)=>localPhone(String(u.phone||""))===phone||u.email===loginEmail(phone));
    if(!user)return NextResponse.json({error:"شماره تماس یا رمز عبور صحیح نیست."},{status:401});

    // Use the exact phone identifier stored for this account first.
    const storedPhone=String(user.phone||"");
    const phoneAttempt=storedPhone?await auth.auth.signInWithPassword({phone:storedPhone,password}):{data:{session:null},error:null};
    if(!phoneAttempt.error&&phoneAttempt.data.session){
      return NextResponse.json({ok:true,session:phoneAttempt.data.session});
    }
    const phoneProviderUnavailable=!!phoneAttempt.error&&/provider.*disabled|phone.*disabled|unsupported.*provider/i.test(phoneAttempt.error.message||"");

    // If phone auth is disabled, a private, confirmed email alias allows
    // customers to keep entering their phone number as the username.
    let email=String(user.email||"");
    if(email===loginEmail(phone)||(!email&&phoneProviderUnavailable)){
      email=loginEmail(phone);
      if(user.email!==email){
        const {error:updateError}=await admin.auth.admin.updateUserById(user.id,{email,email_confirm:true});
        if(updateError)return NextResponse.json({error:"آماده‌سازی ورود این حساب ممکن نشد. با پشتیبانی تماس بگیرید."},{status:500});
      }
      const attempt=await auth.auth.signInWithPassword({email,password});
      if(!attempt.error&&attempt.data.session)return NextResponse.json({ok:true,session:attempt.data.session});
    }
    return NextResponse.json({error:"شماره تماس یا رمز عبور صحیح نیست. رمز را بررسی و دوباره تلاش کنید."},{status:401});
  }catch{
    return NextResponse.json({error:"ارتباط با سامانه ورود برقرار نشد. دوباره تلاش کنید."},{status:500});
  }
}
