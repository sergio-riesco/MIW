import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { categories } from "../data/music";
import { dictionaries } from "../i18n/dictionaries";
import { href, musicCategoryHref, pageMetadata, pick } from "../i18n/config";
import styles from "./music.module.css";

const text = {
  es: {
    title: "Música",
    description: "Mis grupos y artistas favoritos, organizados por género musical.",
    lead: "Escucho todo tipo de música pero en especial me gusta el rock. Aquí están mis grupos y artistas, agrupados por género junto a sus álbumes más famosos. Pulsa un género para escuchar un fragmento de cada álbum.",
    home: "Sobre mí",
    band: "grupo",
    bands: "grupos",
  },
  en: {
    title: "Music",
    description: "My favourite bands and artists, grouped by music genre.",
    lead: "I listen to all kinds of music, but I especially like rock. Here are my bands and artists, grouped by genre along with their best-known albums. Choose a genre to listen to a clip from each album.",
    home: "About me",
    band: "band",
    bands: "bands",
  },
};

export function metadata(lang) {
  const t = text[lang];
  return pageMetadata({ key: "music", lang, title: t.title, description: t.description });
}

export default function Music({ lang }) {
  const t = text[lang];

  return (
    <main className="container page" id="contenido" data-section="music">
      <header className="page-header">
        <Breadcrumb
          label={dictionaries[lang].breadcrumb}
          items={[{ label: t.home, href: href("home", lang) }, { label: t.title }]}
        />
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <ul className={styles.grid}>
        {categories.map((category, categoryIndex) => (
          <li key={category.id}>
            {/* Toda la tarjeta es clicable gracias al ::after del enlace */}
            <article className={styles.card}>
              <div className={styles.covers} aria-hidden="true">
                {category.bands.slice(0, 4).map((band, index) => (
                  <Image
                    key={band.id}
                    src={band.cover || "/covers/placeholder.svg"}
                    alt=""
                    width={40}
                    height={40}
                    sizes="40px"
                    // La primera tarjeta es la que se ve sin hacer scroll.
                    priority={categoryIndex === 0 && index === 0}
                    unoptimized={band.cover?.endsWith(".svg")}
                  />
                ))}
              </div>

              <h2 className={styles.name}>
                <Link className={styles.link} href={musicCategoryHref(category.id, lang)}>
                  {pick(category.name, lang)}
                </Link>
              </h2>
              <p className={styles.bands}>
                {category.bands.map((band) => band.name).join(", ")}
              </p>
              <p className={styles.count}>
                {category.bands.length}{" "}
                {category.bands.length === 1 ? t.band : t.bands}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
