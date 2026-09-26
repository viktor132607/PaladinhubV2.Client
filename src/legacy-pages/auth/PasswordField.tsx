"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function PasswordField({ id, value, onChange, autoComplete, required = false }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={visible ? "text" : "password"} className="form-control !pr-12"
        autoComplete={autoComplete} value={value} required={required}
        onChange={(event) => onChange(event.target.value)} />
      <button type="button" className="absolute right-[.35rem] top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-[.35rem] border-0 bg-transparent p-[.55rem] text-[#545e70] hover:bg-[#e8edf3] hover:text-[#1a2839] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#236bb6] [&_svg]:h-[1.2rem] [&_svg]:w-[1.2rem]" onClick={() => setVisible(!visible)}
        aria-label={visible ? `Hide ${id === "ConfirmPassword" ? "confirm password" : "password"}` :
          `Show ${id === "ConfirmPassword" ? "confirm password" : "password"}`}
        aria-pressed={visible} aria-controls={id}>
        {visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
      </button>
    </div>
  );
}
