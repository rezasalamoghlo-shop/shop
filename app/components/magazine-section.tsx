"use client";
import { useEffect, useState } from "react";
type Article = { id:string; title:string; slug:string; excerpt:string; content:string; image_url:string; created_at:string };
export default function MagazineSection() {
  const [articles,setArticles] = useState<Article[]>([]);
  const [active,setActive] = useState(0);
  const [selected,setSelected] = useState<Article|null>(null);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{let live=true;fetch("/api/magazine",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(live)setArticles(Array.isArray(d.articles)?d.articles:[])}).catch(()=>{}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[]);
  useEffect(()=>{if(articles.length<2)return;const timer=window.setInterval(()=>setActive(i=>(i+1)%articles.length),5500);return()=>window.clearInterval(timer)},[articles.length]);
  const current=articles.length?articles[active%articles.length]:null;
  const panel:React.CSSProperties={background:"#171120",border:"1px solid #3c2b4a",borderRadius:18,overflow:"hidden",color:"#fff"};
  const button:React.CSSProperties={border:"1px solid #8b6ca0",borderRadius:11,padding:"10px 15px",background:"#d0adf5",color:"#1b1023",fontWeight:700,cursor:"pointer"};
  return <section id="magazine" dir="rtl" style={{padding:"clamp(30px,5vw,64px) max(16px,calc((100vw - 1180px)/2))",background:"linear-gradient(180deg,#110c19,#1b1126 52%,#100b16)",color:"#fff",scrollMarginTop:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,flexWrap:"wrap",marginBottom:22}}>
      <div><span style={{color:"#c6a0ef",letterSpacing:3,fontSize:12}}>GALAXY PERFUME JOURNAL</span><h2 style={{fontSize:"clamp(26px,4vw,38px)",margin:"8px 0"}}>مجلهٔ عطر کهکشان</h2><p style={{color:"#c9bdd2",lineHeight:2,margin:0}}>راهنمای انتخاب رایحه، نت‌های بویایی و دنیای عطر و ادکلن، همین‌جا در فروشگاه.</p></div>
      <a href="/magazine" style={{color:"#e2cbff",textDecoration:"none",border:"1px solid #695379",padding:"10px 13px",borderRadius:11}}>آرشیو کامل مجله ↗</a>
    </div>
    {loading?<div style={{...panel,padding:24,textAlign:"center",color:"#d2c3df"}}>در حال بارگذاری مقاله‌ها…</div>:!articles.length?<div style={{...panel,padding:24,textAlign:"center"}}><div style={{fontSize:30,color:"#c9a5f1"}}>✧</div><h3>دنیای رایحه‌ها در راه است</h3><p style={{color:"#c9bdd2",lineHeight:2}}>مقاله‌های منتشرشده توسط مدیریت، همراه با تصویر و راهنمای عطر، در همین بخش نمایش داده می‌شوند.</p></div>:<>
      {current&&<div style={{...panel,position:"relative",minHeight:330,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,300px),1fr))"}}>
        <div style={{position:"relative",minHeight:300,overflow:"hidden",background:"#0c0811"}}><img key={current.id} src={current.image_url} alt={current.title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",animation:"galaxyMagazineFade 700ms ease"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(0deg,rgba(12,7,18,.4),transparent)"}}/></div>
        <div style={{padding:"clamp(20px,4vw,38px)",display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <small style={{color:"#c9a5f1"}}>مطلب {active+1} از {articles.length}</small><h3 style={{fontSize:"clamp(23px,3vw,32px)",lineHeight:1.7,margin:"8px 0"}}>{current.title}</h3><p style={{color:"#d2c6dc",lineHeight:2,whiteSpace:"pre-wrap"}}>{current.excerpt||current.content.slice(0,200)}</p><div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginTop:10}}><button style={button} onClick={()=>setSelected(current)}>خواندن مقالهٔ کامل</button><div style={{display:"flex",gap:6,alignItems:"center"}}><button aria-label="مقاله قبلی" onClick={()=>setActive(i=>(i-1+articles.length)%articles.length)} style={{...button,padding:"8px 13px",background:"transparent",color:"#fff"}}>›</button><button aria-label="مقاله بعدی" onClick={()=>setActive(i=>(i+1)%articles.length)} style={{...button,padding:"8px 13px",background:"transparent",color:"#fff"}}>‹</button></div></div>
        </div>
        <div style={{position:"absolute",bottom:0,right:0,left:0,height:3,background:"#ffffff18"}}><div key={current.id} style={{height:"100%",background:"#c6a0ef",animation:"galaxyMagazineProgress 5.5s linear"}}/></div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:14,marginTop:18}}>
        {articles.map((a,i)=><button key={a.id} onClick={()=>{setActive(i);setSelected(null)}} style={{...panel,textAlign:"right",padding:0,cursor:"pointer",borderColor:i===active?"#bd91eb":"#3c2b4a",outline:i===active?"1px solid #bd91eb":"none"}}>
          <img src={a.image_url} alt={a.title} loading="lazy" style={{width:"100%",height:150,objectFit:"cover",display:"block"}}/><span style={{display:"block",padding:13}}><b style={{display:"block",lineHeight:1.8}}>{a.title}</b><small style={{display:"block",color:"#c7b8d4",lineHeight:1.8,marginTop:5}}>{(a.excerpt||a.content).slice(0,95)}{(a.excerpt||a.content).length>95?"…":""}</small><span style={{display:"block",color:"#d0adf5",marginTop:10,fontSize:13}}>انتخاب و مطالعه ←</span></span>
        </button>)}
      </div>
    </>}
    {selected&&<div role="dialog" aria-modal="true" aria-label={selected.title} onClick={()=>setSelected(null)} style={{position:"fixed",zIndex:1000,inset:0,background:"#08050bd9",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <article onClick={e=>e.stopPropagation()} style={{width:"min(900px,100%)",maxHeight:"90vh",overflowY:"auto",background:"#171120",color:"#fff",border:"1px solid #6d527e",borderRadius:20,position:"relative"}}>
        <button onClick={()=>setSelected(null)} aria-label="بستن مقاله" style={{position:"sticky",top:12,float:"left",margin:12,zIndex:2,border:0,borderRadius:99,width:38,height:38,background:"#2b1d37",color:"#fff",fontSize:24,cursor:"pointer"}}>×</button>
        <img src={selected.image_url} alt={selected.title} style={{width:"100%",maxHeight:360,objectFit:"cover",display:"block"}}/>
        <div style={{padding:"clamp(18px,4vw,36px)"}}><small style={{color:"#c6a0ef"}}>مجلهٔ عطر کهکشان</small><h2 style={{fontSize:"clamp(24px,4vw,36px)",lineHeight:1.7}}>{selected.title}</h2>{selected.excerpt&&<p style={{color:"#d1c4dc",fontSize:17,lineHeight:2}}>{selected.excerpt}</p>}<div style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",lineHeight:2.2,fontSize:16}}>{selected.content}</div></div>
      </article>
    </div>}
    <style jsx>{`@keyframes galaxyMagazineFade{from{opacity:.15;transform:scale(1.025)}to{opacity:1;transform:scale(1)}}@keyframes galaxyMagazineProgress{from{width:0}to{width:100%}}@media(prefers-reduced-motion:reduce){section *{animation:none!important;transition:none!important}}`}</style>
  </section>;
}
