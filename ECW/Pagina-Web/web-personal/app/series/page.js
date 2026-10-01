import Image from "next/image";
import Breadcrumb from "../components/Breadcrumb";
import { series } from "../data/series";
import styles from "./series.module.css";

export const metadata = {
  title: "Series",
  description: "Las series que más me gustan y la que estoy viendo ahora mismo.",
};

export default function SeriesPage() {
  const currentSeries = series.find((show) => show.current);
  const favorites = series.filter((show) => show.favorite);
  // La que estoy viendo se muestra arriba en grande, así que se quita de la rejilla.
  const rest = series.filter((show) => !show.current);

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb
          items={[{ label: "Sobre mí", href: "/" }, { label: "Series" }]}
        />
        <h1>Series</h1>
        <p className="lead">
          Estas son las series que más me gustan y la que estoy viendo ahora
          mismo.
        </p>
      </header>

      {currentSeries && (
        <section aria-labelledby="actualmente">
          <div className={styles.sectionHeader}>
            <h2 id="actualmente">Ahora estoy viendo</h2>
            <p className={styles.currentHint}>
              <span aria-hidden="true" />
              Viendo ahora
            </p>
          </div>

          <article className={styles.featured}>
            <div className={styles.featuredCover}>
              <Image
                src={currentSeries.cover || "/covers/videogames/placeholder.svg"}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 30rem"
                priority
                unoptimized={currentSeries.cover?.endsWith(".svg")}
              />
            </div>

            <div className={styles.featuredInfo}>
              <p className={styles.genre}>{currentSeries.genre}</p>
              <h3 className={styles.featuredTitle}>{currentSeries.title}</h3>
              <p className={styles.season}>{currentSeries.season}</p>
              <p className={styles.description}>{currentSeries.description}</p>
            </div>
          </article>
        </section>
      )}

      <section aria-labelledby="mis-series">
        <h2 id="mis-series">Mis series</h2>

        <ul className={styles.grid}>
          {rest.map((show) => (
            <li key={show.id}>
              <article className={styles.card}>
                <div className={styles.cover}>
                  <Image
                    src={show.cover || "/covers/videogames/placeholder.svg"}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 17rem"
                    unoptimized={show.cover?.endsWith(".svg")}
                  />
                  {show.favorite && (
                    <span className={`${styles.badge} ${styles.badgeFavorite}`}>
                      ★ Favorita
                    </span>
                  )}
                </div>

                <p className={styles.genre}>{show.genre}</p>
                <h3 className={styles.cardTitle}>{show.title}</h3>
                <p className={styles.season}>{show.season}</p>
                <p className={styles.description}>{show.description}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {favorites.length > 0 && (
        <section aria-labelledby="favoritas">
          <h2 id="favoritas">Mi favorita</h2>
          <p className={styles.favoriteNote}>
            Si tengo que elegir una sola:{" "}
            <strong>{favorites[0].title}</strong>. {favorites[0].description}
          </p>
        </section>
      )}
    </main>
  );
}
