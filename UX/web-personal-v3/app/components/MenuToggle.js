"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./SiteShell.module.css";

// Botón «Menú» de móvil. Abre y cierra el panel con el buscador y los
// enlaces (data-open en el panel; el CSS hace el resto). Se cierra solo al
// cambiar de página y con Escape. En escritorio el botón no se muestra y el
// panel siempre está visible.
export default function MenuToggle({ panelId, labels }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const pathname = usePathname();

  // Si React quitó la clase "js" de <html> al hidratar, la vuelvo a poner.
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  useEffect(() => {
    document.getElementById(panelId)?.toggleAttribute("data-open", open);
  }, [open, panelId]);

  // Al navegar a otra página el menú se cierra (se ajusta durante el render,
  // como recomienda React, en vez de en un efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.menuButton}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => setOpen((value) => !value)}
    >
      <span aria-hidden="true">{open ? "✕" : "☰"}</span> {labels.button}
    </button>
  );
}
