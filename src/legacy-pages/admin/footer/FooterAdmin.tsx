"use client";
import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-categories";
type Entry={id:string;parentId:string|null;name:string;kind:string;text:string;url:string;icon:string;sortOrder:number;openNewTab:boolean;isArchived:boolean;isDeleted:boolean;version:number};
type Revision={id:string;version:number;action:string;actor:string;createdAtUtc:string;snapshot:string};
const empty={parentId:null as string|null,name:"",kind:"section",text:"",url:"",icon:"",sortOrder:0,openNewTab:false};
const draftOf=(x:Entry)=>({parentId:x.parentId,name:x.name,kind:x.kind,text:x.text,url:x.url,icon:x.icon,sortOrder:x.sortOrder,openNewTab:x.openNewTab});
const field="min-w-0 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-base";
const button="min-h-11 max-w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 disabled:opacity-40";
export default function FooterAdmin(){
 const [rows,setRows]=useState<Entry[]>([]),[selected,setSelected]=useState<Entry|null>(null),[draft,setDraft]=useState(empty),[history,setHistory]=useState<Revision[]>([]);
 const [busy,setBusy]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState(""),[search,setSearch]=useState(""),[status,setStatus]=useState("active");
 const reload=()=>adminRequest<Entry[]>("/Admin/api/footer").then(setRows);
 useEffect(()=>{const c=new AbortController();adminRequest<Entry[]>("/Admin/api/footer","GET",undefined,c.signal).then(setRows).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setBusy(false);});return()=>c.abort();},[]);
 const dirty=JSON.stringify(draft)!==JSON.stringify(selected?draftOf(selected):empty);
 const discard=()=>!dirty||window.confirm("Discard unsaved footer changes?");
 const editable=!selected||!selected.isArchived&&!selected.isDeleted;
 async function run(action:()=>Promise<void>){setBusy(true);setError("");setNotice("");try{await action();}catch(e){setError(e instanceof Error?e.message:"Operation failed.");}finally{setBusy(false);}}
 async function choose(x:Entry|null){if(!discard())return;setSelected(x);setDraft(x?draftOf(x):empty);setHistory([]);if(x)await run(async()=>setHistory(await adminRequest<Revision[]>(`/Admin/api/footer/${x.id}/history`)));}
 async function saved(x:Entry){await reload();setSelected(x);setDraft(draftOf(x));setHistory(await adminRequest<Revision[]>(`/Admin/api/footer/${x.id}/history`));window.dispatchEvent(new Event("footer-updated"));setNotice("Footer saved.");}
 async function save(){await run(async()=>saved(await adminRequest<Entry>(`/Admin/api/footer${selected?`/${selected.id}`:""}`,selected?"PUT":"POST",{...draft,version:selected?.version??0})));}
 async function change(action:string,revisionId?:string){if(!selected||!discard()||!window.confirm(`${action} this footer entry?`))return;await run(async()=>saved(await adminRequest<Entry>(`/Admin/api/footer/${selected.id}/actions`,"POST",{action,revisionId,version:selected.version})));}
 return <main className="min-w-0 space-y-4 p-3 text-slate-100 sm:p-6">
  <h1 className="text-2xl text-amber-400">Footer & contacts</h1>
  {error&&<p role="alert" className="break-words text-red-300">{error}</p>}{notice&&<p role="status" className="text-green-300">{notice}</p>}
  <fieldset disabled={busy} className="min-w-0 space-y-4">
   <div className="flex flex-wrap gap-2"><button className={button} onClick={()=>void choose(null)}>New entry</button><button className={button} onClick={()=>{if(discard())void run(async()=>{await reload();setSelected(null);setDraft(empty);setHistory([]);});}}>Reload footer</button></div>
   <div className="grid gap-3 sm:grid-cols-2"><div className="min-w-0"><label className="block" htmlFor="footer-field-1">Search footer</label><input id="footer-field-1" className={field} value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="min-w-0"><label className="block" htmlFor="footer-field-2">Entry status</label><select id="footer-field-2" className={field} value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="deleted">Deleted</option><option value="all">All</option></select></div></div>
   <div className="max-h-72 space-y-2 overflow-y-auto">{rows.filter(x=>(status==="all"||(status==="deleted"?x.isDeleted:status==="archived"?x.isArchived&&!x.isDeleted:!x.isDeleted&&!x.isArchived))&&`${x.name} ${x.text}`.toLowerCase().includes(search.toLowerCase())).map(x=><button className={`${button} block w-full break-words text-left ${selected?.id===x.id?"border-amber-400":""}`} key={x.id} aria-pressed={selected?.id===x.id} onClick={()=>void choose(x)}>{x.name} · {x.kind} · {x.parentId?rows.find(p=>p.id===x.parentId)?.name:"Root"} · v{x.version}{x.isDeleted?" · Deleted":x.isArchived?" · Archived":""}</button>)}</div>
   <fieldset disabled={!editable} className="min-w-0 space-y-3">
    <div className="grid gap-3 sm:grid-cols-2"><div className="min-w-0"><label className="block" htmlFor="footer-field-3">Internal name</label><input id="footer-field-3" className={field} maxLength={100} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></div><div className="min-w-0"><label className="block" htmlFor="footer-field-4">Entry type</label><select id="footer-field-4" className={field} value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value,parentId:e.target.value==="section"?null:draft.parentId})}>{["section","text","link","email","phone","social","copyright"].map(k=><option key={k}>{k}</option>)}</select></div></div>
    {draft.kind!=="section"&&<div className="min-w-0"><label className="block" htmlFor="footer-field-5">Parent section</label><select id="footer-field-5" className={field} value={draft.parentId??""} onChange={e=>setDraft({...draft,parentId:e.target.value||null})}><option value="">Choose a section</option>{rows.filter(x=>x.kind==="section"&&!x.isDeleted&&(!x.isArchived||x.id===draft.parentId)).map(x=><option key={x.id} value={x.id}>{x.name}{x.isArchived?" (archived)":""}</option>)}</select></div>}
    <div className="min-w-0"><label className="block" htmlFor="footer-field-6">Display text</label><textarea id="footer-field-6" className={field} rows={3} maxLength={4000} value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})}/></div>
    {draft.kind==="copyright"&&<p className="text-sm text-slate-400">Use {"{year}"} for the current year.</p>}
    {["link","email","phone","social"].includes(draft.kind)&&<div className="min-w-0"><label className="block" htmlFor="footer-field-7">{draft.kind==="email"?"Email address":draft.kind==="phone"?"Phone number":"Link URL"}</label><input id="footer-field-7" className={field} maxLength={2048} value={draft.url} onChange={e=>setDraft({...draft,url:e.target.value})}/></div>}
    {draft.kind==="social"&&<div className="min-w-0"><label className="block" htmlFor="footer-field-8">Social icon</label><select id="footer-field-8" className={field} value={draft.icon} onChange={e=>setDraft({...draft,icon:e.target.value})}><option value="">No icon</option>{["facebook","instagram","youtube","discord","twitch","twitter","github"].map(k=><option key={k}>{k}</option>)}</select></div>}
    <div className="min-w-0"><label className="block" htmlFor="footer-field-9">Sort order</label><input id="footer-field-9" className={field} type="number" value={draft.sortOrder} onChange={e=>setDraft({...draft,sortOrder:Number(e.target.value)})}/></div>
    <label className="flex items-center gap-2"><input type="checkbox" checked={draft.openNewTab} onChange={e=>setDraft({...draft,openNewTab:e.target.checked})}/>Open link in new tab</label>
    <button className={button} disabled={!draft.name.trim()} onClick={()=>void save()}>Save footer entry</button>
   </fieldset>
   {selected&&<><p className="break-all text-sm text-slate-400">Translation key: footer.{selected.id}.text</p><div className="flex flex-wrap gap-2">{!selected.isDeleted&&<><button className={button} onClick={()=>void change(selected.isArchived?"unarchive":"archive")}>{selected.isArchived?"Unarchive":"Archive"}</button><button className={button} onClick={()=>void change("delete")}>Delete entry</button></>}</div><h2 className="text-xl">Footer history</h2>{history.map(h=><div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700 p-3" key={h.id}><span className="break-words">v{h.version} · {h.action} · {h.actor} · {new Date(h.createdAtUtc).toLocaleString()}</span><button className={button} disabled={JSON.parse(h.snapshot).IsDeleted} onClick={()=>void change("restore",h.id)}>Restore v{h.version}</button></div>)}</>}
  </fieldset>
 </main>;
}
