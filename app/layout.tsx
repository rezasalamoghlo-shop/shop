import type {Metadata} from "next";
import "./globals.css";
import LiveAdminStats from "@/app/components/live-admin-stats";

export const metadata:Metadata={
  title:"خرید عطر و ادکلن | فروشگاه عطر کهکشان",
  description:"فروشگاه عطر کهکشان؛ انتخاب و خرید عطر و ادکلن با امکان خرید میلی یا بطری کامل، بررسی رایحه‌ها و دریافت مشاوره هوشمند برای انتخاب عطر مناسب.",
  keywords:["عطر کهکشان","GALAXY","عطر","ادکلن","خرید عطر","فروشگاه عطر","خرید ادکلن","عطر اصل"],
  metadataBase:new URL("https://shop-gamma-wheat.vercel.app"),
  alternates:{canonical:"/"},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true}},
  icons:{icon:"/icon.svg",shortcut:"/icon.svg",apple:"/icon.svg"},
  openGraph:{
    title:"خرید عطر و ادکلن | فروشگاه عطر کهکشان",
    description:"فروشگاه عطر کهکشان؛ انتخاب و خرید عطر و ادکلن با امکان خرید میلی یا بطری کامل، بررسی رایحه‌ها و دریافت مشاوره هوشمند برای انتخاب عطر مناسب.",
    url:"https://shop-gamma-wheat.vercel.app",
    siteName:"فروشگاه عطر کهکشان",
    locale:"fa_IR",
    type:"website"
  },
  twitter:{
    card:"summary",
    title:"خرید عطر و ادکلن | عطر کهکشان",
    description:"خرید عطر و ادکلن به‌صورت میلی یا بطری کامل از فروشگاه عطر کهکشان."
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="fa" dir="rtl"><head><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"WebSite","name":"فروشگاه عطر کهکشان","alternateName":["عطر کهکشان","GALAXY Perfume"],"url":"https://shop-gamma-wheat.vercel.app/"})}}/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/></head><body>{children}<LiveAdminStats/></body></html>;
}
