"use client";
import {useEffect,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase-browser";
export default function RegisterAfterOrder(){
  const [token,setToken]=useState(""),[phone,setPhone]=useState(""),[fullName,setFullName]=useState("");
  const [status,setStatus]=useState("loading"),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{
    const t=localStorage.getItem("galaxy_pending_order_token")||"";
    setToken(t);setPhone(localStorage.getItem("galaxy_pending_order_phone")||"");setFullName(localStorage.getItem("galaxy_pending_order_name")||"");
    if(!t)setStatus("missing");
  },[]);
  useEffect(()=>{
    if(!token)return;
    let stopped=false;
    const check=async()=>{try{const r=await fetch("/api/orders/status?token="+encodeURIComponent(token),{cache:"no-store"});if(!r.ok){if(!stopped)setStatus("invalid");return}const d=await r.json();if(!stopped)setStatus(d.payment_status||d.status||"pending")}catch{if(!stopped)setStatus("pending")}};
    void check();const timer=window.setInterval(()=>void check(),6000);
    return()=>{stopped=true;window.clearInterval(timer)};
  },[token]);
  async function create(){
    if(busy)return;
    if(password.length<8){setMessage("رمز عبور باید حداقل ۸ کاراکتر باشد.");return}
    if(password!==confirm){setMessage("تکرار رمز عبور با رمز اصلی یکسان نیست.");return}
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/auth/register-after-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,phone,full_name:fullName,password})});
      const result=await response.json();
      if(!response.ok){setMessage(result.error||"ساخت حساب انجام نشد.");setBusy(false);return}
      const supabase=createSupabaseBrowserClient();
      const {error}=await supabase.auth.signInWithPassword({phone:result.phone,password});
      if(error){setMessage("حساب ساخته شد، اما ورود خودکار انجام نشد. از صفحه ورود استفاده کنید.");setBusy(false);return}
      ["galaxy_pending_order_token","galaxy_pending_order_phone","galaxy_pending_order_name"].forEach(k=>localStorage.removeItem(k));
      location.href="/account";
    }catch{setMessage("ارتباط برقرار نشد. دوباره تلاش کنید.");setBusy(false)}
  }
  return <main className="customer-auth"><div className="auth-card"><span>GALAXY MEMBER</span><h1>عضویت در باشگاه مشتریان</h1>
    {status==="missing"?<><p>برای ساخت حساب، ابتدا سفارش ثبت کنید. فرم عضویت پس از تأیید پرداخت توسط مدیریت فعال می‌شود.</p><a className="gold full" href="/">بازگشت به فروشگاه</a></>:
    status==="invalid"?<><p>سفارش ذخیره‌شده پیدا نشد. اگر سفارش ثبت کرده‌اید، از همان مرورگر و پیوند صفحه تأیید سفارش استفاده کنید.</p><a className="auth-secondary" href="/">بازگشت به فروشگاه</a></>:
    status!=="paid"?<><p>فرم ثبت‌نام بعد از تأیید پرداخت توسط مدیر فعال می‌شود. لازم نیست این صفحه را باز نگه دارید؛ پس از ثبت سفارش می‌توانید از این مسیر برگردید.</p><div className="status-pulse">● وضعیت پرداخت: {status==="loading"?"در حال بررسی":"در انتظار تأیید"}</div><a className="auth-secondary" href="/login">رفتن به ورود</a></>:
    <><p>پرداخت تأیید شده است. نام کاربری شما همان شماره تماس ثبت‌شده در سفارش خواهد بود.</p><label>نام کاربری (شماره تماس)<input dir="ltr" value={phone} readOnly/></label><label>رمز عبور<input type="password" dir="ltr" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>تکرار رمز عبور<input type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{message&&<div className="auth-msg">{message}</div>}<button className="gold full" disabled={busy||!phone||!password||!confirm} onClick={create}>{busy?"در حال ساخت حساب...":"ساخت حساب کاربری"}</button><a className="auth-secondary" href="/login">قبلاً حساب ساخته‌اید؟ ورود</a></>}
  </div></main>
}
