"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchBackend, readApiJson } from "@/config/api";
import { useLocalization } from "@/localization/LocalizationContext";
import { useLocation } from "@/router/nextCompat";

type Position="above-navbar"|"below-navbar"|"above-content";
type Banner={id:string;title:string;text:string;imageUrl?:string|null;altText:string;buttonText?:string|null;buttonUrl?:string|null;kind:"information"|"success"|"warning";position:Position;startAtUtc?:string|null;endAtUtc?:string|null;sortOrder:number;isDismissible:boolean;version:number;translationKeys:{title:string;text:string;alt:string;button:string}};
type Response={items:Banner[];nextChangeAtUtc?:string|null};

export default function BannerZone({position}:{position:Position}){
 const {pathname}=useLocation();const {t}=useLocalization();const [data,setData]=useState<Response>({items:[]});const [tick,setTick]=useState(0);const [failed,setFailed]=useState(false);
 useEffect(()=>{const c=new AbortController();fetchBackend(`/api/banners?path=${encodeURIComponent(pathname)}`,{signal:c.signal,cache:"no-store"}).then(readApiJson<Response>).then(v=>{if(!c.signal.aborted){setData(v);setFailed(false);}}).catch(()=>{if(!c.signal.aborted){setData({items:[]});setFailed(true);}});return()=>c.abort();},[pathname,tick]);
 useEffect(()=>{if(!data.nextChangeAtUtc)return;const at=Date.parse(data.nextChangeAtUtc);if(!Number.isFinite(at))return;const delay=Math.max(25,Math.min(2147483000,at-Date.now()+25));const timer=window.setTimeout(()=>setTick(v=>v+1),delay);return()=>clearTimeout(timer);},[data.nextChangeAtUtc]);
 const rows=useMemo(()=>data.items.filter(x=>x.position===position).filter(x=>{try{return localStorage.getItem(`ph-banner-dismissed:${x.id}:v${x.version}`)!=="1";}catch{return true;}}),[data.items,position,tick]);
 if(failed||rows.length===0)return null;
 return <div className={`ph-banner-zone ph-banner-zone--${position}`} role="region" aria-label={t("banners.region","Site messages")}>
  {rows.map(x=><article key={`${x.id}:${x.version}`} className={`ph-site-banner ph-site-banner--${x.kind}`}>
   {x.imageUrl?<img className="ph-site-banner-image" src={x.imageUrl} alt={t(x.translationKeys.alt,x.altText)} />:null}
   <div className="ph-site-banner-body"><strong>{t(x.translationKeys.title,x.title)}</strong><span>{t(x.translationKeys.text,x.text)}</span></div>
   {x.buttonText&&x.buttonUrl?<a className="btn btn-sm btn-outline-light ph-site-banner-action" href={x.buttonUrl}>{t(x.translationKeys.button,x.buttonText)}</a>:null}
   {x.isDismissible?<button type="button" className="ph-site-banner-close" aria-label={t("banners.dismiss","Dismiss message")} onClick={()=>{try{localStorage.setItem(`ph-banner-dismissed:${x.id}:v${x.version}`,"1");}catch{}setTick(v=>v+1);}}>×</button>:null}
  </article>)}
 </div>;
}
