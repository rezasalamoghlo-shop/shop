import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export async function GET(r:Request){
  const auth=r.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer "))return NextResponse.json({discount_percent:0});
  try{
    const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const {data,error}=await s.auth.getUser(auth.slice(7));
    if(error||!data.user)return NextResponse.json({discount_percent:0});
    const {data:profile}=await s.from("profiles").select("discount_percent").eq("id",data.user.id).maybeSingle();
    return NextResponse.json({discount_percent:Math.max(0,Math.min(100,Number(profile?.discount_percent)||0))},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({discount_percent:0})}
}
