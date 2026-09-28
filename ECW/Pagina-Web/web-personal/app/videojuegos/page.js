import Image from "next/image";
import { games } from "../data/games";

export const metadata = {
  title: "Videojuegos",
  description:
    "Mis videojuegos favoritos, con Breath of the Wild como favorito y Big Walk como el juego en el que estoy ahora mismo.",
};

export default function VideojuegosPage() {
  const currentGame = games.find((game) => game.current);

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <p className="eyebrow">Videojuegos</p>
        <h1>Videojuegos</h1>
        <p className="lead">
          Ahora mismo estoy jugando a <strong>{currentGame?.title}</strong> con
          amigos. En esta lista puedes ver algunos de mis videojuegos favoritos.
        </p>
      </header>

      <section aria-labelledby="lista">
        <div className="game-section-header">
          <div>
            <h2 id="lista">Mis juegos</h2>
            <p className="game-section-hint">Desliza la lista para ver más.</p>
          </div>
          {currentGame && (
            <p className="current-game">
              <span aria-hidden="true" />
              Jugando ahora: {currentGame.title}
            </p>
          )}
        </div>

        <ul className="game-scroller" aria-label="Lista de videojuegos">
          {games.map((game, index) => (
            <li key={game.id}>
              <article
                className={`game-card${game.current ? " game-card--current" : ""}`}
              >
                <div className="game-card__cover">
                  <Image
                    src={game.cover || "/covers/placeholder.svg"}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 44vw, 200px"
                    priority={index < 2}
                  />
                  {game.current && (
                    <span className="game-badge game-badge--current">
                      Jugando ahora
                    </span>
                  )}
                  {game.favorite && (
                    <span className="game-badge game-badge--favorite">
                      ★ Favorito
                    </span>
                  )}
                </div>

                <p className="game-card__genre">{game.genre}</p>
                <h3>{game.title}</h3>
                <p className="game-card__description">{game.description}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
