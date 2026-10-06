import{NextResponse}from"next/server";import{createClient}from"@supabase/supabase-js";
export async function POST(r:Request){
 try{const b=await r.json(),token=String(b.token||"");if(!token)return NextResponse.json({error:"شناسه سفارش نامعتبر است."},{status:400});
 const auth=r.headers.get("authorization")||"",access=auth.replace(/^Bearer\s+/i,"");if(!access)return NextResponse.json({error:"ورود لازم است."},{status:401});
 const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
 const{data:{user},error:ue}=await s.auth.getUser(access);if(ue||!user)return NextResponse.json({error:"جلسه کاربر معتبر نیست."},{status:401});
 const{data:o,error}=await s.from("orders").update({user_id:user.id}).eq("public_token",token).is("user_id",null).select("id").maybeSingle();
 if(error)return NextResponse.json({error:"اتصال سفارش انجام نشد."},{status:500});return NextResponse.json({ok:true,attached:!!o});
 }catch{return NextResponse.json({error:"خطا در اتصال سفارش."},{status:500})}
}