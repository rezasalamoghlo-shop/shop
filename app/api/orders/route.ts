import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
const normalizeDigits=(value:string)=>value.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[^0-9]/g,"");
const orderSummary=(o:any)=>({id:o.id,order_number:o.order_number,total_price:o.total_price,subtotal_price:o.subtotal_price,discount_percent:o.discount_percent||0,discount_amount:o.discount_amount||0,shipping_cost:o.shipping_cost||0,estimated_delivery:o.estimated_delivery||null,public_token:o.public_token});
export async function POST(r:Request){
  try{
    const b=await r.json();
    const required=["customer_full_name","phone","province","city","address","postal_code","payer_full_name","payment_tracking_code","shipping_method_id"];
    if(required.some(k=>!String(b[k]??"").trim())||!Array.isArray(b.items)||!b.items.length)return NextResponse.json({error:"اطلاعات سفارش کامل نیست."},{status:400});
    if(b.items.length>50)return NextResponse.json({error:"تعداد اقلام سفارش بیش از حد مجاز است."},{status:400});
    const phoneDigits=normalizeDigits(String(b.phone||""));
    if(!/^09\d{9}$/.test(phoneDigits))return NextResponse.json({error:"شماره تماس باید ۱۱ رقم و با ۰۹ شروع شود."},{status:400});
    const checkoutSessionId=String(b.checkout_session_id||"");
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutSessionId))return NextResponse.json({error:"شناسه ادامه سفارش معتبر نیست. صفحه خرید را تازه کنید."},{status:400});
    const s=db();
    const {data:existingOrder,error:existingError}=await s.from("orders").select("id,order_number,public_token,total_price,subtotal_price,discount_percent,discount_amount,shipping_cost,estimated_delivery").eq("checkout_session_id",checkoutSessionId).maybeSingle();
    if(existingError)return NextResponse.json({error:"بررسی سفارش قبلی انجام نشد."},{status:500});
    if(existingOrder)return NextResponse.json(orderSummary(existingOrder));
    const normalizedItems:any[]=Array.from(b.items.reduce((map:Map<string,any>,item:any)=>{
      const key=[String(item.product_id||""),String(Number(item.size_ml)||""),item.pricing_type==="ml"?"ml":"full"].join("|");
      const previous=map.get(key);
      if(previous)previous.quantity=Number(previous.quantity)+Number(item.quantity);
      else map.set(key,{...item,quantity:Number(item.quantity)});
      return map;
    },new Map<string,any>()).values());
    const authHeader=r.headers.get("authorization")||"";
    const accessToken=authHeader.startsWith("Bearer ")?authHeader.slice(7):"";
    let memberUser:any=null,memberDiscount=0;
    if(accessToken){
      const {data:authResult,error:authError}=await s.auth.getUser(accessToken);
      if(!authError&&authResult.user){
        memberUser=authResult.user;
        const {data:profile}=await s.from("profiles").select("discount_percent").eq("id",memberUser.id).maybeSingle();
        memberDiscount=Math.max(0,Math.min(100,Number(profile?.discount_percent)||0));
      }
    }
    const {data:shipping,error:shippingError}=await s.from("shipping_methods").select("id,name,cost,estimated_delivery").eq("id",b.shipping_method_id).eq("is_active",true).maybeSingle();
    if(shippingError||!shipping)return NextResponse.json({error:"روش ارسال انتخاب‌شده معتبر نیست. روش دیگری انتخاب کنید."},{status:400});
    const ids:string[]=Array.from(new Set<string>(normalizedItems.map((x:any)=>String(x.product_id||""))));
    if(ids.some((id:string)=>!id))return NextResponse.json({error:"محصول نامعتبر است."},{status:400});
    const [{data:ps,error:pe},{data:sizeRows,error:se}]=await Promise.all([
      s.from("products").select("id,price,stock,discount_percent,discount_start,discount_end,full_size_ml,price_per_ml,per_ml_discount_percent").in("id",ids),
      s.from("product_sizes").select("product_id,size_ml,price,discount_percent,stock,is_active").in("product_id",ids).eq("is_active",true)
    ]);
    if(pe||se||!ps||ps.length!==ids.length)return NextResponse.json({error:"برخی محصولات دیگر موجود نیستند."},{status:400});
    const now=Date.now();let subtotal=0;
    const items=normalizedItems.map((x:any)=>{
      const p=ps.find((z:any)=>z.id===String(x.product_id));
      const q=Number(x.quantity);
      if(!p||!Number.isInteger(q)||q<1||q>100)throw new Error("quantity");
      const st=p.discount_start?new Date(p.discount_start).getTime():-Infinity;
      const en=p.discount_end?new Date(p.discount_end).getTime():Infinity;
      const pricingType=x.pricing_type==="ml"?"ml":"full";
      const requestedMl=Number(x.size_ml)||Number(p.full_size_ml)||100;
      const fullMl=Number(p.full_size_ml)||100;
      if(requestedMl<=0||requestedMl>fullMl)throw new Error("size");
      const fullActive=Number(p.discount_percent)>0&&now>=st&&now<=en;
      const chosenSize=pricingType==="ml"?(sizeRows||[]).find((z:any)=>z.product_id===p.id&&Number(z.size_ml)===requestedMl):null;
      if(pricingType==="full"&&Number(p.stock)<q)throw new Error("stock");
      if(pricingType==="ml"&&(!chosenSize||Number(chosenSize.stock)<q))throw new Error("size_stock");
      const base=chosenSize?Number(chosenSize.price):(Number(p.price_per_ml)>0?Number(p.price_per_ml):Number(p.price)/fullMl);
      const discount=chosenSize?Number(chosenSize.discount_percent||0):Number(p.per_ml_discount_percent||0);
      const price=pricingType==="ml"?base*(1-discount/100):(fullActive?Number(p.price)*(1-Number(p.discount_percent)/100):Number(p.price));
      subtotal+=price*q;
      return {product_id:p.id,quantity:q,price,size_ml:requestedMl,pricing_type:pricingType};
    });
    const shippingCost=Number(shipping.cost)||0;
    const discountAmount=Math.round(subtotal*memberDiscount/100);
    const total=Math.max(0,subtotal-discountAmount)+shippingCost;
    const {data:o,error}=await s.from("orders").insert({
      user_id:memberUser?.id||null,
      checkout_session_id:checkoutSessionId,
      customer_full_name:String(b.customer_full_name).trim(),phone:phoneDigits,
      province:String(b.province).trim(),city:String(b.city).trim(),address:String(b.address).trim(),postal_code:String(b.postal_code).trim(),
      subtotal_price:subtotal,total_price:total,discount_percent:memberDiscount,discount_amount:discountAmount,status:"pending",payment_method:"card_to_card",
      payer_full_name:String(b.payer_full_name).trim(),payment_tracking_code:String(b.payment_tracking_code).trim(),
      shipping_method_id:shipping.id,shipping_method_name:shipping.name,shipping_cost:shippingCost,estimated_delivery:shipping.estimated_delivery
    }).select("id,order_number,public_token").single();
    if(error){
      if(error.code==="23505"){
        const {data:duplicate}=await s.from("orders").select("id,public_token,total_price,subtotal_price,discount_percent,discount_amount,shipping_cost,estimated_delivery").eq("checkout_session_id",checkoutSessionId).maybeSingle();
        if(duplicate)return NextResponse.json(orderSummary(duplicate));
      }
      throw error;
    }
    const {error:itemError}=await s.from("order_items").insert(items.map((x:any)=>({...x,order_id:o.id})));
    if(itemError){await s.from("orders").delete().eq("id",o.id);throw itemError;}
    return NextResponse.json(orderSummary({...o,total_price:total,subtotal_price:subtotal,discount_percent:memberDiscount,discount_amount:discountAmount,shipping_cost:shippingCost,estimated_delivery:shipping.estimated_delivery}));
  }catch(e){
    const message=String((e as any)?.message||"");
    if(["quantity","size","stock","size_stock"].includes(message))return NextResponse.json({error:"موجودی یا اندازه یکی از محصولات تغییر کرده است. سبد خرید را بررسی کنید."},{status:400});
    return NextResponse.json({error:"خطا در ثبت سفارش. اطلاعات را بررسی و دوباره تلاش کنید."},{status:500});
  }
}