import Image from "next/image";
import { bands } from "../data/music";

export const metadata = {
  title: "Música",
  description:
    "Mis grupos favoritos de rock de los años 70: Pink Floyd, Electric Light Orchestra, Blue Öyster Cult y The Alan Parsons Project.",
};

export default function MusicPage() {
  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <p className="eyebrow">Música</p>
        <h1>Música</h1>
        <p className="lead">
          Me gusta especialmente el rock de los años setenta. Estos son los
          grupos que más escucho.
        </p>
      </header>

      <section aria-labelledby="genero">
        <div className="genre-panel">
          <h2 id="genero">Rock de los años 70</h2>
          <p className="genre-panel__text">
            Canciones largas, sintetizadores y mucho espacio para experimentar.
            El rock de esa época es el que más me gusta.
          </p>
          <p className="genre-panel__count">
            {bands.length} grupos en la lista
          </p>
        </div>
      </section>

      <section aria-labelledby="grupos">
        <h2 id="grupos">Mis grupos</h2>
        <ul className="band-list">
          {bands.map((band) => (
            <li key={band.id}>
              <article className="band">
                <div className="band__cover">
                  <Image
                    src={band.cover || "/covers/placeholder.svg"}
                    alt=""
                    width={88}
                    height={88}
                    sizes="88px"
                    unoptimized={band.cover?.endsWith(".svg")}
                  />
                </div>

                <div className="band__info">
                  <h3>{band.name}</h3>
                  <p className="band__genre">{band.genre}</p>
                  {band.album && <p className="band__album">{band.album}</p>}
                </div>

                {band.favorite && (
                  <span className="band-badge">★ Favorito</span>
                )}
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
