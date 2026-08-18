
"use client";
import { useState } from "react";
export type EditOverlayProps = { imageUrl?: string; buttonLabel?: string };
export default function EditOverlay({ imageUrl = "/images/WorkInProgress.jpg", buttonLabel = "Edit Page" }: EditOverlayProps) { const [open, setOpen] = useState(false); return <><button type="button" onClick={() => setOpen(true)} className="fixed bottom-20 left-20 z-40 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950">{buttonLabel}</button>{open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-8" role="dialog" aria-modal="true" onClick={() => setOpen(false)}><button type="button" className="absolute right-8 top-6 text-4xl text-white" aria-label="Close">×</button><img src={imageUrl} alt="Work in progress" className="max-h-[80vh] max-w-[80vw] rounded-lg" onClick={(event) => event.stopPropagation()} /></div> : undefined}</>; }
