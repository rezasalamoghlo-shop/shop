"use client";
import {useEffect,useState} from "react";
import {createSupabaseBrowserClient} from "@/lib/supabase-browser";
export default function LiveAdminStats(){
 const[path,setPath]=useState("");const[count,setCount]=useState(0);
 useEffect(()=>{setPath(location.pathname)},[]);
 useEffect(()=>{if(path!=="/admin")return;const supabase=createSupabaseBrowserClient();const channel=supabase.channel("galaxy-site-presence");const sync=()=>{const state=channel.presenceState();setCount(Object.keys(state).length)};channel.on("presence",{event:"sync"},sync).subscribe();return()=>{supabase.removeChannel(channel)}},[path]);
 if(path!=="/admin")return null;
 return <section className="live-admin-stats"><div><span>LIVE</span><b>{new Intl.NumberFormat("fa-IR").format(count)}</b><small>بازدیدکننده آنلاین</small></div><div><span>STATUS</span><b>●</b><small>اتصال زنده فعال است</small></div></section>
}