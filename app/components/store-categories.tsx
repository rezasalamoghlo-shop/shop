"use client";

import {useEffect,useMemo,useState} from "react";

type Category={id:string;name:string;slug:string;description:string|null;sort_order:number};
type Product={id:string;category_ids?:string[];categories?:Array<{id?:string;slug?:string}>};

export default function StoreCategories(){
  const [categories,setCategories]=useState<Category[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    let active=true;
    fetch("/api/storefront",{cache:"no-store"})
      .then(async response=>{if(!response.ok)throw new Error("دریافت اطلاعات فروشگاه ممکن نشد.");return response.json()})
      .then(data=>{if(!active)return;setCategories(Array.isArray(data.categories)?data.categories:[]);setProducts(Array.isArray(data.products)?data.products:[])})
      .catch(()=>{if(active)setError("در حال حاضر دریافت دسته‌بندی‌ها ممکن نیست. لطفاً دوباره تلاش کنید.")})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[]);
  const counts=useMemo(()=>{
    const result=new Map<string,number>();
    for(const product of products){
      const ids=new Set([...(product.category_ids||[]),...(product.categories||[]).flatMap(category=>[category.id,category.slug].filter(Boolean) as string[])]);
      for(const id of ids)result.set(id,(result.get(id)||0)+1);
    }
    return result;
  },[products]);
  return <main className="store-categories-page" dir="rtl">
    <header className="store-categories-header"><a href="/" className="store-categories-brand">♢ عطر کهکشان <small>GALAXY</small></a><a href="/">بازگشت به صفحه اصلی</a></header>
    <section className="store-categories-intro"><span>GALAXY PERFUME STORE</span><h1>فروشگاه عطر کهکشان</h1><p>برای کشف رایحهٔ موردنظرتان، یک دسته‌بندی را انتخاب کنید.</p></section>
    {loading?<div className="store-categories-state">در حال بارگذاری دسته‌بندی‌ها…</div>:error?<div className="store-categories-state" role="alert">{error}</div>:categories.length?<nav className="store-category-grid" aria-label="دسته‌بندی محصولات">
      {categories.map((category,index)=><a className="store-category-card" href={"/store/"+encodeURIComponent(category.slug)} key={category.id} style={{["--category-index" as string]:index} as React.CSSProperties}>
        <span className="store-category-number">{String(index+1).padStart(2,"0")}</span><span className="store-category-star" aria-hidden="true">✦</span>
        <h2>{category.name}</h2><p>{category.description||"مجموعه‌ای از رایحه‌های منتخب عطر کهکشان"}</p>
        <div className="store-category-bottom"><small>{counts.get(category.id)||counts.get(category.slug)||0} محصول</small><b>مشاهده محصولات <span aria-hidden="true">←</span></b></div>
      </a>)}
    </nav>:<div className="store-categories-state">هنوز دسته‌بندی فعالی در فروشگاه ثبت نشده است.</div>}
  </main>;
}
