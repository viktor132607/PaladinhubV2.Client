
"use client";

import type { FormEvent, HTMLAttributes } from "react";
import styles from "./MigratedView.module.css";

type HtmlViewProps = {
  html: string;
  className?: string;
};

type PageViewProps = HtmlViewProps & {
  title?: string;
};

const stopLegacyFormSubmission = (event: FormEvent<HTMLDivElement>) => {
  event.preventDefault();
};

export function HtmlContent({ html, className }: HtmlViewProps) {
  const classes = [styles.fragment, className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      onSubmit={stopLegacyFormSubmission}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MigratedPageView({ title, html, className }: PageViewProps) {
  const classes = [styles.content, className].filter(Boolean).join(" ");

  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        {title ? <h1 className={styles.pageTitle}>{title}</h1> : undefined}
        <div
          className={classes}
          onSubmit={stopLegacyFormSubmission}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}

export type NativeDivProps = HTMLAttributes<HTMLDivElement>;
