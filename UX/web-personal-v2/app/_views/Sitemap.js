import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { categories } from "../data/music";
import { dictionaries } from "../i18n/dictionaries";
import { alternatePath, href, musicCategoryHref, pageMetadata, pick } from "../i18n/config";
import styles from "./pages.module.css";

const text = {
  es: {
    title: "Mapa del sitio",
    description: "Todas las páginas del sitio personal de Sergio Riesco Collar.",
    home: "Sobre mí",
    lead: "Todas las páginas del sitio, ordenadas como en el menú.",
    other: "Versión en inglés",
    otherLang: "en",
    otherLabel: "Site map in English",
  },
  en: {
    title: "Site map",
    description: "Every page of Sergio Riesco Collar's personal website.",
    home: "About me",
    lead: "Every page on the site, in the same order as the menu.",
    other: "Spanish version",
    otherLang: "es",
    otherLabel: "Mapa del sitio en español",
  },
};

export function metadata(lang) {
  const t = text[lang];
  return pageMetadata({ key: "sitemap", lang, title: t.title, description: t.description });
}

export default function Sitemap({ lang }) {
  const t = text[lang];
  const nav = dictionaries[lang].nav;
  const footer = dictionaries[lang].footer;

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

      <ul className={styles.tree}>
        <li>
          <Link href={href("home", lang)}>{nav.home}</Link>
          <ul>
            <li>
              <Link href={href("education", lang)}>{nav.education}</Link>
            </li>
            <li>
              <Link href={href("music", lang)}>{nav.music}</Link>
              <ul>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={musicCategoryHref(category.id, lang)}>
                      {pick(category.name, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <Link href={href("videogames", lang)}>{nav.videogames}</Link>
            </li>
            <li>
              <Link href={href("series", lang)}>{nav.series}</Link>
            </li>
            <li>
              <Link href={href("hobbies", lang)}>{nav.hobbies}</Link>
            </li>
            <li>
              <Link href={href("contact", lang)}>{nav.contact}</Link>
            </li>
            <li>
              <Link href={href("search", lang)}>{dictionaries[lang].search.button}</Link>
            </li>
            <li>
              <Link href={href("help", lang)}>{footer.help}</Link>
            </li>
            <li>
              <span aria-current="page">{footer.sitemap}</span>
            </li>
          </ul>
        </li>
      </ul>

      <h2>{t.other}</h2>
      <p>
        <a href={alternatePath(href("sitemap", lang), t.otherLang)} hrefLang={t.otherLang} lang={t.otherLang}>
          {t.otherLabel}
        </a>
      </p>
    </main>
  );
}
