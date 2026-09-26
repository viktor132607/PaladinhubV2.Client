import type { ReactNode } from "react";
import styles from "./AuthShell.module.css";

export { styles as authStyles };

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>{children}</section>
    </main>
  );
}
