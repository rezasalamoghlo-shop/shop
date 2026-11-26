import type {Metadata} from "next";
import {createClient} from "@supabase/supabase-js";
import Home from "@/app/page";

type Props={params:Promise<{slug:string}>};

async function getCategory(slug:string){
  if(slug==="all")return {name:"همه محصولات",description:"تمام عطرها و ادکلن‌های فعال فروشگاه عطر کهکشان."};
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return null;
  try{
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const {data,error}=await db.from("categories").select("name,description").eq("slug",slug).eq("is_active",true).maybeSingle();
    if(error||!data)return null;
    return {name:data.name,description:data.description||"محصولات این دسته‌بندی را در فروشگاه عطر کهکشان بررسی کنید."};
  }catch{return null;}
}

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;
  const category=await getCategory(slug);
  const name=category?.name||"دسته‌بندی عطر";
  return {
    title:slug==="all"?"همه محصولات | خرید عطر و ادکلن از عطر کهکشان":name+" | خرید عطر از عطر کهکشان",
    description:category?.description||"مشاهده و جست‌وجوی عطرها و ادکلن‌های فروشگاه عطر کهکشان.",
    alternates:{canonical:"/store/"+encodeURIComponent(slug)},
    robots:category||slug==="all"?{index:true,follow:true}:{index:false,follow:true},
    openGraph:{title:name+" | فروشگاه عطر کهکشان",description:category?.description||"فروشگاه عطر کهکشان",url:"https://shop-gamma-wheat.vercel.app/store/"+encodeURIComponent(slug),siteName:"فروشگاه عطر کهکشان",locale:"fa_IR",type:"website"}
  };
}

export default function StoreCategoryPage(){return <Home/>;}
