"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./TrailerDialog.module.css";

// Botón invisible encima de la portada que abre el tráiler en un <dialog>.
// Con showModal() el navegador ya se encarga del foco y de cerrar con Escape.
// El <video> solo existe con la ventana abierta: no descarga nada antes y
// deja de sonar al cerrar.
export default function TrailerDialog({ title, src }) {
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

  function abrir() {
    setError(false);
    setOpen(true);
    dialogRef.current.showModal();
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
      <button
        type="button"
        className={styles.trigger}
        onClick={abrir}
        aria-haspopup="dialog"
        aria-label={`Ver el tráiler de ${title}`}
      />

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
            aria-label="Cerrar el tráiler"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {open && !error && (
          <video
            className={styles.video}
            src={src}
            controls
            autoPlay
            playsInline
            onError={() => setError(true)}
          >
            <a href={src}>Descargar el tráiler de {title}</a>
          </video>
        )}

        {error && (
          <p className={styles.error} role="alert">
            No se ha podido cargar el tráiler.
          </p>
        )}
      </dialog>
    </>
  );
}
