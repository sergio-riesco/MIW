import Image from "next/image";
import Breadcrumb from "../components/Breadcrumb";
import { videogames } from "../data/videogames";
import styles from "./videojuegos.module.css";

export const metadata = {
  title: "Videojuegos",
  description:
    "Mis videojuegos favoritos, con Breath of the Wild como favorito y Big Walk como el juego en el que estoy ahora mismo.",
};

export default function VideojuegosPage() {
  const currentGame = videogames.find((game) => game.current);

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb
          items={[{ label: "Sobre mí", href: "/" }, { label: "Videojuegos" }]}
        />
        <h1>Videojuegos</h1>
        <p className="lead">
          Ahora mismo estoy jugando a <strong>{currentGame?.title}</strong> con
          amigos. En esta lista puedes ver algunos de mis videojuegos favoritos.
        </p>
      </header>

      <section aria-labelledby="lista">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="lista">Mis juegos</h2>
            <p className={styles.sectionHint}>Desliza la lista para ver más.</p>
          </div>
          {currentGame && (
            <p className={styles.currentGame}>
              <span aria-hidden="true" />
              Jugando ahora: {currentGame.title}
            </p>
          )}
        </div>

        <ul className={styles.scroller} aria-label="Lista de videojuegos">
          {videogames.map((game, index) => (
            <li key={game.id}>
              <article
                className={
                  game.current
                    ? `${styles.card} ${styles.currentCard}`
                    : styles.card
                }
              >
                <div className={styles.cover}>
                  <Image
                    src={game.cover || "/covers/placeholder.svg"}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 44vw, 200px"
                    priority={index < 2}
                    unoptimized={game.cover?.endsWith(".svg")}
                  />
                  {game.current && (
                    <span className={`${styles.badge} ${styles.badgeCurrent}`}>
                      Jugando ahora
                    </span>
                  )}
                  {game.favorite && (
                    <span className={`${styles.badge} ${styles.badgeFavorite}`}>
                      ★ Favorito
                    </span>
                  )}
                </div>

                <p className={styles.genre}>{game.genre}</p>
                <h3>{game.title}</h3>
                <p className={styles.description}>{game.description}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
