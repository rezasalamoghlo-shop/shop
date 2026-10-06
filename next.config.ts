import type { NextConfig } from "next";

const nextConfig:NextConfig={
  reactStrictMode:true,
  images:{
    remotePatterns:[
      {protocol:"https",hostname:"ilkmxaiwczdwuvutkajq.supabase.co",pathname:"/**"}
    ],
    formats:["image/avif","image/webp"],
    minimumCacheTTL:86400
  }
};

export default nextConfig;
