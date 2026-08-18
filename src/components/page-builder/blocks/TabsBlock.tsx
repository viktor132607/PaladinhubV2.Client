
"use client";
import { useState } from "react";
import { HtmlContent } from "@/components/migration/MigratedView";
export type TabEntry = { title?: string; html?: string };
export type TabsBlockProps = { id?: string; tabs?: TabEntry[] };
export default function TabsBlock({ id, tabs = [] }: TabsBlockProps) { const [active, setActive] = useState(0); if (!tabs.length) return <div className="alert">No tabs configured.</div>; return <section id={id}><div className="flex flex-wrap border-b border-slate-700">{tabs.map((tab, index) => <button key={index} type="button" onClick={() => setActive(index)} className={`rounded-t px-4 py-2 ${active === index ? "bg-slate-800" : ""}`}>{tab.title ?? `Tab ${index + 1}`}</button>)}</div><HtmlContent html={tabs[active]?.html ?? ""} className="rounded-b border border-t-0 border-slate-700 bg-slate-900 p-4" /></section>; }
