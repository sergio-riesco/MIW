// Script en línea que se ejecuta mientras se lee el HTML, antes de pintar.
// En el cliente se marca como text/plain para que React no lo ejecute otra
// vez (y no se queje), y suppressHydrationWarning evita el aviso por la
// diferencia de atributos entre servidor y cliente.
export default function InlineScript({ html }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
