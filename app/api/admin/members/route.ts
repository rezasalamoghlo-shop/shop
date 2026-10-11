import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {isAdmin} from "@/lib/admin-auth";
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
const validId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const s=db();const [{data:profiles,error:pe},{data:authData,error:ae}]=await Promise.all([s.from("profiles").select("id,full_name,email,member_since,created_at,discount_percent,discount_active").order("member_since",{ascending:false}),s.auth.admin.listUsers({page:1,perPage:1000})]);if(pe||ae)throw pe||ae;const users=authData.users||[];const members=(profiles||[]).map((p:any)=>{const u=users.find((x:any)=>x.id===p.id);return{id:p.id,full_name:p.full_name||u?.user_metadata?.full_name||"",phone:u?.phone||"",email:([p.email,u?.email].find((value:any)=>value&&!String(value).endsWith("@login.galaxy.invalid"))||""),member_since:p.member_since||p.created_at||u?.created_at||null,discount_percent:Number(p.discount_percent||0),discount_active:Boolean(p.discount_active)}});return NextResponse.json({members})}catch{return NextResponse.json({error:"دریافت اعضای باشگاه انجام نشد."},{status:500})}
}
export async function PATCH(r:Request){
 if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const b=await r.json();
  const ids=Array.from(new Set<string>((Array.isArray(b.ids)?b.ids:[b.id]).map((x:any)=>String(x||""))));
  if(!ids.length||ids.length>500||ids.some(id=>!validId(id)))return NextResponse.json({error:"فهرست اعضا معتبر نیست."},{status:400});
  if(Object.prototype.hasOwnProperty.call(b,"new_password")){
   const password=String(b.new_password||"");
   if(ids.length!==1)return NextResponse.json({error:"رمز عبور فقط برای یک عضو در هر بار تغییر داده می‌شود."},{status:400});
   if(password.length<8)return NextResponse.json({error:"رمز جدید باید حداقل ۸ نویسه داشته باشد."},{status:400});
   const s=db();const {data:target,error:targetError}=await s.auth.admin.getUserById(ids[0]);
   if(targetError||!target?.user)return NextResponse.json({error:"عضو پیدا نشد."},{status:404});
   const {error:passwordError}=await s.auth.admin.updateUserById(ids[0],{password});
   if(passwordError)return NextResponse.json({error:"تغییر رمز عضو انجام نشد."},{status:500});
   return NextResponse.json({ok:true,message:"رمز عبور عضو تغییر کرد."});
  }
  const update:any={};
  if(Object.prototype.hasOwnProperty.call(b,"discount_percent")){
   const discount=Number(b.discount_percent);
   if(!Number.isFinite(discount)||discount<0||discount>100)return NextResponse.json({error:"درصد تخفیف باید بین صفر تا صد باشد."},{status:400});
   update.discount_percent=discount;
   if(!Object.prototype.hasOwnProperty.call(b,"discount_active"))update.discount_active=discount>0;
  }
  if(Object.prototype.hasOwnProperty.call(b,"discount_active")){
   if(typeof b.discount_active!=="boolean")return NextResponse.json({error:"وضعیت تخفیف معتبر نیست."},{status:400});
   update.discount_active=b.discount_active;
  }
  if(!Object.keys(update).length)return NextResponse.json({error:"تغییری برای ذخیره مشخص نشده است."},{status:400});
  const {data,error}=await db().from("profiles").update(update).in("id",ids).select("id,discount_percent,discount_active");
  if(error)throw error;
  const updated=(data||[]).map((x:any)=>({id:x.id,discount_percent:Number(x.discount_percent||0),discount_active:Boolean(x.discount_active)}));
  if(updated.length!==ids.length)return NextResponse.json({error:"برخی اعضا پیدا نشدند؛ فهرست را تازه کنید.",updated_members:updated},{status:409});
  return NextResponse.json({ok:true,updated_members:updated});
 }catch{return NextResponse.json({error:"ذخیره تنظیمات تخفیف انجام نشد."},{status:500})}
}
async function removeMember(s:any,id:string){
 const [orders,messages,reviews,stores]=await Promise.all([s.from("orders").update({user_id:null}).eq("user_id",id),s.from("messages").delete().eq("user_id",id),s.from("reviews").delete().eq("user_id",id),s.from("stores").update({owner_id:null}).eq("owner_id",id)]);
 const dependencyError=orders.error||messages.error||reviews.error||stores.error;if(dependencyError)throw dependencyError;const {error}=await s.auth.admin.deleteUser(id);if(error)throw error;
}
export async function DELETE(r:Request){
 if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const url=new URL(r.url);let body:any={};if(r.headers.get("content-type")?.includes("application/json"))body=await r.json().catch(()=>({}));const rawIds=Array.isArray(body.ids)?body.ids:[body.id||url.searchParams.get("id")];const ids=Array.from(new Set<string>(rawIds.map((x:any)=>String(x||""))));if(!ids.length||ids.length>200||ids.some(id=>!validId(id)))return NextResponse.json({error:"یک یا چند شناسه عضو معتبر لازم است."},{status:400});const s=db(),deleted_ids:string[]=[],failed:{id:string;reason:string}[]=[];for(const id of ids){try{const {data:profile,error}=await s.from("profiles").select("id").eq("id",id).maybeSingle();if(error)throw error;if(!profile)throw new Error("عضو پیدا نشد");await removeMember(s,id);deleted_ids.push(id)}catch(e){failed.push({id,reason:String((e as any)?.message||"حذف ناموفق")})}}return NextResponse.json({ok:failed.length===0,deleted_ids,failed},{status:failed.length?(ids.length===1?500:207):200})}catch{return NextResponse.json({error:"حذف اعضا انجام نشد."},{status:500})}
}
