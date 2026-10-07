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
  return <html lang="fa" dir="rtl"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/></head><body>{children}<LiveAdminStats/></body></html>;
}
