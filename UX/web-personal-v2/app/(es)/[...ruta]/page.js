import { notFound } from "next/navigation";

// Cualquier dirección en español que no exista acaba aquí y muestra el 404
// de (es)/not-found.js con la plantilla del sitio. Así no hace falta
// global-not-found.js (el sitio tiene dos plantillas raíz, una por idioma).
export default function Page() {
  notFound();
}
