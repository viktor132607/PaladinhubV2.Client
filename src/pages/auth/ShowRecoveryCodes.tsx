"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/router/nextCompat";

const storageKey = "paladinhub.recoveryCodes";

function normalizeCodes(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function readCodesFromLocation(): string[] {
  const params = new URLSearchParams(window.location.search);
  const repeated = params.getAll("code");
  const packed = params.get("codes")?.split(/[\n,;]+/) ?? [];

  let stored: string[] = [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem(storageKey) || "[]") as unknown;
    if (Array.isArray(parsed)) stored = parsed.filter((value): value is string => typeof value === "string");
  } catch {
    stored = [];
  }

  return normalizeCodes([...repeated, ...packed, ...stored]);
}

export default function ShowRecoveryCodes() {
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => setCodes(readCodesFromLocation()), []);

  const text = useMemo(() => codes.join("\n"), [codes]);

  const copyAll = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    if (!text) return;
    const url = URL.createObjectURL(new Blob([`${text}\n`], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "paladinhub-recovery-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const finish = () => sessionStorage.removeItem(storageKey);

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-10 text-[#e9ecef]">
      <section className="mx-auto max-w-4xl rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-2xl">
        <h1 className="text-3xl font-semibold">Recovery Codes</h1>
        <div className="mt-5 rounded-lg border border-amber-500/60 bg-amber-950/40 px-4 py-3 text-amber-100">
          Store these codes securely. Each code can be used only once.
        </div>

        {codes.length ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {codes.map((code) => (
                <code key={code} className="rounded-lg border border-[#46515e] bg-[#0f1216] px-4 py-3 text-center text-base font-semibold tracking-wider text-[#f6b21a]">
                  {code}
                </code>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => void copyAll()} className="rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500">
                {copied ? "Copied" : "Copy all"}
              </button>
              <button type="button" onClick={download} className="rounded-md bg-[#3f4650] px-4 py-2.5 font-semibold text-white hover:bg-[#4a525e]">
                Download text file
              </button>
              <Link to="/Account/Security" onClick={finish} className="rounded-md bg-[#f6b21a] px-4 py-2.5 font-semibold text-white hover:bg-[#e0a10f]">
                Done
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-lg border border-[#46515e] bg-[#0f1216] p-5 text-[#b8c0cc]">
            <p>No recovery codes were supplied to this page.</p>
            <p className="mt-2 text-sm">Generate a new set from Security. The generated codes must be passed through the URL or stored in <code>{storageKey}</code> before opening this page.</p>
            <Link to="/Account/Security" className="mt-5 inline-block rounded-md bg-[#f6b21a] px-4 py-2.5 font-semibold text-white hover:bg-[#e0a10f]">Back to Security</Link>
          </div>
        )}
      </section>
    </main>
  );
}
