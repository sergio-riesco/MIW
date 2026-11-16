"use client";

import { useEffect, useState } from "react";
import Clarity from "@microsoft/clarity";
import styles from "./Clarity.module.css";

// Microsoft Clarity (mapas de calor y grabaciones de sesión) para las
// pruebas de usabilidad de UX, con el paquete oficial @microsoft/clarity,
// y aviso de cookies. Sin aceptar, Clarity mide sin cookies (cada página
// cuenta como una visita suelta); al aceptar, guarda sus cookies y une las
// páginas de la misma persona en una sola sesión.
const CLARITY_ID = "zemzo0thmt";
const STORAGE_KEY = "cookies-clarity";

const text = {
  es: {
    label: "Aviso de cookies",
    message:
      "Este sitio usa Microsoft Clarity para ver de forma anónima cómo se usa la web (clics, desplazamiento y mapas de calor) y así mejorarla. ¿Aceptas sus cookies de análisis?",
    accept: "Aceptar",
    reject: "Rechazar",
  },
  en: {
    label: "Cookie notice",
    message:
      "This site uses Microsoft Clarity to see anonymously how the site is used (clicks, scrolling and heatmaps) in order to improve it. Do you accept its analytics cookies?",
    accept: "Accept",
    reject: "Reject",
  },
};

function readChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveChoice(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Sin almacenamiento el aviso volverá a salir; no pasa nada.
  }
}

function applyChoice(value) {
  const state = value === "granted" ? "granted" : "denied";
  Clarity.consentV2({ ad_Storage: state, analytics_Storage: state });
}

export default function ClarityAnalytics({ lang = "es" }) {
  // null mientras no se sabe (evita diferencias entre servidor y cliente).
  const [choice, setChoice] = useState(null);
  const t = text[lang] ?? text.es;

  useEffect(() => {
    Clarity.init(CLARITY_ID);
    const saved = readChoice();

    if (saved) {
      applyChoice(saved);
    }

    setChoice(saved ?? "pending");
  }, []);

  function decide(value) {
    saveChoice(value);
    applyChoice(value);
    setChoice(value);
  }

  if (choice !== "pending") {
    return null;
  }

  return (
    <section className={styles.banner} aria-label={t.label}>
      <p className={styles.message}>{t.message}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => decide("denied")}>
          {t.reject}
        </button>
        <button type="button" className={styles.button} onClick={() => decide("granted")}>
          {t.accept}
        </button>
      </div>
    </section>
  );
}
