"use client";
import {useEffect,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase-browser";
export default function Account(){
 const supabase=createSupabaseBrowserClient();const[user,setUser]=useState<any>(null);
 useEffect(()=>{supabase.auth.getUser().then(({data})=>{if(!data.user){location.href="/login";return}setUser(data.user)})},[]);
 async function out(){await supabase.auth.signOut();location.href="/"}
 if(!user)return <main className="customer-auth"><div className="auth-card"><div className="empty">در حال بارگذاری حساب...</div></div></main>;
 return <main className="customer-auth"><div className="auth-card"><span>GALAXY MEMBER</span><h1>حساب کاربری</h1><p>خوش آمدید. حساب شما با ایمیل <b dir="ltr">{user.email}</b> فعال است.</p><div className="member-benefits"><h3>مزایای عضویت</h3><div>✦ تخفیف‌های ویژه اعضا</div><div>✦ دسترسی به پیشنهادهای اختصاصی</div><div>✦ پیگیری ساده‌تر سفارش‌ها</div></div><button className="gold full" onClick={out}>خروج از حساب</button><a className="auth-secondary" href="/">بازگشت به فروشگاه</a></div></main>;
}