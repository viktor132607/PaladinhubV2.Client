
"use client";
import { useState } from "react";
import { HtmlContent } from "@/components/migration/MigratedView";
export type SwitcherOption = { label?: string; html?: string };
export type SwitcherBlockProps = { id?: string; options?: SwitcherOption[] };
export default function SwitcherBlock({ id, options = [] }: SwitcherBlockProps) { const [active, setActive] = useState(0); return <section id={id} className="switcher"><div className="switcher-buttons flex flex-wrap gap-2">{options.map((option, index) => <button key={index} type="button" className={`switch-btn ${active === index ? "active" : ""}`} onClick={() => setActive(index)}>{option.label ?? `Option ${index + 1}`}</button>)}</div><div className="switcher-panes mt-4">{options[active] ? <HtmlContent html={options[active].html ?? ""} className="switch-pane active" /> : <p>No options configured.</p>}</div></section>; }
