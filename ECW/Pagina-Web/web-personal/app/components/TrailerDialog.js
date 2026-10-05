"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./TrailerDialog.module.css";

/**
 * Botón transparente que cubre una portada y abre el tráiler en una ventana
 * modal, sin salir de la página. La portada ya reacciona al pasar el ratón,
 * así que no necesita icono.
 *
 * Usa el elemento <dialog> nativo: showModal() bloquea el resto de la página,
 * lleva el foco dentro de la ventana, cierra con Escape y devuelve el foco al
 * botón al cerrarse. El <video> solo se crea mientras la ventana está
 * abierta, así que no se descarga nada hasta que se pulsa.
 */
export default function TrailerDialog({ title, src }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  // El diálogo se puede cerrar con Escape, con el botón o pulsando fuera.
  // En todos los casos el navegador lanza el evento "close", y al recibirlo
  // se quita el <video> para que deje de sonar. Se escucha directamente en
  // el elemento porque React no lo propaga de forma fiable en <dialog>.
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

  // Un clic en el fondo oscuro (fuera del contenido) también cierra.
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
