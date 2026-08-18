
"use client";

import { useState } from "react";

export type PageHeaderButton = {
  text: string;
  url: string;
  icon?: string;
};

export type PageHeaderProps = {
  coverImage?: string;
  title?: string;
  text?: string;
  currentSections?: PageHeaderButton[];
  otherSections?: PageHeaderButton[];
  canEdit?: boolean;
};

function SectionButtons({ title, buttons }: { title: string; buttons?: PageHeaderButton[] }) {
  if (!buttons?.length) return undefined;
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-center text-2xl font-semibold text-white">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {buttons.map((button) => (
          <a key={`${button.url}-${button.text}`} href={button.url} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-white hover:bg-slate-800">
            {button.icon ? <span className="h-10 w-10 rounded bg-cover bg-center" style={{ backgroundImage: `url(${button.icon})` }} /> : undefined}
            <span>{button.text}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function PageHeader({ coverImage, title, text, currentSections, otherSections, canEdit = false }: PageHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white">
      {coverImage ? <img src={coverImage} alt="Cover" className="h-64 w-full object-cover" /> : undefined}
      <div className="p-6 sm:p-8">
        {title ? <h1 className="text-3xl font-bold sm:text-5xl">{title}</h1> : undefined}
        {text ? <p className="mt-4 max-w-4xl text-slate-300">{text}</p> : undefined}
        <SectionButtons title="Current Sections" buttons={currentSections} />
        <SectionButtons title="Other Sections" buttons={otherSections} />
      </div>
      {canEdit ? (
        <>
          <button type="button" onClick={() => setEditOpen(true)} className="fixed bottom-20 left-20 z-40 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950">Edit Page</button>
          {editOpen ? (
            <button type="button" onClick={() => setEditOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-8" aria-label="Close edit preview">
              <img src="/images/WorkInProgress.jpg" alt="Work in progress" className="max-h-[80vh] max-w-[80vw] rounded-lg" />
            </button>
          ) : undefined}
        </>
      ) : undefined}
    </header>
  );
}
