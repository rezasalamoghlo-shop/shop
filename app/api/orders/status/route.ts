import{NextResponse}from"next/server";import{createClient}from"@supabase/supabase-js";
export async function GET(r:Request){
 const token=new URL(r.url).searchParams.get("token");if(!token)return NextResponse.json({error:"شناسه سفارش نامعتبر است."},{status:400});
 const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
 const{data,error}=await s.from("orders").select("id,status,total_price,created_at").eq("public_token",token).maybeSingle();
 if(error||!data)return NextResponse.json({error:"سفارش پیدا نشد."},{status:404});return NextResponse.json(data);
}