import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {isAdmin} from "@/lib/admin-auth";
export async function GET(){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [{data:profiles,error:pe},{data:authData,error:ae}]=await Promise.all([
      s.from("profiles").select("id,full_name,email,member_since,created_at").order("member_since",{ascending:false}),
      s.auth.admin.listUsers({page:1,perPage:1000})
    ]);
    if(pe||ae)throw pe||ae;
    const users=authData.users||[];
    const members=(profiles||[]).map((p:any)=>{
      const u=users.find((x:any)=>x.id===p.id);
      return {id:p.id,full_name:p.full_name||u?.user_metadata?.full_name||"",phone:u?.phone||"",email:p.email||u?.email||"",member_since:p.member_since||p.created_at||u?.created_at||null};
    });
    return NextResponse.json({members});
  }catch{return NextResponse.json({error:"دریافت اعضای باشگاه انجام نشد."},{status:500})}
}
