"use client";

import { useEffect, useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.css";

const STORAGE_KEY = "theme";
const themeListeners = new Set();
let currentTheme = "light";

function subscribe(listener) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function getTheme() {
  return currentTheme;
}

function getServerTheme() {
  return "light";
}

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Si el almacenamiento no está disponible, usamos la preferencia del sistema.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(nextTheme) {
  currentTheme = nextTheme;
  document.documentElement.dataset.theme = nextTheme;

  try {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  } catch {
    // El cambio de tema sigue funcionando aunque no se pueda guardar.
  }

  themeListeners.forEach((listener) => listener());
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    const initialTheme = getInitialTheme();

    if (initialTheme !== currentTheme) {
      applyTheme(initialTheme);
    }
  }, []);

  function changeTheme() {
    applyTheme(isDark ? "light" : "dark");
  }

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
