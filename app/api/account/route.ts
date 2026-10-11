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
   s.from("profiles").select("full_name,member_since,created_at,discount_percent,discount_active").eq("id",u.id).maybeSingle(),
   s.from("orders").select("id,order_number,total_price,status,payment_status,created_at,shipping_method_name,estimated_delivery,order_items(quantity,price,size_ml,pricing_type,products(name))").eq("user_id",u.id).order("created_at",{ascending:false}).limit(30)
  ]);
  if(ordersError)throw ordersError;
  return NextResponse.json({user:{id:u.id,phone:u.phone||u.user_metadata?.phone||"",name:profile?.full_name||u.user_metadata?.full_name||"",created_at:profile?.member_since||profile?.created_at||u.created_at},discount:{percent:Number(profile?.discount_percent||0),active:Boolean(profile?.discount_active)},orders:orders||[]});
 }catch{return NextResponse.json({error:"اطلاعات حساب فعلاً دریافت نشد."},{status:500})}
}