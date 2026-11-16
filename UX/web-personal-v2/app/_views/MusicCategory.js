import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "../components/Breadcrumb";
import { categories } from "../data/music";
import { dictionaries } from "../i18n/dictionaries";
import { href, musicCategoryHref, pageMetadata, pick } from "../i18n/config";
import styles from "./category.module.css";

const text = {
  es: {
    home: "Sobre mí",
    music: "Música",
    description: (name) => `Mis grupos y artistas de ${name}, con un fragmento de cada álbum.`,
    band: "grupo",
    bands: "grupos",
    backLabel: "Volver a la lista de géneros",
    back: "Volver a todos los géneros",
    snippet: (track) => `Fragmento de «${track}»`,
    download: "Descargar el fragmento de",
    coverOf: "Portada del álbum",
    favorite: "★ Favorito",
  },
  en: {
    home: "About me",
    music: "Music",
    description: (name) => `My ${name} bands and artists, with a clip from each album.`,
    band: "band",
    bands: "bands",
    backLabel: "Back to the list of genres",
    back: "Back to all genres",
    snippet: (track) => `Clip from “${track}”`,
    download: "Download the clip from",
    coverOf: "Album cover of",
    favorite: "★ Favourite",
  },
};

export function staticParams() {
  return categories.map((category) => ({ category: category.id }));
}

export async function metadata(lang, params) {
  const { category: slug } = await params;
  const category = categories.find((item) => item.id === slug);

  if (!category) {
    return {};
  }

  const name = pick(category.name, lang);
  return pageMetadata({
    key: "music",
    lang,
    title: name,
    description: text[lang].description(name),
    path: musicCategoryHref(category.id, lang),
  });
}

export default async function MusicCategory({ lang, params }) {
  const { category: slug } = await params;
  const category = categories.find((item) => item.id === slug);
  const t = text[lang];

  if (!category) {
    notFound();
  }

  const name = pick(category.name, lang);

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb
          label={dictionaries[lang].breadcrumb}
          items={[
            { label: t.home, href: href("home", lang) },
            { label: t.music, href: href("music", lang) },
            { label: name },
          ]}
        />
        <h1>{name}</h1>
        <p className="lead">
          {category.bands.length} {category.bands.length === 1 ? t.band : t.bands}
        </p>
      </header>

      <nav className={styles.back} aria-label={t.backLabel}>
        <Link className={styles.backLink} href={href("music", lang)}>
          <span className={styles.backArrow} aria-hidden="true">
            ←
          </span>
          {t.back}
        </Link>
      </nav>

      <ul className={styles.list}>
        {category.bands.map((band) => (
          <li key={band.id}>
            <article className={styles.band}>
              <div className={styles.cover}>
                <Image
                  src={band.cover || "/covers/placeholder.svg"}
                  alt={`${t.coverOf} ${band.album ?? band.name}`}
                  width={88}
                  height={88}
                  sizes="88px"
                  unoptimized={band.cover?.endsWith(".svg")}
                />
              </div>

              <div className={styles.info}>
                <h2>{band.name}</h2>
                {band.album && <p className={styles.album}>{band.album}</p>}

                {band.snippet && (
                  <figure className={styles.snippet}>
                    <figcaption>{t.snippet(band.snippet.track)}</figcaption>
                    <audio controls preload="none" src={band.snippet.src}>
                      <a href={band.snippet.src}>
                        {t.download} {band.snippet.track}
                      </a>
                    </audio>
                  </figure>
                )}
              </div>

              {band.favorite && <span className={styles.badge}>{t.favorite}</span>}
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
