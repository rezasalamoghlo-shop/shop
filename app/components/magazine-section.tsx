"use client";
import { useEffect, useState } from "react";
type Article = { id:string; title:string; slug:string; excerpt:string; content:string; image_url:string; created_at:string };
export default function MagazineSection() {
  const [articles,setArticles] = useState<Article[]>([]);
  const [active,setActive] = useState(0);
  const [selected,setSelected] = useState<Article|null>(null);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{let live=true;fetch("/api/magazine",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(live)setArticles(Array.isArray(d.articles)?d.articles:[])}).catch(()=>{}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[]);
  useEffect(()=>{if(articles.length<2||selected)return;const timer=window.setInterval(()=>setActive(i=>(i+1)%articles.length),15000);return()=>window.clearInterval(timer)},[articles.length,selected]);
  const current=articles.length?articles[active%articles.length]:null;
  const panel:React.CSSProperties={background:"#171120",border:"1px solid #3c2b4a",borderRadius:18,overflow:"hidden",color:"#fff"};
  const button:React.CSSProperties={border:"1px solid #8b6ca0",borderRadius:11,padding:"10px 15px",background:"#d0adf5",color:"#1b1023",fontWeight:700,cursor:"pointer"};
  function openArticle(a:Article){setSelected(a);setActive(articles.findIndex(x=>x.id===a.id));}
  function closeArticle(){setSelected(null);}
  return <section id="magazine" dir="rtl" style={{padding:"clamp(30px,5vw,64px) max(16px,calc((100vw - 1180px)/2))",background:"linear-gradient(180deg,#110c19,#1b1126 52%,#100b16)",color:"#fff",scrollMarginTop:20}}>
    <div style={{marginBottom:22}}>
      <span style={{color:"#c6a0ef",letterSpacing:3,fontSize:12}}>GALAXY PERFUME JOURNAL</span>
      <h2 style={{fontSize:"clamp(26px,4vw,38px)",margin:"8px 0"}}>مجلهٔ عطر کهکشان</h2>
      <p style={{color:"#c9bdd2",lineHeight:2,margin:0}}>صفحه‌هایی تصویری از دنیای رایحه‌ها؛ هر صفحه را باز کن و با خیال راحت بخوان.</p>
    </div>
    {loading?<div style={{...panel,padding:24,textAlign:"center",color:"#d2c3df"}}>در حال بارگذاری صفحه‌های مجله…</div>:!articles.length?<div style={{...panel,padding:24,textAlign:"center"}}><div style={{fontSize:30,color:"#c9a5f1"}}>✧</div><h3>دنیای رایحه‌ها در راه است</h3><p style={{color:"#c9bdd2",lineHeight:2}}>مدیریت می‌تواند برای هر صفحه یک تصویر و متن ثبت کند؛ صفحه‌های منتشرشده اینجا نمایش داده می‌شوند.</p></div>:current&&<>
      <div style={{...panel,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,300px),1fr))",position:"relative"}}>
        <button type="button" onClick={()=>openArticle(current)} aria-label={"مطالعه "+current.title} style={{display:"block",position:"relative",minHeight:320,padding:0,border:0,background:"#0c0811",cursor:"pointer",overflow:"hidden",textAlign:"inherit"}}>
          <img key={current.id} src={current.image_url} alt={current.title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",animation:"galaxyMagazineFade 700ms ease"}}/>
          <span style={{position:"absolute",bottom:16,right:16,background:"#171120dd",color:"#fff",padding:"8px 12px",borderRadius:10}}>برای مطالعه انتخاب کن ↗</span>
        </button>
        <div style={{padding:"clamp(20px,4vw,38px)",display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <small style={{color:"#c9a5f1"}}>صفحهٔ {active+1} از {articles.length}</small>
          <h3 style={{fontSize:"clamp(23px,3vw,32px)",lineHeight:1.7,margin:"8px 0"}}>{current.title}</h3>
          <p style={{color:"#d2c6dc",lineHeight:2,whiteSpace:"pre-wrap"}}>{current.excerpt||current.content.slice(0,260)}</p>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginTop:10}}>
            <button style={button} onClick={()=>openArticle(current)}>مطالعهٔ این صفحه</button>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button aria-label="صفحه قبلی" onClick={()=>setActive(i=>(i-1+articles.length)%articles.length)} style={{...button,padding:"8px 13px",background:"transparent",color:"#fff"}}>›</button>
              <button aria-label="صفحه بعدی" onClick={()=>setActive(i=>(i+1)%articles.length)} style={{...button,padding:"8px 13px",background:"transparent",color:"#fff"}}>‹</button>
            </div>
          </div>
        </div>
        <div style={{position:"absolute",bottom:0,right:0,left:0,height:3,background:"#ffffff18"}}><div key={current.id} style={{height:"100%",background:"#c6a0ef",animation:selected?"none":"galaxyMagazineProgress 15s linear"}}/></div>
      </div>
      <div aria-label="انتخاب صفحه مجله" style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",marginTop:16}}>
        {articles.map((a,i)=><button key={a.id} onClick={()=>setActive(i)} aria-label={"رفتن به صفحه "+(i+1)} aria-current={i===active?"page":undefined} style={{width:i===active?30:9,height:9,border:0,borderRadius:99,background:i===active?"#d0adf5":"#6b5879",cursor:"pointer",transition:"width .2s"}}/>)}
      </div>
    </>}
    {selected&&<div role="dialog" aria-modal="true" aria-label={selected.title} onClick={closeArticle} style={{position:"fixed",zIndex:1000,inset:0,background:"#08050bd9",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <article onClick={e=>e.stopPropagation()} style={{width:"min(900px,100%)",maxHeight:"90vh",overflowY:"auto",background:"#171120",color:"#fff",border:"1px solid #6d527e",borderRadius:20,position:"relative"}}>
        <button onClick={closeArticle} aria-label="بستن و ادامه ورق‌زدن" style={{position:"sticky",top:12,float:"left",margin:12,zIndex:2,border:0,borderRadius:99,width:38,height:38,background:"#2b1d37",color:"#fff",fontSize:24,cursor:"pointer"}}>×</button>
        <img src={selected.image_url} alt={selected.title} style={{width:"100%",maxHeight:360,objectFit:"cover",display:"block"}}/>
        <div style={{padding:"clamp(18px,4vw,36px)"}}><small style={{color:"#c6a0ef"}}>مجلهٔ عطر کهکشان</small><h2 style={{fontSize:"clamp(24px,4vw,36px)",lineHeight:1.7}}>{selected.title}</h2>{selected.excerpt&&<p style={{color:"#d1c4dc",fontSize:17,lineHeight:2,whiteSpace:"pre-wrap"}}>{selected.excerpt}</p>}<div style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",lineHeight:2.2,fontSize:16}}>{selected.content}</div><button onClick={closeArticle} style={{...button,marginTop:24}}>پایان مطالعه و ادامهٔ مجله</button></div>
      </article>
    </div>}
    <style jsx>{`@keyframes galaxyMagazineFade{from{opacity:.15;transform:scale(1.025)}to{opacity:1;transform:scale(1)}}@keyframes galaxyMagazineProgress{from{width:0}to{width:100%}}@media(prefers-reduced-motion:reduce){section *{animation:none!important;transition:none!important}}`}</style>
  </section>;
}
