import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET(r:Request){
 const token=(r.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 if(!token)return NextResponse.json({error:"برای مشاهده حساب وارد شوید."},{status:401});
 try{
  const s=db();const {data:auth,error:authError}=await s.auth.getUser(token);
  if(authError||!auth.user)return NextResponse.json({error:"نشست ورود معتبر نیست."},{status:401});
  const u=auth.user;
  const [{data:profile},{data:orders,error:ordersError}]=await Promise.all([
   s.from("profiles").select("full_name,member_since,created_at").eq("id",u.id).maybeSingle(),
   s.from("orders").select("id,order_number,total_price,status,payment_status,created_at,shipping_method_name,estimated_delivery,order_items(quantity,price,size_ml,pricing_type,products(name))").eq("user_id",u.id).order("created_at",{ascending:false}).limit(30)
  ]);
  if(ordersError)throw ordersError;
  const now=new Date();
  const {error:cleanupError}=await s.from("club_discount_campaigns").delete().lte("ends_at",now.toISOString());
  if(cleanupError)throw cleanupError;
  const {data:campaign,error:campaignError}=await s.from("club_discount_campaigns").select("discount_percent,starts_at,ends_at").eq("id",1).maybeSingle();
  if(campaignError)throw campaignError;
  const active=Boolean(campaign&&new Date(campaign.starts_at).getTime()<=now.getTime()&&new Date(campaign.ends_at).getTime()>now.getTime());
  return NextResponse.json({user:{id:u.id,phone:u.phone||u.user_metadata?.phone||"",name:profile?.full_name||u.user_metadata?.full_name||"",created_at:profile?.member_since||profile?.created_at||u.created_at},discount:{percent:active&&campaign?Number(campaign.discount_percent||0):0,active,ends_at:active&&campaign?campaign.ends_at:null},orders:orders||[]});
 }catch{return NextResponse.json({error:"اطلاعات حساب فعلاً دریافت نشد."},{status:500})}
}