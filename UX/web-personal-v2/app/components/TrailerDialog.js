"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./TrailerDialog.module.css";

// Enlace "Ver tráiler" encima de la portada. Es un enlace normal al vídeo,
// así funciona aunque no haya JavaScript ni CSS (o en modo lectura); con
// JavaScript se abre el vídeo en un <dialog> sin salir de la página.
// Con showModal() el navegador ya se encarga del foco y de cerrar con Escape.
// El <video> solo existe con la ventana abierta: no descarga nada antes y
// deja de sonar al cerrar.
// tracks: subtítulos (WebVTT) que existen para este vídeo; el primero es el
// del idioma de la página y sale activado.
export default function TrailerDialog({ title, src, poster, labels, tracks = [] }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  // Al cerrar (Escape, botón o clic fuera) llega "close" y quito el vídeo.
  // Lo escucho a mano porque el onClose de React en <dialog> no siempre llega.
  useEffect(() => {
    const dialog = dialogRef.current;
    const alCerrar = () => setOpen(false);

    dialog.addEventListener("close", alCerrar);
    return () => dialog.removeEventListener("close", alCerrar);
  }, []);

  function abrir(event) {
    const dialog = dialogRef.current;

    // Ctrl/Cmd + clic: dejar que el navegador abra el vídeo en otra pestaña
    if (event.metaKey || event.ctrlKey || event.shiftKey || !dialog?.showModal) {
      return;
    }

    event.preventDefault();
    setError(false);
    setOpen(true);
    dialog.showModal();
  }

  function cerrar() {
    setOpen(false);
    dialogRef.current.close();
  }

  // clic en el fondo oscuro = cerrar
  function alPulsarFondo(event) {
    if (event.target === dialogRef.current) {
      cerrar();
    }
  }

  return (
    <>
      <a className={styles.trigger} href={src} onClick={abrir} aria-haspopup="dialog">
        <span className={styles.chip}>
          <span aria-hidden="true">▶ </span>
          {labels.open}
          <span className="visually-hidden">
            {" "}
            {labels.of} {title}
          </span>
        </span>
      </a>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onClick={alPulsarFondo}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={cerrar}
            aria-label={labels.close}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {open && !error && (
          <video
            className={styles.video}
            src={src}
            poster={poster}
            controls
            autoPlay
            playsInline
            onError={() => setError(true)}
          >
            {tracks.map((track, i) => (
              <track
                key={track.lang}
                kind="subtitles"
                src={track.src}
                srcLang={track.lang}
                label={track.label}
                default={i === 0}
              />
            ))}
            <a href={src}>
              {labels.download} {title}
            </a>
          </video>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {labels.error}
          </p>
        )}
      </dialog>
    </>
  );
}
