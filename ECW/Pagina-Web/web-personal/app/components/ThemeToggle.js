"use client";

import { useCallback, useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.css";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// useLayoutEffect da un aviso en el servidor, así que allí uso useEffect.
// En el cliente corre antes de pintar, que es lo que hace falta aquí.
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

// El tema se lee siempre del atributo data-theme de <html>, que pone el
// script de layout.js antes de pintar. Así el botón coincide con lo que se ve.
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
    // sin localStorage, se sigue al sistema
    return null;
  }
}

// Preferencia guardada o, si no hay, la del sistema.
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

  // En desarrollo, Strict Mode monta dos veces y React borra data-theme de
  // <html>. Esto lo vuelve a poner antes de pintar.
  useIsomorphicLayoutEffect(() => {
    applyTheme(resolveTheme());
  }, []);

  // Si el sistema cambia de tema y no hay nada guardado, se sigue.
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

  // Otras pestañas abiertas cambian también.
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
      // si no se puede guardar, el cambio vale solo para esta visita
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
