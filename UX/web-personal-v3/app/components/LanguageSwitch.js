"use client";

import { usePathname } from "next/navigation";
import { alternatePath } from "../i18n/config";
import styles from "./SiteShell.module.css";

// Enlace a la misma página en el otro idioma.
export default function LanguageSwitch({ lang, labels, className = "" }) {
  const other = lang === "es" ? "en" : "es";
  const target = alternatePath(usePathname(), other);

  return (
    <a
      className={`${styles.language} ${className}`}
      href={target}
      hrefLang={other}
      lang={other}
      title={labels.label}
    >
      {labels.name}
    </a>
  );
}
