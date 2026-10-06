import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shop",
  description: "Online shop powered by Next.js and Supabase"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}