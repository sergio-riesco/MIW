import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { dictionaries, EMAIL } from "../i18n/dictionaries";
import { href, pageMetadata } from "../i18n/config";
import styles from "./pages.module.css";

const text = {
  es: {
    title: "Ayuda",
    description: "Cómo moverse por el sitio personal de Sergio Riesco Collar.",
    home: "Sobre mí",
    lead: "Respuestas rápidas sobre cómo moverte por este sitio.",
    subject: "Sugerencia sobre la web personal",
    faq: [
      {
        q: "¿Cómo sé en qué página estoy?",
        a: () =>
          "La sección actual aparece en negrita y subrayada en el menú principal, y las migas de pan de encima del título indican el camino desde la página de inicio. Pulsa cualquier miga para volver atrás.",
      },
      {
        q: "¿Cómo encuentro algo concreto?",
        a: (lang) => (
          <>
            Escribe en el buscador de la cabecera o entra en la{" "}
            <Link href={href("search", lang)}>página de búsqueda</Link>. También
            tienes el <Link href={href("sitemap", lang)}>mapa del sitio</Link> con
            todas las páginas.
          </>
        ),
      },
      {
        q: "¿Cómo veo un tráiler o escucho una canción?",
        a: (lang) => (
          <>
            En <Link href={href("videogames", lang)}>Videojuegos</Link> y{" "}
            <Link href={href("series", lang)}>Series</Link>, pulsa «Ver tráiler» en
            la portada: se abre una ventana con el vídeo que se cierra con Escape,
            con el botón ✕ o pulsando fuera. En{" "}
            <Link href={href("music", lang)}>Música</Link>, entra en un género y
            pulsa el botón de reproducir de cada álbum.
          </>
        ),
      },
      {
        q: "¿Puedo usar el sitio solo con el teclado?",
        a: () =>
          "Sí. Tab y Mayús + Tab recorren los enlaces y botones en orden; el primer Tab muestra un enlace para saltar directamente al contenido. Enter abre enlaces y tráileres, Escape cierra el tráiler, y en la lista de videojuegos puedes usar las flechas izquierda y derecha para desplazarla.",
      },
      {
        q: "¿Cómo cambio el idioma o los colores?",
        a: () =>
          "El botón «English» de la cabecera abre la misma página en inglés. El botón de la luna o el sol cambia entre modo claro y oscuro, y el sitio recuerda tu elección.",
      },
      {
        q: "He encontrado un error o tengo una sugerencia",
        a: (lang, mailto) => (
          <>
            ¡Gracias! <a href={mailto}>Escríbeme un correo</a> contándomelo, o
            mira otras formas de <Link href={href("contact", lang)}>contacto</Link>.
          </>
        ),
      },
    ],
  },
  en: {
    title: "Help",
    description: "How to find your way around Sergio Riesco Collar's personal website.",
    home: "About me",
    lead: "Quick answers about how to get around this site.",
    subject: "Suggestion about the personal website",
    faq: [
      {
        q: "How do I know which page I'm on?",
        a: () =>
          "The current section is shown in bold and underlined in the main menu, and the breadcrumb above the title shows the path from the home page. Select any breadcrumb to go back.",
      },
      {
        q: "How do I find something specific?",
        a: (lang) => (
          <>
            Type in the search box in the header or open the{" "}
            <Link href={href("search", lang)}>search page</Link>. There is also a{" "}
            <Link href={href("sitemap", lang)}>site map</Link> listing every page.
          </>
        ),
      },
      {
        q: "How do I watch a trailer or listen to a song?",
        a: (lang) => (
          <>
            On <Link href={href("videogames", lang)}>Video games</Link> and{" "}
            <Link href={href("series", lang)}>TV series</Link>, press “Watch
            trailer” on a cover: a window opens with the video, and you can close
            it with Escape, the ✕ button or by clicking outside. On{" "}
            <Link href={href("music", lang)}>Music</Link>, open a genre and press
            the play button of each album.
          </>
        ),
      },
      {
        q: "Can I use the site with just the keyboard?",
        a: () =>
          "Yes. Tab and Shift + Tab move through links and buttons in order; the first Tab shows a link to skip straight to the content. Enter opens links and trailers, Escape closes the trailer, and on the video games list you can use the left and right arrows to scroll it.",
      },
      {
        q: "How do I change the language or the colours?",
        a: () =>
          "The “Español” button in the header opens the same page in Spanish. The moon or sun button switches between light and dark mode, and the site remembers your choice.",
      },
      {
        q: "I found a mistake or have a suggestion",
        a: (lang, mailto) => (
          <>
            Thank you! <a href={mailto}>Send me an email</a> about it, or see other
            ways to <Link href={href("contact", lang)}>contact me</Link>.
          </>
        ),
      },
    ],
  },
};

export function metadata(lang) {
  const t = text[lang];
  return pageMetadata({ key: "help", lang, title: t.title, description: t.description });
}

export default function Help({ lang }) {
  const t = text[lang];
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(t.subject)}`;

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb
          label={dictionaries[lang].breadcrumb}
          items={[{ label: t.home, href: href("home", lang) }, { label: t.title }]}
        />
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <div className={styles.faq}>
        {t.faq.map((item, index) => (
          <section key={item.q} aria-labelledby={`pregunta-${index}`}>
            <h2 id={`pregunta-${index}`}>{item.q}</h2>
            <p>{item.a(lang, mailto)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
