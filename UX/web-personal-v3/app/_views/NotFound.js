import Link from "next/link";
import { dictionaries } from "../i18n/dictionaries";
import { href } from "../i18n/config";
import styles from "./pages.module.css";

// Página de error 404 (la URL no existe). La usan global-not-found.js, para
// las direcciones que no coinciden con ninguna ruta, y los not-found.js de
// cada idioma, para cuando una página llama a notFound().
const text = {
  es: {
    title: "Página no encontrada",
    code: "Error 404",
    heading: "No encuentro esta página",
    lead: "Puede que la dirección esté mal escrita o que la página se haya movido. Desde aquí puedes seguir por otro camino.",
    searchHeading: "Buscar en el sitio",
    searchLabel: "Qué estás buscando",
    linksHeading: "O ir directamente a",
    home: "Página de inicio",
    sitemap: "Mapa del sitio, con todas las páginas",
    help: "Ayuda para moverte por el sitio",
    otherLang: "en",
    otherLabel: "This page in English",
  },
  en: {
    title: "Page not found",
    code: "Error 404",
    heading: "I can't find this page",
    lead: "The address may be misspelled or the page may have moved. You can carry on from here.",
    searchHeading: "Search the site",
    searchLabel: "What are you looking for",
    linksHeading: "Or go straight to",
    home: "Home page",
    sitemap: "Site map, with every page",
    help: "Help getting around the site",
    otherLang: "es",
    otherLabel: "Esta página en español",
  },
};

export function notFoundMetadata(lang) {
  return { title: text[lang].title };
}

export default function NotFound({ lang }) {
  const t = text[lang];
  const nav = dictionaries[lang].nav;
  const search = dictionaries[lang].search;

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <p className={styles.dates}>{t.code}</p>
        <h1>{t.heading}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <section aria-labelledby="buscar-404-titulo">
        <h2 id="buscar-404-titulo">{t.searchHeading}</h2>
        <form className={styles.searchForm} role="search" action={href("search", lang)} method="get">
          <label htmlFor="buscar-404">{t.searchLabel}</label>
          <div className={styles.searchRow}>
            <input id="buscar-404" type="search" name="q" autoComplete="off" />
            <button type="submit">{search.button}</button>
          </div>
        </form>
      </section>

      <section aria-labelledby="enlaces-404-titulo">
        <h2 id="enlaces-404-titulo">{t.linksHeading}</h2>
        <ul className={styles.notFoundLinks}>
          <li>
            <Link href={href("home", lang)}>{t.home}</Link>
          </li>
          <li>
            <Link href={href("music", lang)}>{nav.music}</Link>
          </li>
          <li>
            <Link href={href("videogames", lang)}>{nav.videogames}</Link>
          </li>
          <li>
            <Link href={href("series", lang)}>{nav.series}</Link>
          </li>
          <li>
            <Link href={href("sitemap", lang)}>{t.sitemap}</Link>
          </li>
          <li>
            <Link href={href("help", lang)}>{t.help}</Link>
          </li>
        </ul>
        <p>
          <a className="tap-target" href={href("home", t.otherLang)} hrefLang={t.otherLang} lang={t.otherLang}>
            {t.otherLabel}
          </a>
        </p>
      </section>
    </main>
  );
}
