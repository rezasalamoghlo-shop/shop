"use client";
import{useCallback,useEffect,useState}from"react";
import{createSupabaseBrowserClient}from"@/lib/supabase-browser";
type Message={id?:string;role:"user"|"assistant";content:string};
type Prefs=Record<string,unknown>;
const vid=()=>{let x=localStorage.getItem("galaxy_visitor_id");if(!x){x=crypto.randomUUID();localStorage.setItem("galaxy_visitor_id",x)}return x};
const cartKey="galaxy_cart";
export default function SpecialPerfume(){
 const[messages,setMessages]=useState<Message[]>([]),[text,setText]=useState(""),[orderId,setOrderId]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[needsSpecial,setNeedsSpecial]=useState(false),[showForm,setShowForm]=useState(false),[preferences,setPreferences]=useState<Prefs>({}),[form,setForm]=useState({first_name:"",last_name:"",phone:""}),[visitor,setVisitor]=useState(""),[locked,setLocked]=useState(false),[status,setStatus]=useState("none"),[adminStarted,setAdminStarted]=useState(false);
 const[liveChannel,setLiveChannel]=useState<any>(null);
 useEffect(()=>{try{setVisitor(vid());const saved=localStorage.getItem("galaxy_bot_order_id"),m=localStorage.getItem("galaxy_bot_messages"),p=localStorage.getItem("galaxy_bot_preferences");if(saved)setOrderId(saved);if(m)setMessages(JSON.parse(m));if(p)setPreferences(JSON.parse(p))}catch{}},[]);
 useEffect(()=>{if(done&&!locked){localStorage.removeItem("galaxy_bot_order_id");localStorage.removeItem("galaxy_bot_messages");localStorage.removeItem("galaxy_bot_preferences");return}if(orderId)localStorage.setItem("galaxy_bot_order_id",orderId);localStorage.setItem("galaxy_bot_messages",JSON.stringify(messages));localStorage.setItem("galaxy_bot_preferences",JSON.stringify(preferences))},[orderId,messages,preferences,done,locked]);
 const syncConversation=useCallback(async()=>{
  if(!visitor)return;
  try{
   const r=await fetch("/api/special-order/conversation?visitor_id="+encodeURIComponent(visitor),{cache:"no-store"});
   if(!r.ok)return;
   const d=await r.json();
   setLocked(Boolean(d.active));setStatus(String(d.status||"none"));setAdminStarted(d.status==="in_progress");
   if(d.order_id){setOrderId(d.order_id);localStorage.setItem("galaxy_bot_order_id",d.order_id)}
   if(d.active)setMessages((d.messages||[]).map((m:any)=>({id:m.id,role:m.role==="user"?"user":"assistant",content:m.content})));else if(["completed","cancelled"].includes(String(d.status||""))){setMessages([]);setLocked(false);setAdminStarted(false);setStatus(String(d.status));}
   const seen=new Set(JSON.parse(localStorage.getItem("galaxy_cart_addition_ids")||"[]") as string[]);
   let cart:any[]=[];try{const saved=JSON.parse(localStorage.getItem(cartKey)||"[]");if(Array.isArray(saved))cart=saved}catch{}
   let changed=false;
   for(const event of (d.cart_additions||[])){
    if(!event?.id||seen.has(event.id)||!event.cartItem)continue;
    const item=event.cartItem,existing=cart.findIndex((x:any)=>x.id===item.id&&x.size_ml===item.size_ml&&x.pricing_type===item.pricing_type);
    if(existing>=0)cart=cart.map((x:any,i:number)=>i===existing?{...x,quantity:Math.min(Number(x.stock)||999,Number(x.quantity||0)+1)}:x);
    else cart.push(item);
    seen.add(event.id);changed=true;
   }
   localStorage.setItem("galaxy_cart_addition_ids",JSON.stringify([...seen]));
   if(changed){localStorage.setItem(cartKey,JSON.stringify(cart));window.dispatchEvent(new Event("galaxy-cart-updated"))}
    if(["completed","cancelled"].includes(String(d.status||""))&&d.order_id){await fetch("/api/special-order/conversation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitor_id:visitor,order_id:d.order_id,action:"acknowledge_terminal"})})}
  }catch{}
 },[visitor]);
 useEffect(()=>{if(!visitor)return;void syncConversation();const t=window.setInterval(()=>void syncConversation(),4000);return()=>window.clearInterval(t)},[visitor,syncConversation]);
 useEffect(()=>{const supabase=createSupabaseBrowserClient();const channel=supabase.channel("galaxy-chat-refresh").on("broadcast",{event:"refresh"},()=>void syncConversation()).subscribe();setLiveChannel(channel);return()=>{setLiveChannel(null);void supabase.removeChannel(channel)}},[syncConversation]);
 async function send(value=text.trim(),specialAction="",formData=form){
  if(!value||busy||locked)return;
  setText("");if(specialAction!=="create")setMessages(x=>[...x,{role:"user",content:value}]);setBusy(true);
  try{const r=await fetch("/api/special-order/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({order_id:orderId,message:value,visitor_id:visitor||vid(),preferences,special_action:specialAction,special_confirm:needsSpecial,...(specialAction?formData:{})})});const d=await r.json();if(!r.ok)throw new Error(d?.error);setOrderId(d.order_id||orderId);setPreferences(d.preferences||preferences);if(d.reply&&!d.special_order_created)setMessages(x=>[...x,{role:"assistant",content:d.reply}]);setDone(Boolean(d.done));setNeedsSpecial(Boolean(d.needs_special_confirmation));if(d.needs_special_form)setShowForm(true);if(d.special_order_created){setShowForm(false);setNeedsSpecial(false);setLocked(true);setStatus("pending");setAdminStarted(false);if(liveChannel)await liveChannel.send({type:"broadcast",event:"refresh",payload:{}});await syncConversation()}}
  catch(e){setMessages(x=>[...x,{role:"assistant",content:e instanceof Error?e.message:"در پردازش پیام مشکلی پیش آمد."}])}
  finally{setBusy(false)}
 }
 async function sendToAdmin(){const value=text.trim();if(!value||busy||!adminStarted)return;setText("");setBusy(true);setMessages(x=>[...x,{role:"user",content:value}]);try{const r=await fetch("/api/special-order/conversation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitor_id:visitor,content:value})});const d=await r.json();if(!r.ok)throw new Error(d.error||"ارسال پیام انجام نشد.");if(liveChannel)await liveChannel.send({type:"broadcast",event:"refresh",payload:{}});await syncConversation()}catch(e){setMessages(x=>[...x,{role:"assistant",content:e instanceof Error?e.message:"ارسال پیام انجام نشد."}])}finally{setBusy(false)}}
 function newChat(){if(locked)return;localStorage.removeItem("galaxy_bot_order_id");localStorage.removeItem("galaxy_bot_messages");localStorage.removeItem("galaxy_bot_preferences");setOrderId("");setMessages([]);setPreferences({});setDone(false);setNeedsSpecial(false);setShowForm(false);setForm({first_name:"",last_name:"",phone:""});setText("");setStatus("none")}
 const inputDisabled=busy||locked&&!adminStarted;
 return <section id="special" className="special-perfume"><div className="special-copy"><span>GALAXY SPECIAL</span><h2>مشاور هوشمند عطر کهکشان</h2><p>منظورتان را از متن فارسی تشخیص می‌دهم و فقط اطلاعاتی را که واقعاً لازم است می‌پرسم.</p><div className="special-points"><span>✦ تشخیص عطر یا ادکلن و جنسیت</span><span>✦ تحلیل روز، فصل، ماندگاری و پخش بو</span><span>✦ تطبیق با محصولات و قیمت واقعی فروشگاه</span><span>✦ سفارش ویژه با بررسی کارشناس</span></div></div><div className="special-chat"><div className="chat-head"><div><span>GALAXY BOT</span><b>{locked?(adminStarted?"گفتگوی مستقیم با کارشناس":"در انتظار شروع گفتگو توسط کارشناس"):"موتور تشخیص نیت و رایحه"}</b></div><button className="new-chat" onClick={newChat} disabled={locked}>＋ گفتگوی جدید</button></div><div className="chat-body" aria-live="polite">{messages.length===0&&!locked&&<div className="bot-message">به عطر کهکشان خوش آمدید ✦<br/>اول بگویید: عطر می‌خواهید یا ادکلن؟</div>}{messages.map((m,i)=><div key={m.id||i} className={m.role==="user"?"user-message":"bot-message"}>{m.content}</div>)}{busy&&<div className={locked?"user-message typing":"bot-message typing"}>{locked?"در حال ارسال...":"در حال پاسخ‌گویی..."}</div>}{needsSpecial&&!showForm&&!locked&&<button className="special-order-cta" onClick={()=>{setShowForm(true);send("بله، سفارش ویژه ثبت کن")}} disabled={busy}>ثبت سفارش عطر ویژه</button>}{showForm&&!locked&&<div className="special-form"><b>ثبت سفارش ویژه</b><input value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} placeholder="نام"/><input value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} placeholder="نام خانوادگی"/><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="شماره تماس" inputMode="tel"/><button onClick={()=>send("اطلاعات اولیه سفارش ویژه را ثبت می‌کنم","create",form)} disabled={busy||!form.first_name.trim()||!form.last_name.trim()||!form.phone.trim()}>{busy?"در حال ثبت...":"ثبت سفارش ویژه"}</button></div>}</div><div className="chat-input"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(locked)sendToAdmin();else send()}}} placeholder={locked?(adminStarted?"پیام خود را برای کارشناس بنویسید...":"در انتظار شروع گفتگو توسط کارشناس..."):done?"برای ادامه گفتگو پیام بدهید...":"پاسخ خود را بنویسید..."} disabled={inputDisabled}/><button onClick={()=>locked?sendToAdmin():send()} disabled={inputDisabled||!text.trim()}>{busy?"در حال ارسال...":locked?"ارسال به کارشناس":"ارسال"}</button></div></div></section>
}
