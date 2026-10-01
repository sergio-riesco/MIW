/**
 * Envuelve un script en línea para que el navegador lo ejecute de forma
 * síncrona mientras analiza el HTML, antes del primer pintado.
 *
 * React avisa en desarrollo cuando el render produce etiquetas <script>, así
 * que en el cliente la etiqueta se marca como `text/plain` para que no se
 * ejecute dos veces. `suppressHydrationWarning` silencia la diferencia de
 * atributos entre servidor y cliente.
 */
export default function InlineScript({ html }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
