import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
const digits=(v:string)=>v.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^0-9]/g,"");
const localPhone=(v:string)=>{let d=digits(v);if(d.startsWith("00"))d=d.slice(2);if(d.startsWith("98")&&d.length===12)d="0"+d.slice(2);else if(d.length===10&&d.startsWith("9"))d="0"+d;return d};
const alias=(phone:string)=>"member-"+digits(phone)+"@login.galaxy.invalid";
export async function POST(r:Request){
 try{
  const token=(r.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const b=await r.json();const oldPassword=String(b.old_password||""),newPassword=String(b.new_password||""),confirm=String(b.confirm_password||"");
  if(!token)return NextResponse.json({error:"ابتدا وارد حساب شوید."},{status:401});
  if(newPassword.length<8)return NextResponse.json({error:"رمز جدید باید حداقل ۸ نویسه داشته باشد."},{status:400});
  if(newPassword!==confirm)return NextResponse.json({error:"رمز جدید و تأیید آن یکسان نیستند."},{status:400});
  if(!oldPassword)return NextResponse.json({error:"رمز قبلی را وارد کنید."},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!,service=process.env.SUPABASE_SERVICE_ROLE_KEY!,publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:verified,error:verifyError}=await admin.auth.getUser(token);
  if(verifyError||!verified.user)return NextResponse.json({error:"نشست ورود منقضی شده است؛ دوباره وارد شوید."},{status:401});
  const u=verified.user;const auth=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  let valid=false;
  if(u.phone){const result=await auth.auth.signInWithPassword({phone:u.phone,password:oldPassword});valid=!!result.data.session&&!result.error}
  if(!valid){
   let email=String(u.email||"");
   if(!email||email.endsWith("@login.galaxy.invalid"))email=alias(localPhone(String(u.phone||u.user_metadata?.phone||"")));
   if(email&&!email.includes("undefined")){const result=await auth.auth.signInWithPassword({email,password:oldPassword});valid=!!result.data.session&&!result.error}
  }
  if(!valid)return NextResponse.json({error:"رمز قبلی صحیح نیست."},{status:400});
  const {error}=await admin.auth.admin.updateUserById(u.id,{password:newPassword});
  if(error)return NextResponse.json({error:"تغییر رمز انجام نشد؛ دوباره تلاش کنید."},{status:500});
  return NextResponse.json({ok:true,message:"رمز عبور با موفقیت تغییر کرد."});
 }catch{return NextResponse.json({error:"خطا در تغییر رمز عبور."},{status:500})}
}