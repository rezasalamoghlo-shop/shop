import type {Metadata} from "next";
import "./globals.css";
import LiveAdminStats from "@/app/components/live-admin-stats";

export const metadata:Metadata={
  title:"عطر کهکشان | GALAXY",
  description:"فروشگاه اینترنتی عطر و ادکلن عطر کهکشان، انتخاب رایحه‌های لوکس و ماندگار.",
  keywords:["عطر کهکشان","GALAXY","عطر","ادکلن","خرید عطر","فروشگاه عطر","خرید ادکلن","عطر اصل"],
  metadataBase:new URL("https://shop-gamma-wheat.vercel.app"),
  alternates:{canonical:"/"},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true}},
  icons:{icon:"/icon.svg",shortcut:"/icon.svg",apple:"/icon.svg"},
  openGraph:{
    title:"عطر کهکشان | GALAXY",
    description:"فروشگاه اینترنتی عطر و ادکلن عطر کهکشان، انتخاب رایحه‌های لوکس و ماندگار.",
    url:"https://shop-gamma-wheat.vercel.app",
    siteName:"عطر کهکشان | GALAXY",
    locale:"fa_IR",
    type:"website"
  },
  twitter:{
    card:"summary",
    title:"عطر کهکشان | GALAXY",
    description:"فروشگاه اینترنتی عطر و ادکلن عطر کهکشان"
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="fa" dir="rtl"><head><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"WebSite","name":"عطر کهکشان","alternateName":["GALAXY","عطر کهکشان | GALAXY"],"url":"https://shop-gamma-wheat.vercel.app/"})}}/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/></head><body>{children}<a href="/magazine" aria-label="مجله عطر کهکشان" style={{position:"fixed",zIndex:50,left:18,bottom:18,display:"inline-flex",alignItems:"center",gap:8,padding:"12px 16px",borderRadius:999,background:"linear-gradient(135deg,#3a2255,#171020)",border:"1px solid #a67bce",boxShadow:"0 8px 28px #0006",color:"#fff",textDecoration:"none",fontWeight:700}}>✦ مجلهٔ عطر کهکشان</a><LiveAdminStats/></body></html>;
}
