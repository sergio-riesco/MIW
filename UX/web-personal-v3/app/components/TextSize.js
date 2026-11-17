"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import styles from "./TextSize.module.css";

// v3: control de tamaño de letra (A− / A / A+). Pedido en la tanda 2 de
// pruebas de usabilidad por dos usuarias con presbicia. El tamaño se guarda
// en localStorage y el script de SiteShell.js lo aplica antes de pintar, así
// se recuerda entre páginas y visitas sin parpadeo.

const STORAGE_KEY = "textSize";
// s = 16 px, m = 18 px (por defecto), l = 20 px, xl = 22 px
export const TEXT_SIZES = ["s", "m", "l", "xl"];
const DEFAULT_SIZE = "m";

const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  const size = document.documentElement.dataset.textSize;
  return TEXT_SIZES.includes(size) ? size : DEFAULT_SIZE;
}

function getServerSnapshot() {
  return DEFAULT_SIZE;
}

function readPreference() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return TEXT_SIZES.includes(saved) ? saved : DEFAULT_SIZE;
  } catch {
    return DEFAULT_SIZE;
  }
}

function applySize(size) {
  if (size === DEFAULT_SIZE) {
    document.documentElement.removeAttribute("data-text-size");
  } else {
    document.documentElement.setAttribute("data-text-size", size);
  }
  listeners.forEach((listener) => listener());
}

function saveSize(size) {
  try {
    if (size === DEFAULT_SIZE) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, size);
    }
  } catch {
    // si no se puede guardar, el cambio vale solo para esta página
  }
}

export default function TextSize({ id, labels, className = "", showLabel = false }) {
  const size = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const index = TEXT_SIZES.indexOf(size);

  // React puede quitar el atributo de <html> al hidratar: se vuelve a poner.
  // También se sigue el cambio hecho en otra pestaña.
  useEffect(() => {
    applySize(readPreference());

    function onStorage(event) {
      if (event.key === STORAGE_KEY) {
        applySize(readPreference());
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const change = useCallback((next) => {
    saveSize(next);
    applySize(next);
  }, []);

  const groupId = `${id}-etiqueta`;

  return (
    <div
      className={`${styles.textSize} ${className}`}
      role="group"
      aria-labelledby={showLabel ? groupId : undefined}
      aria-label={showLabel ? undefined : labels.group}
    >
      {showLabel && (
        <span className={styles.label} id={groupId}>
          {labels.group}
        </span>
      )}
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          onClick={() => change(TEXT_SIZES[index - 1])}
          disabled={index <= 0}
          aria-label={labels.smaller}
          title={labels.smaller}
        >
          <span aria-hidden="true" className={styles.small}>A−</span>
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => change(DEFAULT_SIZE)}
          aria-pressed={size === DEFAULT_SIZE}
          aria-label={labels.reset}
          title={labels.reset}
        >
          <span aria-hidden="true">A</span>
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => change(TEXT_SIZES[index + 1])}
          disabled={index >= TEXT_SIZES.length - 1}
          aria-label={labels.bigger}
          title={labels.bigger}
        >
          <span aria-hidden="true" className={styles.big}>A+</span>
        </button>
      </div>
    </div>
  );
}
