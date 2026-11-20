import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { search } from "../data/searchIndex";
import { dictionaries } from "../i18n/dictionaries";
import { href, pageMetadata } from "../i18n/config";
import styles from "./pages.module.css";

// Página de búsqueda (/buscar y /en/search). Se genera en el servidor en cada
// petición: el formulario envía la búsqueda por GET en el parámetro "q" y la
// página llega con los resultados ya pintados, así funciona sin JavaScript.
// La búsqueda en sí está en app/data/searchIndex.js.

// Textos de la página en los dos idiomas. results y none son funciones porque
// llevan dentro el número de resultados y lo que se ha buscado.
const text = {
  es: {
    title: "Buscar",
    description: "Buscador del sitio personal de Sergio Riesco Collar.",
    home: "Sobre mí",
    lead: "Busca grupos, juegos, series, aficiones o cualquier dato de mi formación. No importan las mayúsculas ni las tildes.",
    label: "¿Qué quieres buscar?",
    button: "Buscar",
    examples: "Por ejemplo:",
    sample: ["rock", "Zelda", "superhéroes", "ROS2", "pizza"],
    results: (n, q) =>
      n === 1 ? `1 resultado para «${q}»` : `${n} resultados para «${q}»`,
    none: (q) => `No he encontrado nada para «${q}».`,
    tips: "Prueba con otra palabra, revisa cómo está escrita o consulta el",
    sitemap: "mapa del sitio",
  },
  en: {
    title: "Search",
    description: "Search the personal website of Sergio Riesco Collar.",
    home: "About me",
    lead: "Search for bands, games, TV series, hobbies or anything about my education. Capital letters and accents don't matter.",
    label: "What are you looking for?",
    button: "Search",
    examples: "For example:",
    sample: ["rock", "Zelda", "superheroes", "ROS2", "pizza"],
    results: (n, q) => (n === 1 ? `1 result for “${q}”` : `${n} results for “${q}”`),
    none: (q) => `I couldn't find anything for “${q}”.`,
    tips: "Try another word, check the spelling or have a look at the",
    sitemap: "site map",
  },
};

// Título, descripción y URLs de la página para cada idioma.
export function metadata(lang) {
  const t = text[lang];
  return {
    ...pageMetadata({ key: "search", lang, title: t.title, description: t.description }),
    // los resultados no hace falta que salgan en los buscadores
    robots: { index: false, follow: true },
  };
}

// lang: "es" o "en". searchParams: parámetros de la URL (en Next.js 16 es una
// promesa, por eso el await).
export default async function Search({ lang, searchParams }) {
  const t = text[lang];
  const params = await searchParams;
  // Si la URL trae ?q= repetido, Next.js da un array; se usa el primero.
  const raw = Array.isArray(params?.q) ? params.q[0] : params?.q;
  // Sin espacios alrededor y como mucho 100 caracteres (igual que el maxLength
  // del campo), por si alguien escribe la URL a mano.
  const query = (raw ?? "").trim().slice(0, 100);
  // Solo se busca si hay algo escrito; si no, se muestran los ejemplos.
  const results = query ? search(query, lang) : [];
  const searchHref = href("search", lang);

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

      {/* Formulario GET normal: el navegador va a searchHref?q=... sin
          necesitar JavaScript. defaultValue deja escrita la última búsqueda
          para poder corregirla. */}
      <form className={styles.searchForm} role="search" action={searchHref} method="get">
        <label htmlFor="buscar-pagina">{t.label}</label>
        <div className={styles.searchRow}>
          <input
            id="buscar-pagina"
            type="search"
            name="q"
            defaultValue={query}
            autoComplete="off"
            maxLength={100}
          />
          <button type="submit">{t.button}</button>
        </div>
      </form>

      {/* Sin búsqueda: enlaces de ejemplo que ya llevan la búsqueda hecha */}
      {!query && (
        <p>
          {t.examples}{" "}
          {t.sample.map((word, index) => (
            <span key={word}>
              {index > 0 && ", "}
              <Link href={`${searchHref}?q=${encodeURIComponent(word)}`}>{word}</Link>
            </span>
          ))}
          .
        </p>
      )}

      {/* Con búsqueda: encabezado con el número de resultados y la lista, o
          el mensaje de que no hay nada con un enlace al mapa del sitio.
          React escapa el texto de la búsqueda, así que si se busca código
          HTML se muestra como texto y no se ejecuta. */}
      {query && (
        <section aria-labelledby="resultados">
          <h2 id="resultados">
            {results.length > 0 ? t.results(results.length, query) : t.none(query)}
          </h2>

          {results.length === 0 ? (
            <p>
              {t.tips} <Link href={href("sitemap", lang)}>{t.sitemap}</Link>.
            </p>
          ) : (
            <ol className={styles.results}>
              {/* Cada resultado: sección, título con enlace y descripción.
                  La key lleva el índice porque varios resultados pueden
                  compartir href (todos los juegos van a /videojuegos). */}
              {results.map((result, index) => (
                <li key={`${result.href}-${result.title}-${index}`}>
                  <p className={styles.meta}>{result.section}</p>
                  <h3>
                    <Link href={result.href}>{result.title}</Link>
                  </h3>
                  {result.text && <p>{result.text}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </main>
  );
}
