"use client";

type Category={id:string;name:string;slug:string;description:string|null;sort_order:number};
type Product={id:string;category_ids?:string[];categories?:Array<{id?:string;slug?:string}>};

export default function StoreCategories({embedded=false,categories=[],products=[],loading=false}:{embedded?:boolean;categories?:Category[];products?:Product[];loading?:boolean}){
  const counts=new Map<string,number>();
  for(const product of products){
    const ids=new Set([...(product.category_ids||[]),...(product.categories||[]).flatMap(category=>[category.id,category.slug].filter(Boolean) as string[])]);
    for(const id of ids)counts.set(id,(counts.get(id)||0)+1);
  }
  const title=embedded?<h2>فروشگاه عطر کهکشان</h2>:<h1>فروشگاه عطر کهکشان</h1>;
  return <section id={embedded?"store-categories":undefined} className={embedded?"store-categories-embedded":"store-categories-page"} dir="rtl">
    {!embedded&&<header className="store-categories-header"><a href="/" className="store-categories-brand">♢ عطر کهکشان <small>GALAXY</small></a><a href="/">بازگشت به صفحه اصلی</a></header>}
    <section className="store-categories-intro"><span>GALAXY PERFUME STORE</span>{title}<p>برای کشف رایحهٔ موردنظرتان، یک دسته‌بندی را انتخاب کنید.</p></section>
    <form className="store-search" action="/store/all" method="get" role="search">
      <label htmlFor={embedded?"homepage-perfume-search":"store-perfume-search"}>جست‌وجوی مستقیم عطر</label>
      <div className="store-search-control"><span aria-hidden="true">⌕</span><input id={embedded?"homepage-perfume-search":"store-perfume-search"} type="search" name="q" placeholder="نام عطر موردنظرتان را بنویسید..." autoComplete="off"/><button type="submit">جست‌وجو</button></div>
    </form>
    {loading?<div className="store-categories-state" role="status">در حال بارگذاری دسته‌بندی‌ها…</div>:!categories.length?<div className="store-categories-state" role="status">در حال حاضر دسته‌بندی فعالی برای نمایش وجود ندارد.</div>:<nav className="store-category-grid" aria-label="دسته‌بندی محصولات">
      <a className="store-category-card store-category-all" href="/store/all">
        <span className="store-category-number">00</span><span className="store-category-star" aria-hidden="true">✦</span>
        <h3>همه محصولات</h3><p>تمام عطرها و ادکلن‌های فعال فروشگاه را یک‌جا مشاهده کنید.</p>
        <div className="store-category-bottom"><small>{products.length} محصول</small><b>مشاهده همه محصولات <span aria-hidden="true">←</span></b></div>
      </a>
      {categories.map((category,index)=><a className="store-category-card" href={"/store/"+encodeURIComponent(category.slug)} key={category.id}>
        <span className="store-category-number">{String(index+1).padStart(2,"0")}</span><span className="store-category-star" aria-hidden="true">✦</span>
        <h3>{category.name}</h3><p>{category.description||"مجموعه‌ای از رایحه‌های منتخب عطر کهکشان"}</p>
        <div className="store-category-bottom"><small>{counts.get(category.id)||counts.get(category.slug)||0} محصول</small><b>مشاهده محصولات <span aria-hidden="true">←</span></b></div>
      </a>)}
    </nav>}
  </section>;
}
