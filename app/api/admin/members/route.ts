import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {isAdmin} from "@/lib/admin-auth";
export async function GET(){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [{data:profiles,error:pe},{data:authData,error:ae}]=await Promise.all([
      s.from("profiles").select("id,full_name,email,member_since,created_at,discount_percent").order("member_since",{ascending:false}),
      s.auth.admin.listUsers({page:1,perPage:1000})
    ]);
    if(pe||ae)throw pe||ae;
    const users=authData.users||[];
    const members=(profiles||[]).map((p:any)=>{
      const u=users.find((x:any)=>x.id===p.id);
      return {id:p.id,full_name:p.full_name||u?.user_metadata?.full_name||"",phone:u?.phone||"",email:p.email||u?.email||"",member_since:p.member_since||p.created_at||u?.created_at||null,discount_percent:Number(p.discount_percent||0)};
    });
    return NextResponse.json({members});
  }catch{return NextResponse.json({error:"دریافت اعضای باشگاه انجام نشد."},{status:500})}
}

export async function PATCH(r:Request){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const b=await r.json(),id=String(b.id||""),discount=Number(b.discount_percent);
    if(!id||!Number.isFinite(discount)||discount<0||discount>100)return NextResponse.json({error:"درصد تخفیف باید بین صفر تا صد باشد."},{status:400});
    const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const {error}=await s.from("profiles").update({discount_percent:discount}).eq("id",id);
    if(error)throw error;
    return NextResponse.json({ok:true,discount_percent:discount});
  }catch{return NextResponse.json({error:"ذخیره تخفیف عضو انجام نشد."},{status:500})}
}
export async function DELETE(r:Request){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const id=new URL(r.url).searchParams.get("id");
    if(!id)return NextResponse.json({error:"شناسه عضو ارسال نشده است."},{status:400});
    const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [orders,messages,reviews,stores]=await Promise.all([
      s.from("orders").update({user_id:null}).eq("user_id",id),
      s.from("messages").delete().eq("user_id",id),
      s.from("reviews").delete().eq("user_id",id),
      s.from("stores").update({owner_id:null}).eq("owner_id",id)
    ]);
    if(orders.error||messages.error||reviews.error||stores.error)throw orders.error||messages.error||reviews.error||stores.error;
    const {error}=await s.auth.admin.deleteUser(id);
    if(error)throw error;
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:"حذف عضو انجام نشد. ارتباط‌های وابسته را بررسی کنید."},{status:500})}
}
