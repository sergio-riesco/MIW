import NotFound, { notFoundMetadata } from "../_views/NotFound";

// Cuando una página en español llama a notFound() (p. ej. un género que no existe).
export const metadata = notFoundMetadata("es");

export default function Page() {
  return <NotFound lang="es" />;
}
