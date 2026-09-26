"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./FloatingNotice.module.css";

type Props = {
  tone?: "success" | "error";
  title: string;
  message: string;
  action?: ReactNode;
  onDismiss?: () => void;
  onRetry?: () => void;
  onPauseChange?: (paused: boolean) => void;
};

export default function FloatingNotice({ tone = "success", title, message, action, onDismiss, onRetry, onPauseChange }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className={`${styles.notice} ${tone === "error" ? styles.error : ""}`}
      role={tone === "error" ? "alert" : "status"}
      onMouseEnter={() => onPauseChange?.(true)}
      onMouseLeave={() => onPauseChange?.(false)}
      onFocusCapture={() => onPauseChange?.(true)}
      onBlurCapture={() => onPauseChange?.(false)}
    >
      <span className={styles.icon} aria-hidden="true">{tone === "error" ? "!" : "✓"}</span>
      <div className={styles.content}>
        <strong>{title}</strong>{" "}<span className={styles.detail}>{message}</span>
        {action}
        {onRetry && <button type="button" className={styles.action} onClick={onRetry}>Try again</button>}
      </div>
      {onDismiss && <button type="button" className={styles.dismiss} aria-label="Dismiss notification" onClick={onDismiss}>×</button>}
    </div>,
    document.body,
  );
}
