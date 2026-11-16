import Image from "next/image";
import Breadcrumb from "../components/Breadcrumb";
import TrailerDialog from "../components/TrailerDialog";
import { series } from "../data/series";
import { subtitleTracks } from "../data/subtitles";
import { dictionaries } from "../i18n/dictionaries";
import { href, pageMetadata, pick } from "../i18n/config";
import styles from "./series.module.css";

const text = {
  es: {
    title: "Series",
    description: "Las series que más me gustan y la que estoy viendo ahora mismo.",
    home: "Sobre mí",
    lead: "Estas son las series que más me gustan y la que estoy viendo ahora mismo.",
    current: "Ahora estoy viendo",
    watching: "Viendo ahora",
    trailerOf: "Tráiler de",
    list: "Mis series",
    hint: "Pulsa «Ver tráiler» en una portada para ver su tráiler.",
    favorite: "★ Favorita",
    favoriteTitle: "Mi favorita",
    favoriteIntro: "Si tengo que elegir una sola:",
  },
  en: {
    title: "TV series",
    description: "The TV series I like the most and the one I'm watching right now.",
    home: "About me",
    lead: "These are the TV series I like the most and the one I'm watching right now.",
    current: "What I'm watching now",
    watching: "Watching now",
    trailerOf: "Trailer of",
    list: "My series",
    hint: "Press “Watch trailer” on a cover to watch its trailer.",
    favorite: "★ Favourite",
    favoriteTitle: "My favourite",
    favoriteIntro: "If I had to pick just one:",
  },
};

export function metadata(lang) {
  const t = text[lang];
  return pageMetadata({ key: "series", lang, title: t.title, description: t.description });
}

export default function Series({ lang }) {
  const t = text[lang];
  const common = dictionaries[lang];
  const currentSeries = series.find((show) => show.current);
  const favorites = series.filter((show) => show.favorite);
  // la actual sale arriba en grande, no en la rejilla
  const rest = series.filter((show) => !show.current);

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb
          label={common.breadcrumb}
          items={[{ label: t.home, href: href("home", lang) }, { label: t.title }]}
        />
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      {currentSeries && (
        <section aria-labelledby="actualmente">
          <div className={styles.sectionHeader}>
            <h2 id="actualmente">{t.current}</h2>
            <p className={styles.currentHint}>
              <span aria-hidden="true" />
              {t.watching}
            </p>
          </div>

          <article className={styles.featured}>
            <div className={styles.featuredCover}>
              {currentSeries.trailer ? (
                // preload="none": no se baja hasta darle a play
                <video
                  controls
                  preload="none"
                  poster={currentSeries.cover}
                  aria-label={`${t.trailerOf} ${currentSeries.title}`}
                >
                  <source src={currentSeries.trailer} type="video/mp4" />
                  {subtitleTracks(currentSeries.trailer, lang).map((track, i) => (
                    <track
                      key={track.lang}
                      kind="subtitles"
                      src={track.src}
                      srcLang={track.lang}
                      label={track.label}
                      default={i === 0}
                    />
                  ))}
                  <a href={currentSeries.trailer}>
                    {common.trailer.download} {currentSeries.title}
                  </a>
                </video>
              ) : (
                <Image
                  src={currentSeries.cover || "/covers/placeholder.svg"}
                  alt={`${common.coverOf} ${currentSeries.title}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 30rem"
                  priority
                  unoptimized={currentSeries.cover?.endsWith(".svg")}
                />
              )}
            </div>

            <div className={styles.featuredInfo}>
              <p className={styles.genre}>{pick(currentSeries.genre, lang)}</p>
              <h3 className={styles.featuredTitle}>{currentSeries.title}</h3>
              <p className={styles.season}>{currentSeries.season}</p>
              <p className={styles.description}>{pick(currentSeries.description, lang)}</p>
            </div>
          </article>
        </section>
      )}

      <section aria-labelledby="mis-series">
        <h2 id="mis-series">{t.list}</h2>
        <p className={styles.gridHint}>{t.hint}</p>

        <ul className={styles.grid}>
          {rest.map((show) => (
            <li key={show.id}>
              <article className={styles.card}>
                <div className={styles.cover}>
                  <Image
                    src={show.cover || "/covers/placeholder.svg"}
                    alt={`${common.coverOf} ${show.title}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 17rem"
                    unoptimized={show.cover?.endsWith(".svg")}
                  />
                  {show.favorite && (
                    <span className={`${styles.badge} ${styles.badgeFavorite}`}>
                      {t.favorite}
                    </span>
                  )}
                  {show.trailer && (
                    <TrailerDialog
                      title={show.title}
                      src={show.trailer}
                      tracks={subtitleTracks(show.trailer, lang)}
                      poster={show.cover}
                      labels={common.trailer}
                    />
                  )}
                </div>

                <p className={styles.genre}>{pick(show.genre, lang)}</p>
                <h3 className={styles.cardTitle}>{show.title}</h3>
                <p className={styles.season}>{show.season}</p>
                <p className={styles.description}>{pick(show.description, lang)}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {favorites.length > 0 && (
        <section aria-labelledby="favoritas">
          <h2 id="favoritas">{t.favoriteTitle}</h2>
          <p className={styles.favoriteNote}>
            {t.favoriteIntro} <strong>{favorites[0].title}</strong>.{" "}
            {pick(favorites[0].description, lang)}
          </p>
        </section>
      )}
    </main>
  );
}
