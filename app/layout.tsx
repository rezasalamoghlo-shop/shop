import type {Metadata} from "next";
import "./globals.css";
import LiveAdminStats from "@/app/components/live-admin-stats";

export const metadata:Metadata={
  title:{default:"عطر کهکشان | فروشگاه تخصصی عطر و ادکلن",template:"%s | عطر کهکشان"},
  description:"فروشگاه اینترنتی عطر کهکشان؛ خرید عطر و ادکلن، بررسی مشخصات و نت‌های بویایی، انتخاب رایحه و آشنایی با دنیای عطرها.",
  keywords:["عطر کهکشان","خرید عطر","خرید ادکلن","فروشگاه عطر و ادکلن","مشخصات عطر","نت‌های بویایی","ماندگاری عطر","عطر مردانه","عطر زنانه"],
  metadataBase:new URL("https://shop-gamma-wheat.vercel.app"),
  alternates:{canonical:"/"},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true}},
  icons:{icon:"/icon.svg",shortcut:"/icon.svg",apple:"/icon.svg"},
  openGraph:{
    title:"عطر کهکشان | فروشگاه تخصصی عطر و ادکلن",
    description:"فروشگاه اینترنتی عطر و ادکلن عطر کهکشان، انتخاب رایحه‌های لوکس و ماندگار.",
    url:"https://shop-gamma-wheat.vercel.app",
    siteName:"عطر کهکشان",
    locale:"fa_IR",
    type:"website"
  },
  twitter:{
    card:"summary",
    title:"عطر کهکشان | فروشگاه تخصصی عطر و ادکلن",
    description:"فروشگاه اینترنتی عطر کهکشان؛ خرید عطر و ادکلن و شناخت رایحه‌ها."
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="fa" dir="rtl"><head><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"WebSite","name":"عطر کهکشان","alternateName":["GALAXY","فروشگاه عطر کهکشان"],"url":"https://shop-gamma-wheat.vercel.app/"})}}/></head><body>{children}<LiveAdminStats/></body></html>;
}
