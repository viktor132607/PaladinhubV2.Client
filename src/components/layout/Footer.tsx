"use client";
import { useEffect, useState } from "react";
import { useLocalization } from "@/localization/LocalizationContext";
import { fetchBackend,readApiJson } from "@/config/api";
import { Link } from "@/router/nextCompat";
type Entry={id:string;parentId:string|null;kind:string;text:string;url:string;icon:string;sortOrder:number;openNewTab:boolean};
export default function Footer(){
 const {t}=useLocalization();const [entries,setEntries]=useState<Entry[]|null>(null);
 useEffect(()=>{let controller:AbortController;const load=()=>{controller?.abort();const c=new AbortController();controller=c;fetchBackend("/api/footer",{signal:c.signal,cache:"no-store"}).then(readApiJson<Entry[]>).then(x=>{if(!c.signal.aborted&&Array.isArray(x))setEntries(x);}).catch(()=>{if(!c.signal.aborted)setEntries(null);});};load();window.addEventListener("footer-updated",load);return()=>{controller?.abort();window.removeEventListener("footer-updated",load);};},[]);
 const text=(x:Entry)=>t(`footer.${x.id}.text`,x.text.replace("Made with 💛 for WoW Paladins",t("Made with 💛 for WoW Paladins"))).replaceAll("{year}",String(new Date().getFullYear()));
 const render=(x:Entry)=>{const label=<>{x.icon&&<i className={`fa-brands fa-${x.icon} me-2`} aria-hidden="true"/>}{text(x)}</>;
  if(["link","social","email","phone"].includes(x.kind)){const href=x.kind==="email"?`mailto:${x.url}`:x.kind==="phone"?`tel:${x.url}`:x.url;const props={target:x.openNewTab?"_blank":undefined,rel:x.openNewTab?"noopener noreferrer":undefined,className:"d-inline-block py-2",style:{overflowWrap:"anywhere" as const}};return href.startsWith("/")?<Link to={href} {...props}>{label}</Link>:<a href={href} {...props}>{label}</a>;}
  return <p className="mb-2" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{label}</p>;
 };
 return <footer className="border-top footer text-muted text-center mt-5 py-3 ph-v1-footer"><div className="container">
  {entries===null?<>© {new Date().getFullYear()} - PaladinHub | {t("Made with 💛 for WoW Paladins")}</>:<div className="d-flex flex-wrap justify-content-center gap-4">{entries.filter(x=>x.kind==="section").map(section=><section key={section.id} style={{flex:"1 1 200px",minWidth:0,maxWidth:"100%"}}>{section.text&&<h2 className="h6">{text(section)}</h2>}<ul className="list-unstyled mb-0">{entries.filter(x=>x.parentId===section.id).map(x=><li key={x.id}>{render(x)}</li>)}</ul></section>)}</div>}
 </div></footer>;
}
