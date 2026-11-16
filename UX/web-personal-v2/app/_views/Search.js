import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { search } from "../data/searchIndex";
import { dictionaries } from "../i18n/dictionaries";
import { href, pageMetadata } from "../i18n/config";
import styles from "./pages.module.css";

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

export function metadata(lang) {
  const t = text[lang];
  return {
    ...pageMetadata({ key: "search", lang, title: t.title, description: t.description }),
    // los resultados no hace falta que salgan en los buscadores
    robots: { index: false, follow: true },
  };
}

export default async function Search({ lang, searchParams }) {
  const t = text[lang];
  const params = await searchParams;
  const raw = Array.isArray(params?.q) ? params.q[0] : params?.q;
  const query = (raw ?? "").trim().slice(0, 100);
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
