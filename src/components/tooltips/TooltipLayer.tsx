"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ItemTooltip from "./ItemTooltip";
import SpellTooltip from "./SpellTooltip";
import TalentTooltip from "./TalentTooltip";
import styles from "./tooltips.module.css";

type TooltipData = {
  kind: "item" | "spell" | "talent";
  name: string;
  description?: string;
  icon?: string;
  quality?: string;
  level?: string;
  detail?: string;
  requirement?: string;
  choices?: { name: string; icon?: string; description?: string }[];
  selectedChoice?: number;
};

function readChoices(value?: string): TooltipData["choices"] {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length === 2 && parsed.every((choice) =>
      choice && typeof choice.name === "string" &&
      (choice.icon === undefined || typeof choice.icon === "string") &&
      (choice.description === undefined || typeof choice.description === "string"))
      ? parsed as TooltipData["choices"] : undefined;
  } catch { return undefined; }
}

const triggerFor = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLElement>("[data-tooltip-kind]") : null;

export default function TooltipLayer() {
  const [active, setActive] = useState<TooltipData | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 350, height: 180 });
  const popup = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const hide = () => { trigger.current = null; setActive(null); };
    const show = (element: HTMLElement, x: number, y: number) => {
      if (trigger.current !== element) {
        const kind = element.dataset.tooltipKind;
        if (kind !== "item" && kind !== "spell" && kind !== "talent") return;
        trigger.current = element;
        setActive({
          kind, name: element.dataset.tooltipName || element.textContent?.trim() || "",
          description: element.dataset.tooltipDescription,
          icon: element.dataset.tooltipIcon,
          quality: element.dataset.tooltipQuality,
          level: element.dataset.tooltipLevel,
          detail: element.dataset.tooltipDetail,
          requirement: element.dataset.tooltipRequirement,
          choices: readChoices(element.dataset.tooltipChoices),
          selectedChoice: Number(element.dataset.tooltipSelectedChoice ?? -1),
        });
      }
      setPosition({ x, y });
    };
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const element = triggerFor(event.target);
      if (element) show(element, event.clientX, event.clientY);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (trigger.current && trigger.current.contains(event.target as Node))
        setPosition({ x: event.clientX, y: event.clientY });
    };
    const onPointerOut = (event: PointerEvent) => {
      if (trigger.current && trigger.current.contains(event.target as Node) &&
          !trigger.current.contains(event.relatedTarget as Node | null)) hide();
    };
    const onFocusIn = (event: FocusEvent) => {
      const element = triggerFor(event.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        show(element, rect.right, rect.top);
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      if (trigger.current && !trigger.current.contains(event.relatedTarget as Node | null)) hide();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        const element = triggerFor(event.target);
        if (element && element.tagName !== "A" && element.tagName !== "BUTTON") {
          const rect = element.getBoundingClientRect();
          show(element, rect.left, rect.bottom);
          return;
        }
      }
      if (!trigger.current?.contains(event.target as Node)) hide();
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", hide, true);
    };
  }, []);

  useEffect(() => {
    if (!active || !popup.current) return;
    const element = popup.current;
    const observer = new ResizeObserver(() => {
      setSize({ width: element.offsetWidth, height: element.offsetHeight });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);

  if (!active) return null;
  const left = Math.max(10, Math.min(position.x + 14, window.innerWidth - size.width - 10));
  const top = position.y + size.height + 18 > window.innerHeight
    ? Math.max(10, position.y - size.height - 12) : position.y + 14;
  const props = { name: active.name, description: active.description, icon: active.icon,
    quality: active.quality, level: active.level, detail: active.detail, requirement: active.requirement,
    choices: active.choices, selectedChoice: active.selectedChoice };
  return createPortal(
    <div ref={popup} className={styles.popup} role="tooltip" style={{ left, top }}>
      {active.kind === "item" ? <ItemTooltip {...props} /> :
        active.kind === "spell" ? <SpellTooltip {...props} /> : <TalentTooltip {...props} />}
    </div>, document.body,
  );
}
