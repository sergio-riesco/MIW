import Script from "next/script";

// Microsoft Clarity (mapas de calor y grabaciones de sesión) para las
// pruebas de usabilidad de UX. Pega aquí el identificador del proyecto de
// clarity.microsoft.com (Settings > Setup, es el texto tras "clarity.ms/tag/").
// Si se deja vacío, no se carga nada.
const CLARITY_ID = "zemzo0thmt";

export default function Clarity() {
  if (!CLARITY_ID) {
    return null;
  }

  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
