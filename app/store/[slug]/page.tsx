"use client";

import {useParams} from "next/navigation";
import Home from "@/app/page";

export default function StoreCategoryPage(){
  const params=useParams<{slug:string}>();
  return <Home/>;
}
