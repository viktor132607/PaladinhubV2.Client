"use client";

import { useEffect,useRef,useState,type ReactNode } from "react";
import { Link,Outlet,useLocation } from "@/router/nextCompat";
import Navbar from "@/components/layout/Navbar";

const secondaryLinks=[["Pages","/Admin/PageBuilder"],["Talent Trees","/Admin/PageBuilder/TalentTrees"],["Database","/Admin/Database"],["Products","/Merchandise/Merchandise"]] as const;
const sidebarSections=[
 {title:"Content",links:[["Page Builder","/Admin/PageBuilder"],["Talent Tree Builder","/Admin/PageBuilder/TalentTrees"],["Add Page","/Admin/PageBuilder/Create"],["Banners & messages","/Admin/Banners"]]},
 {title:"Data",links:[["Database","/Admin/Database"],["Categories","/Admin/Categories"],["Classes & specializations","/Admin/Classes"],["Tags","/Admin/Tags"],["Patches","/Admin/Patches"],["Item rarities","/Admin/Rarities"],["Media library","/Admin/Media"],["Navigation","/Admin/Navigation"],["Languages & translations","/Admin/Translations"]]},
 {title:"Commerce",links:[["Products","/Merchandise/Merchandise"],["Promo Codes","/Admin/PromoCodes"],["Create Promo Code","/Admin/PromoCodes/Create"]]}
] as const;

export default function AdminLayout({children}:{children?:ReactNode}){
 const [promoOpen,setPromoOpen]=useState(false),[sectionsOpen,setSectionsOpen]=useState(false);const {pathname}=useLocation();const promoRef=useRef<HTMLDivElement>(null);const normalizedPath=pathname.toLowerCase().replace(/\/+$/,"")||"/";const fullWidthWorkspace=normalizedPath==="/admin/pagebuilder/talenttrees";
 useEffect(()=>{setPromoOpen(false);setSectionsOpen(false);},[pathname]);
 useEffect(()=>{const close=(event:MouseEvent)=>{if(!promoRef.current?.contains(event.target as Node))setPromoOpen(false);};document.addEventListener("click",close);return()=>document.removeEventListener("click",close);},[]);
 const isActive=(to:string)=>{const target=to.toLowerCase();if(target==="/admin/pagebuilder")return normalizedPath.startsWith("/admin/pagebuilder")&&normalizedPath!=="/admin/pagebuilder/talenttrees";if(target==="/admin/promocodes")return normalizedPath.startsWith("/admin/promocodes");return normalizedPath===target||normalizedPath.startsWith(`${target}/`);};
 return <div className="ph-admin min-vh-100"><Navbar forceVisible/>
  <header className="admin-secondary-nav"><nav className="admin-secondary-nav-inner" aria-label="Admin navigation">{secondaryLinks.map(([label,to])=><Link key={label} to={to} className={`admin-secondary-link${isActive(to)?" active":""}`}>{label}</Link>)}<div className="admin-secondary-dropdown" ref={promoRef}><button type="button" className={`admin-secondary-link admin-secondary-button${normalizedPath.startsWith("/admin/promocodes")?" active":""}`} aria-expanded={promoOpen} onClick={()=>setPromoOpen(v=>!v)}>Promo Codes <span aria-hidden="true">▾</span></button>{promoOpen?<div className="admin-secondary-dropdown-menu"><Link to="/Admin/PromoCodes">All</Link><Link to="/Admin/PromoCodes/Create">Create</Link></div>:null}</div></nav></header>
  <button type="button" className="admin-sections-toggle" aria-controls="admin-sections" aria-expanded={sectionsOpen} onClick={()=>setSectionsOpen(v=>!v)}>Admin sections <span aria-hidden="true">{sectionsOpen?"−":"+"}</span></button>
  <div className="admin-shell"><aside id="admin-sections" className={`admin-shell-sidebar${sectionsOpen?" is-open":""}`} aria-label="Admin sections"><div className="admin-shell-sidebar-title">Admin</div>{sidebarSections.map(section=><section className="admin-sidebar-section" key={section.title}><h2>{section.title}</h2><nav aria-label={`${section.title} admin links`}>{section.links.map(([label,to])=><Link key={label} to={to} className={`admin-sidebar-link${isActive(to)?" active":""}`}>{label}</Link>)}</nav></section>)}</aside><div className={`admin-shell-main${fullWidthWorkspace?" admin-shell-main--full":""}`}>{children??<Outlet/>}</div></div>
  {!fullWidthWorkspace?<footer className="footer bg-dark text-light text-center py-2">Admin Panel © {new Date().getFullYear()}</footer>:null}
 </div>;
}
