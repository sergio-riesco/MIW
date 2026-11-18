import Image from "next/image";
import Breadcrumb from "../components/Breadcrumb";
import { withAbbr } from "../components/Abbr";
import TrailerDialog from "../components/TrailerDialog";
import { subtitleTracks } from "../data/subtitles";
import { videogames } from "../data/videogames";
import { dictionaries } from "../i18n/dictionaries";
import { href, pageMetadata, pick } from "../i18n/config";
import styles from "./videogames.module.css";

const text = {
  es: {
    title: "Videojuegos",
    description:
      "Mis videojuegos favoritos, con Breath of the Wild como favorito y Big Walk como el juego en el que estoy ahora mismo.",
    home: "Sobre mí",
    lead: (game) => (
      <>
        Ahora mismo estoy jugando a <strong>{game}</strong> con amigos. En esta
        lista puedes ver algunos de mis videojuegos favoritos.
      </>
    ),
    list: "Mis juegos",
    listLabel: "Lista de videojuegos",
    hint: "Desliza la lista (o usa las flechas del teclado sobre ella) para ver más, y pulsa «Ver tráiler» en una portada para ver su tráiler.",
    playing: "Jugando ahora",
    favorite: "★ Favorito",
  },
  en: {
    title: "Video games",
    description:
      "My favourite video games, with Breath of the Wild as my all-time favourite and Big Walk as the one I'm playing right now.",
    home: "About me",
    lead: (game) => (
      <>
        Right now I&apos;m playing <strong>{game}</strong> with friends. In this
        list you can see some of my favourite video games.
      </>
    ),
    list: "My games",
    listLabel: "List of video games",
    hint: "Scroll the list (or use the arrow keys on it) to see more, and press “Watch trailer” on a cover to watch its trailer.",
    playing: "Playing now",
    favorite: "★ Favourite",
  },
};

export function metadata(lang) {
  const t = text[lang];
  return pageMetadata({ key: "videogames", lang, title: t.title, description: t.description });
}

export default function Videogames({ lang }) {
  const t = text[lang];
  const common = dictionaries[lang];
  const currentGame = videogames.find((game) => game.current);

  return (
    <main className="container page" id="contenido" data-section="videogames">
      <header className="page-header">
        <Breadcrumb
          label={common.breadcrumb}
          items={[{ label: t.home, href: href("home", lang) }, { label: t.title }]}
        />
        <h1>{t.title}</h1>
        {currentGame && <p className="lead">{t.lead(currentGame.title)}</p>}
      </header>

      <section aria-labelledby="lista">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="lista">{t.list}</h2>
            <p className={styles.sectionHint} id="lista-ayuda">
              {t.hint}
            </p>
          </div>
          {currentGame && (
            <p className={styles.currentGame}>
              <span aria-hidden="true" />
              {t.playing}: {currentGame.title}
            </p>
          )}
        </div>

        {/* tabIndex para poder desplazar la lista con las flechas del teclado */}
        <ul
          className={styles.scroller}
          aria-label={t.listLabel}
          aria-describedby="lista-ayuda"
          tabIndex={0}
        >
          {videogames.map((game, index) => (
            <li key={game.id}>
              <article
                className={
                  game.current ? `${styles.card} ${styles.currentCard}` : styles.card
                }
              >
                <div className={styles.cover}>
                  <Image
                    src={game.cover || "/covers/placeholder.svg"}
                    alt={`${common.coverOf} ${game.title}`}
                    fill
                    sizes="(max-width: 640px) 44vw, 200px"
                    priority={index < 2}
                    unoptimized={game.cover?.endsWith(".svg")}
                  />
                  {game.current && (
                    <span className={`${styles.badge} ${styles.badgeCurrent}`}>
                      {t.playing}
                    </span>
                  )}
                  {game.favorite && (
                    <span className={`${styles.badge} ${styles.badgeFavorite}`}>
                      {t.favorite}
                    </span>
                  )}
                  {game.trailer && (
                    <TrailerDialog
                      title={game.title}
                      src={game.trailer}
                      tracks={subtitleTracks(game.trailer, lang)}
                      poster={game.cover}
                      labels={common.trailer}
                    />
                  )}
                </div>

                <p className={styles.genre}>{withAbbr(pick(game.genre, lang), lang)}</p>
                <h3>{game.title}</h3>
                <p className={styles.description}>{pick(game.description, lang)}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
