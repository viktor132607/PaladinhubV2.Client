"use client";

import { useEffect, useState } from "react";
import { useLocalization } from "@/localization/LocalizationContext";
import { fetchBackend, readApiJson } from "@/config/api";
import { Link } from "@/router/nextCompat";
import s from "./Footer.module.css";

type Entry = {
  id: string;
  parentId: string | null;
  kind: string;
  text: string;
  url: string;
  icon: string;
  sortOrder: number;
  openNewTab: boolean;
};

const normalizeUrl = (url: string) => url.toLowerCase().replace(/\/+$/, "");

export default function Footer() {
  const { t } = useLocalization();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let controller: AbortController;
    const load = () => {
      controller?.abort();
      const c = new AbortController();
      controller = c;
      fetchBackend("/api/footer", { signal: c.signal, cache: "no-store" })
        .then(readApiJson<Entry[]>)
        .then((x) => {
          if (!c.signal.aborted && Array.isArray(x)) setEntries(x);
        })
        .catch(() => {
          if (!c.signal.aborted) setEntries(null);
        });
    };

    load();
    window.addEventListener("footer-updated", load);
    return () => {
      controller?.abort();
      window.removeEventListener("footer-updated", load);
    };
  }, []);

  const text = (x: Entry) =>
    t(
      `footer.${x.id}.text`,
      x.text.replace(
        "Made with 💛 for WoW Paladins",
        t("footer.credit", "Made with 💛 for WoW Paladins"),
      ),
    ).replaceAll("{year}", String(new Date().getFullYear()));

  const render = (x: Entry) => {
    const label = (
      <>
        {x.icon && (
          <i
            className={`${x.kind === "social" ? "fa-brands" : "fa-solid"} fa-${x.icon} me-2`}
            aria-hidden="true"
          />
        )}
        {text(x)}
      </>
    );
    if (["link", "social", "email", "phone"].includes(x.kind)) {
      const href =
        x.kind === "email"
          ? `mailto:${x.url}`
          : x.kind === "phone"
            ? `tel:${x.url}`
            : x.url;
      const props = {
        target: x.openNewTab ? "_blank" : undefined,
        rel: x.openNewTab ? "noopener noreferrer" : undefined,
        className: s.link,
        style: { overflowWrap: "anywhere" as const },
      };
      return href.startsWith("/") ? (
        <Link to={href} {...props}>
          {label}
        </Link>
      ) : (
        <a href={href} {...props}>
          {label}
        </a>
      );
    }
    return (
      <p
        className="mb-2"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {label}
      </p>
    );
  };

  const hasFooterUrl = (urls: string[]) =>
    entries?.some((entry) => urls.includes(normalizeUrl(entry.url))) ?? false;

  const hasPrivacy = hasFooterUrl(["/home/privacy", "/privacy"]);
  const hasCookies = hasFooterUrl([
    "/cookies",
    "/home/cookies",
    "/home/privacy#cookies",
    "/privacy#cookies",
  ]);
  const hasCreatorCredit =
    entries?.some(
      (entry) => entry.url === "https://viktor-iliev.site/portfolio/",
    ) ?? false;

  const ordered = [...(entries ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const roots = ordered.filter(
    (x) => !x.parentId || !ordered.some((parent) => parent.id === x.parentId),
  );
  const renderEntry = (
    entry: Entry,
    ancestors: Set<string> = new Set(),
  ): React.ReactNode => {
    if (ancestors.has(entry.id)) return null;
    const next = new Set(ancestors).add(entry.id);
    const children = ordered.filter((x) => x.parentId === entry.id);
    return (
      <div
        key={entry.id}
        className={entry.kind === "section" ? s.group : undefined}
      >
        {entry.kind === "section"
          ? entry.text && <h2>{text(entry)}</h2>
          : render(entry)}
        {children.length > 0 && (
          <ul>
            {children.map((child) => (
              <li key={child.id}>{renderEntry(child, next)}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.columns}>
          <div className={s.brand}>
            <Link to="/" className={s.wordmark}>
              Paladin<span>Hub</span>
            </Link>
            <p>
              {t(
                "footer.description",
                "Guides, builds and a community for World of Warcraft Paladins.",
              )}
            </p>
          </div>
          {roots.length > 0 ? (
            roots.map((entry) => renderEntry(entry))
          ) : (
            <nav className={s.group} aria-label={t("footer.pages", "Pages")}>
              <h2>{t("footer.pages", "Pages")}</h2>
              <ul>
                <li>
                  <Link to="/">{t("nav.home", "Home")}</Link>
                </li>
                <li>
                  <Link to="/Holy/Overview">Holy Paladin</Link>
                </li>
                <li>
                  <Link to="/Protection/Overview">Protection Paladin</Link>
                </li>
                <li>
                  <Link to="/Retribution/Overview">Retribution Paladin</Link>
                </li>
                <li>
                  <Link to="/Discussion/Index">
                    {t("nav.discussion", "Discussion")}
                  </Link>
                </li>
              </ul>
            </nav>
          )}
          {(!hasPrivacy || !hasCookies) && (
            <nav
              className={s.group}
              aria-label={t("footer.information", "Information")}
            >
              <h2>{t("footer.information", "Information")}</h2>
              <ul>
                {!hasPrivacy && (
                  <li>
                    <Link to="/Home/Privacy">
                      {t("nav.privacy", "Privacy")}
                    </Link>
                  </li>
                )}
                {!hasCookies && (
                  <li>
                    <Link to="/Home/Privacy#cookies">
                      {t("footer.cookies", "Cookies")}
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          )}
        </div>
        <div className={s.bottom}>
          <p>© {new Date().getFullYear()} PaladinHub</p>
          {!hasCreatorCredit && (
            <a
              href="https://viktor-iliev.site/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("footer.createdBy", "Created by Viktor Iliev")}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
