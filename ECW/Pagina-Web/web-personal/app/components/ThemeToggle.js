"use client";

import { useCallback, useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.css";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * `useLayoutEffect` avisa de que no hace nada en el servidor. En el cliente
 * corre antes de pintar, que es justo lo que necesitamos para reaplicar el
 * tema si React lo ha borrado.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}

/**
 * El atributo del DOM es la única fuente de verdad, y lo fija el script en
 * línea de app/layout.js antes de pintar. Así el botón nunca discrepa de lo
 * que se ve en pantalla ni provoca errores de hidratación.
 */
function getSnapshot() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot() {
  return "light";
}

function getSystemTheme() {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function readPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Si el almacenamiento no está disponible, se sigue la preferencia del sistema.
    return null;
  }
}

/** Sin preferencia guardada se sigue al sistema; si la hay, manda la elegida. */
function resolveTheme() {
  const saved = readPreference();
  return saved === "light" || saved === "dark" ? saved : getSystemTheme();
}

function applyTheme(theme) {
  if (document.documentElement.dataset.theme !== theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  emit();
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  // En desarrollo, el montaje doble de Strict Mode reinicia <html> y borra el
  // atributo que puso el script en línea. Esto lo repone antes de pintar.
  useIsomorphicLayoutEffect(() => {
    applyTheme(resolveTheme());
  }, []);

  // Sigue los cambios del sistema, pero solo mientras no haya elección propia.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);

    function onSystemThemeChange() {
      if (!readPreference()) {
        applyTheme(getSystemTheme());
      }
    }

    media.addEventListener("change", onSystemThemeChange);
    return () => media.removeEventListener("change", onSystemThemeChange);
  }, []);

  // Mantiene las pestañas abiertas en el mismo tema.
  useEffect(() => {
    function onStorage(event) {
      if (event.key === STORAGE_KEY) {
        applyTheme(resolveTheme());
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const changeTheme = useCallback(() => {
    const nextTheme = getSnapshot() === "dark" ? "light" : "dark";

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // El cambio de tema sigue funcionando aunque no se pueda guardar.
    }

    applyTheme(nextTheme);
  }, []);

  return (
    <button
      className={styles.themeToggle}
      type="button"
      onClick={changeTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
    </button>
  );
}
