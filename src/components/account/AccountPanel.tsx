import type { ReactNode } from "react";
import s from "./account.module.css";
export default function AccountPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`${s.panel} ${className}`}>
      <header className={s.panelHeader}>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action && <div className={s.panelAction}>{action}</div>}
      </header>
      <div className={s.panelBody}>{children}</div>
    </article>
  );
}
