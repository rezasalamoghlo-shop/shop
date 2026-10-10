import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
type Prefs={product_type?:string;gender?:string;target?:string;occasion?:string;gift_occasion?:string;time?:string;season?:string;longevity?:string;sillage?:string;scent?:string[];birth_month?:string;budget?:number|null;first_name?:string;last_name?:string;phone?:string};
const months=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const scentMap:[string,string[]][]=[["شیرین",["شیرین","وانیلی","کاراملی","میوه‌ای"]],["تند",["تند","ادویه‌ای","فلفلی"]],["خنک",["خنک","تازه","fresh"]],["ملایم",["ملایم","نرم","لطیف"]],["گرم",["گرم","عنبر","کهربا"]],["تلخ",["تلخ","bitter"]],["چوبی",["چوبی","wood","عود"]],["مرکباتی",["مرکبات","مرکباتی","citrus"]],["دریایی",["دریایی","آبی","aquatic","marine"]],["شرقی",["شرقی","oriental"]],["گلدار",["گل","گلدار","رز","یاس"]],["پودری",["پودری","پودر"]]];
const normalize=(s:string)=>s.toLowerCase().replace(/[يى]/g,"ی").replace(/[ك]/g,"ک").replace(/[ۀة]/g,"ه").replace(/[\u200c\u200f]/g," ").replace(/[،؛]/g,",").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[؟?!]+/g," ").replace(/\s+/g," ").trim();
const has=(s:string,words:string[])=>words.some(w=>normalize(s).includes(normalize(w))); const anyExact=(s:string,words:string[])=>words.some(w=>normalize(s)===normalize(w));
function extract(message:string,p:Prefs,current?:keyof Prefs){const n=normalize(message);const out:{key:keyof Prefs;value:any}[]=[];
if(has(n,["ادکلن","کولون","cologne"]))out.push({key:"product_type",value:"ادکلن"});else if(has(n,["عطر","پرفیوم","perfume"]))out.push({key:"product_type",value:"عطر"});
if(has(n,["مرد","مردانه","پسر","آقا","آقای","آقایون","شوهر","پدر","برای آقا","مخصوص آقایان","male"]))out.push({key:"gender",value:"مردانه"});else if(has(n,["زن","زنانه","دختر","خانم","خانمم","بانوان","برای خانم","مخصوص خانم‌ها","همسرم","همسرم خانم","مادر","female"]))out.push({key:"gender",value:"زنانه"});
if(has(n,["خودم","برای خود","برای من","خودم میخوام","خودم میخوام","میخوام خودم استفاده کنم","مصرف خودم","برای خودم"]))out.push({key:"target",value:"خودم"});else if(has(n,["هدیه","کادو","برای هدیه","برای کادو","همسرم","همسر","شوهرم","شوهر","دوستم","دوست من","مادرم","پدرم","خواهرم","برادرم","برای همسر","برای شوهر","برای مادر","برای پدر","برای دوست","برای دیگری","برای شخص دیگر","برای یکی دیگه","برای یکی دیگر"]))out.push({key:"target",value:"هدیه/شخص دیگر"});
// Separate the perfume's intended use from the occasion for giving the gift.
const useCases:[string,string[]][]=[
["روزمره",["روزمره","روزانه","مصرف روزانه","استفاده روزانه","مصرف روزمره","هر روز","روزهای عادی","برای هر روز","همه جا","همه‌جا","استفاده عمومی","روزانه استفاده","روز"]],
["محل کار",["محل کار","سر کار","محیط کار","اداری","محل اداره","دفتر کار","کار روزانه"]],
["دانشگاه",["دانشگاه","مدرسه","کلاس","دانشجویی"]],
["مهمانی",["مهمانی","مهمونی","دورهمی","جشن","مراسم"]],
["قرار",["قرار","دیت","قرار عاشقانه"]],
["رسمی",["رسمی","جلسه رسمی","مراسم رسمی"]],
["باشگاه",["باشگاه","ورزش","تمرین"]]
];
for(const [value,words] of useCases){if(has(n,words)){out.push({key:"occasion",value});break}}
const giftEvents:[string,string[]][]=[
["روز مادر",["روز مادر"]],["روز پدر",["روز پدر"]],["ولنتاین",["ولنتاین","روز عشق"]],["سالگرد",["سالگرد","سالگرد ازدواج"]],["تولد",["تولد","جشن تولد"]],["عروسی",["عروسی","ازدواج"]]
];
for(const [value,words] of giftEvents){if(has(n,words)){out.push({key:"gift_occasion",value});break}}

if(has(n,["صبح","ظهر","روز"]))out.push({key:"time",value:"روز"});else if(has(n,["شب","شبانه"]))out.push({key:"time",value:"شب"});
for(const x of ["بهار","تابستان","پاییز","زمستان"])if(n.includes(x)){out.push({key:"season",value:x});break} if(has(n,["بیشتر فصل","اکثر فصل","چند فصل","همه فصل","تمام فصل","فصل ها","فصل‌های","هر فصل"])||(current==="season"&&canDefer(n)))out.push({key:"season",value:"بیشتر فصل‌ها"});
const longevityText=(n.includes("ماندگاری")||current==="longevity")?n:"";if(has(longevityText,["خیلی زیاد","خیلی بالا","بسیار زیاد"]))out.push({key:"longevity",value:"خیلی زیاد"});else if(has(longevityText,["زیاد","بالا","ماندگار"]))out.push({key:"longevity",value:"زیاد"});else if(has(longevityText,["متوسط"]))out.push({key:"longevity",value:"متوسط"});else if(has(longevityText,["کم"]))out.push({key:"longevity",value:"کم"});if(current==="longevity"&&!out.some(x=>x.key==="longevity")){if(anyExact(n,["خیلی زیاد","خیلی بالا","بسیار زیاد"]))out.push({key:"longevity",value:"خیلی زیاد"});else if(anyExact(n,["زیاد","بالا","ماندگار"]))out.push({key:"longevity",value:"زیاد"});else if(anyExact(n,["متوسط"]))out.push({key:"longevity",value:"متوسط"});else if(anyExact(n,["کم","ضعیف"]))out.push({key:"longevity",value:"کم"});}
const sillageText=(n.includes("پخش بو")||n.includes("خط بو")||current==="sillage")?n:"";if(has(sillageText,["خیلی قوی","پخش بالا","بمب","خیلی خوب","بسیار خوب"]))out.push({key:"sillage",value:"خیلی قوی"});else if(has(sillageText,["قوی","زیاد","خوب"]))out.push({key:"sillage",value:"قوی"});else if(has(sillageText,["متوسط"]))out.push({key:"sillage",value:"متوسط"});else if(has(sillageText,["ملایم","کم"]))out.push({key:"sillage",value:"ملایم"});
if(current==="sillage"&&!out.some(x=>x.key==="sillage")){if(has(n,["خیلی قوی","خیلی زیاد","بسیار قوی"]))out.push({key:"sillage",value:"خیلی قوی"});else if(anyExact(n,["قوی","زیاد","بالا"]))out.push({key:"sillage",value:"قوی"});else if(anyExact(n,["متوسط"]))out.push({key:"sillage",value:"متوسط"});else if(anyExact(n,["ملایم","کم","ضعیف"]))out.push({key:"sillage",value:"ملایم"});}
const scents=scentMap.filter(([,words])=>has(n,words)).map(([name])=>name);if(scents.length)out.push({key:"scent",value:Array.from(new Set([...(p.scent||[]),...scents]))});
for(const m of months)if(n.includes(m)){out.push({key:"birth_month",value:m});break}
if(current==="budget"&&has(n,["فرقی ندارد","مهم نیست","ندارم","بدون محدودیت"]))out.push({key:"budget",value:null});else{const nums=message.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).match(/\d{4,}/g);if(nums?.length)out.push({key:"budget",value:Number(nums[nums.length-1])})}
return out}
const order=["product_type","gender","target","occasion","time","season","longevity","sillage","scent","birth_month","budget"] as (keyof Prefs)[];
const questions:Record<string,string>={product_type:"اول مشخص کنیم: عطر می‌خواهید یا ادکلن؟",gender:"برای چه جنسیتی می‌خواهید؟ مردانه یا زنانه؟",target:"برای خودتان می‌خواهید یا برای شخص دیگری/هدیه؟",occasion:"بیشتر در چه موقعیتی از عطر استفاده می‌شود؟ روزمره، محل کار، دانشگاه، مهمانی، قرار یا موقعیت رسمی؟",gift_occasion:"اگر هدیه است، مناسبت هدیه چیست؟ مثلاً تولد، سالگرد یا ولنتاین.",time:"بیشتر برای روز می‌خواهید یا شب؟",season:"برای کدام فصل یا آب‌وهوا می‌خواهید؟",longevity:"ماندگاری را چطور می‌پسندید؟ کم، متوسط، زیاد یا خیلی زیاد؟",sillage:"پخش بو را چطور می‌پسندید؟ ملایم، متوسط، قوی یا خیلی قوی؟",scent:"چه رایحه‌ای دوست دارید؟ شیرین، تند، خنک، ملایم، گرم، تلخ، چوبی، مرکباتی، دریایی، شرقی، گلدار یا پودری.",birth_month:"ماه تولد شما یا شخصی که برای او می‌خواهید چیست؟",budget:"بودجه حدودی دارید؟ اگر محدودیتی ندارید فقط بگویید «فرقی ندارد»."};
const nextKey=(p:Prefs)=>order.find(k=>(k!=="gift_occasion"||p.target==="هدیه/شخص دیگر")&&(p[k]===undefined||p[k]===""))||null;
const intent=(m:string)=>{const n=normalize(m);if(has(n,["آدرس","نشانی","کجا هستید","لوکیشن"]))return"address";if(has(n,["اینستا","اینستاگرام","پیج","تلگرام","واتساپ","روبیکا","آپارات"]))return"social";if(has(n,["شماره تماس","پشتیبانی","تماس"]))return"support";if(has(n,["محصولات","چه عطرهایی","چه ادکلن‌هایی","چی دارید","موجود دارید","قیمت"]))return"catalog";if(has(n,["سلام","درود"]))return"greeting";return"other"};
async function info(s:any){const {data}=await s.from("store_settings").select("address,support_phone,social_links").limit(1).maybeSingle();return data||{}}
function recommend(products:any[],p:Prefs){return products.filter(x=>Number(x.stock)>0).map(x=>{const text=normalize([x.name,x.description,...Object.values(x.fragrance_profile||{})].filter(Boolean).join(" "));let score=0;const add=(v:string|undefined,w:number)=>{if(v&&text.includes(normalize(v)))score+=w};add(p.product_type,10);add(p.gender,10);add(p.season,7);add(p.occasion,5);add(p.longevity,6);add(p.sillage,6);add(p.birth_month,4);for(const z of p.scent||[])add(z,12);if(typeof p.budget==="number"){const price=Number(x.price);if(price<=p.budget)score+=7;else if(price<=p.budget*1.1)score+=2;else score-=5}return {...x,score}}).sort((a,b)=>b.score-a.score).slice(0,3)}
const money=(n:number)=>new Intl.NumberFormat("fa-IR").format(Math.round(n))+" تومان";
export const runtime="edge";
export async function POST(request:Request){try{
 const b=await request.json();
 const message=String(b.message||"").trim();
 if(!message)return NextResponse.json({error:"پیام خالی است."},{status:400});
 const visitorId=String(b.visitor_id||"").trim();
 const prefs:Prefs=(b.preferences&&typeof b.preferences==="object"?b.preferences:{}) as Prefs;
 const specialAction=String(b.special_action||"");
 if(specialAction==="create"){
  if(!visitorId)return NextResponse.json({error:"شناسه کاربر الزامی است."},{status:400});
  const firstName=String(b.first_name||"").trim(),lastName=String(b.last_name||"").trim(),phone=String(b.phone||"").trim();
  if(!firstName||!lastName||!phone)return NextResponse.json({error:"نام، نام خانوادگی و شماره تماس را کامل وارد کنید."},{status:400});
  const s=db();
  const {data:activeOrder}=await s.from("special_orders").select("id").eq("visitor_id",visitorId).in("status",["pending","in_progress"]).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(activeOrder)return NextResponse.json({error:"درخواست عطر ویژه شما هنوز در حال بررسی است. تا تعیین تکلیف آن نمی‌توانید درخواست جدیدی ثبت کنید."},{status:409});
  const {data:order,error}=await s.from("special_orders").insert({visitor_id:visitorId,first_name:firstName,last_name:lastName,phone,preferences:prefs,notes:"ثبت‌شده از مشاور هوشمند عطر ویژه",status:"pending"}).select("id").single();
  if(error||!order)throw new Error("special_order_create_failed");
  return NextResponse.json({order_id:order.id,reply:"",done:true,special_order_created:true,preferences:{...prefs,first_name:firstName,last_name:lastName,phone}});
 }

 if(visitorId){
  const {data:activeOrder}=await db().from("special_orders").select("id,status").eq("visitor_id",visitorId).in("status",["pending","in_progress"]).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(activeOrder)return NextResponse.json({order_id:activeOrder.id,reply:activeOrder.status==="pending"?"درخواست عطر ویژه شما ثبت شده و در انتظار شروع گفتگو توسط کارشناس است. تا آن زمان امکان ارسال پیام جدید به مشاور وجود ندارد.":"گفتگوی شما با کارشناس عطر کهکشان فعال است. لطفاً پیام خود را در بخش گفتگوی مستقیم با کارشناس ارسال کنید.",done:true,locked:true,status:activeOrder.status});
 }
 const n=normalize(message);
 if(has(n,["بله","آره","اره","حتماً","حتما","ثبت کن","سفارش ویژه","سفارش عطر ویژه"])){
  return NextResponse.json({order_id:String(b.order_id||""),reply:"حتماً. برای ثبت سفارش ویژه، نام، نام خانوادگی و شماره تماس خود را وارد کنید.",done:false,needs_special_form:true,preferences:prefs});
 }
 const it=intent(message);
 const activeFollowup=String(prefs._active_followup||"");
 const current=(activeFollowup?activeFollowup:nextKey(prefs)) as keyof Prefs|null;
 if(it==="address"||it==="social"||it==="support"){
  const x=await info(db());let reply="";
  if(it==="address")reply=x.address?"آدرس عطر کهکشان: "+x.address:"آدرس هنوز ثبت نشده است.";
  if(it==="support")reply=x.support_phone?"شماره پشتیبانی: "+x.support_phone:"شماره پشتیبانی هنوز ثبت نشده است.";
  if(it==="social")reply=Array.isArray(x.social_links)&&x.social_links.length?x.social_links.map((z:any)=>z?.name&&z?.url?z.name+": "+z.url:"").filter(Boolean).join("\n"):"پیج‌ها هنوز ثبت نشده‌اند.";
  return NextResponse.json({order_id:String(b.order_id||""),reply,done:false,intent:it,preferences:prefs});
 }
 if(it==="catalog"){
  const {data}=await db().from("products").select("name,description,price,stock,full_size_ml,price_per_ml,per_ml_discount_percent,discount_percent,product_sizes(size_ml,price,discount_percent,stock,is_active)").order("created_at",{ascending:false}).limit(12);
  const rows=(data||[]).filter((x:any)=>Number(x.stock)>0);
  const reply=rows.length?"محصولات موجود فعلی:\n"+rows.map((x:any)=>"• "+x.name+" | "+money(Number(x.price))+" | "+String(x.description||"بدون توضیحات")).join("\n\n"):"در حال حاضر محصول موجودی ثبت نشده است.";
  return NextResponse.json({order_id:String(b.order_id||""),reply,done:false,intent:it,preferences:prefs});
 }
 const extracted=extract(message,prefs,current||undefined);
 // A greeting can be part of a complete request. Parse the entire message first,
 // then greet only when the message contains no usable perfume preferences.
 if(it==="greeting"&&!Object.keys(prefs).length&&extracted.length===0)return NextResponse.json({order_id:String(b.order_id||""),reply:"به عطر کهکشان خوش آمدید ✦\nمن سلیقه شما را دقیق تحلیل می‌کنم. اول بگویید عطر می‌خواهید یا ادکلن؟",done:false,intent:"greeting",preferences:prefs});
 const currentAnswer=Boolean(current&&extracted.some(x=>x.key===current));
 const deferred=[...(prefs._deferred||[])];
 const skipped=[...(prefs._skipped||[])];
 if(current&&it!=="greeting"){
  if(activeFollowup){
   if(currentAnswer){
    prefs._deferred=deferred.filter(k=>k!==String(current));
    prefs._skipped=skipped.filter(k=>k!==String(current));
   }else{
    // A differently phrased second attempt is the last attempt. Do not repeat it again.
    prefs._deferred=deferred.filter(k=>k!==String(current));
    prefs._skipped=Array.from(new Set([...skipped,String(current)]));
   }
   delete prefs._active_followup;
  }else if(!currentAnswer){
   // Defer any unanswered or ambiguous field and continue through the rest of the profile.
   prefs._deferred=Array.from(new Set([...deferred,String(current)]));
  }
 }
 for(const x of extracted){if(x.key==="scent")prefs.scent=x.value;else prefs[x.key]=x.value}
 if(prefs.target==="خودم"){
  prefs._deferred=(prefs._deferred||[]).filter(k=>k!=="gift_occasion");
  prefs._skipped=Array.from(new Set([...(prefs._skipped||[]),"gift_occasion"]));
 }else if(prefs.target==="هدیه/شخص دیگر"){
  prefs._skipped=(prefs._skipped||[]).filter(k=>k!=="gift_occasion");
 }
 const next=nextKey(prefs);
 if(next)return NextResponse.json({order_id:String(b.order_id||""),reply:questions[next],done:false,intent:it,preferences:prefs});
 const followup=order.find(k=>(prefs._deferred||[]).includes(String(k))&&!(prefs._skipped||[]).includes(String(k))&&prefs[k]===undefined);
 if(followup){
  prefs._active_followup=String(followup);
  return NextResponse.json({order_id:String(b.order_id||""),reply:followupQuestions[String(followup)]||questions[String(followup)],done:false,intent:it,preferences:prefs});
 }
 const s=db();
 const {data:products}=await s.from("products").select("id,name,description,price,stock,image_url,fragrance_profile,discount_percent,full_size_ml,price_per_ml,per_ml_discount_percent,product_sizes(size_ml,price,discount_percent,stock,is_active)").gt("stock",0).limit(100);
 let picks=recommend(products||[],prefs);if(picks.length&&picks[0].score<25)picks=[];
 const pickText=picks.length?picks.map((x:any,i:number)=>(i+1)+". "+x.name+" | "+money(x.price)+" | "+String(x.description||"بدون توضیحات")+" | تناسب تقریبی "+Math.min(99,70+x.score)+"٪").join("\n\n"):"در حال حاضر محصول کاملاً منطبق و موجود پیدا نشد.";
 const reply=picks.length?"پروفایل رایحه شما کامل شد. ✦\n\nانتخاب‌های پیشنهادی:\n"+pickText+"\n\nدلیل انتخاب: "+[prefs.product_type,prefs.gender,(prefs.scent||[]).join("، "),prefs.season,prefs.occasion].filter(Boolean).join("، "):"با این مشخصات، در موجودی فعلی گزینه‌ای که به اندازه کافی با سلیقه شما مطابقت داشته باشد پیدا نکردم. ✦\n\nاگر مایل باشید، می‌توانید از بخش «سفارش عطر ویژه» درخواستتان را ثبت کنید تا کارشناس آن را بررسی کند.\n\nآیا می‌خواهید سفارش ویژه ثبت کنید؟";
 return NextResponse.json({order_id:String(b.order_id||""),reply,done:Boolean(picks.length),needs_special_confirmation:!picks.length,intent:"recommendation",preferences:prefs,recommendations:picks.map((x:any)=>({id:x.id,name:x.name,description:x.description,price:x.price,image_url:x.image_url,discount_percent:x.discount_percent,full_size_ml:x.full_size_ml,price_per_ml:x.price_per_ml,per_ml_discount_percent:x.per_ml_discount_percent,sizes:x.product_sizes||[],score:x.score}))});
}catch{return NextResponse.json({error:"در پردازش پیام مشکلی پیش آمد. لطفاً دوباره تلاش کنید."},{status:500})}}