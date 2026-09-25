"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import styles from "./authFields.module.css";

export default function PasswordField({ id, value, onChange, autoComplete, required = false }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.passwordField}>
      <input id={id} type={visible ? "text" : "password"} className="form-control"
        autoComplete={autoComplete} value={value} required={required}
        onChange={(event) => onChange(event.target.value)} />
      <button type="button" className={styles.togglePassword} onClick={() => setVisible(!visible)}
        aria-label={visible ? `Hide ${id === "ConfirmPassword" ? "confirm password" : "password"}` :
          `Show ${id === "ConfirmPassword" ? "confirm password" : "password"}`}
        aria-pressed={visible} aria-controls={id}>
        {visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
      </button>
    </div>
  );
}
