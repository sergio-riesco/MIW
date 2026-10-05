import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { hobbies } from "../data/hobbies";
import { videogames } from "../data/videogames";
import styles from "./hobbies.module.css";

export const metadata = {
  title: "Hobbies",
  description: "Mis aficiones: videojuegos, skate y hacer pizzas.",
};

// Los datos de videojuegos salen de la lista de la página de videojuegos,
// así no hay que repetirlos aquí.
function detallesVideojuegos() {
  const actual = videogames.find((game) => game.current);
  const favorito = videogames.find((game) => game.favorite);

  return [
    actual && { label: "Jugando ahora", value: actual.title },
    favorito && { label: "Mi favorito", value: favorito.title },
    { label: "En mi lista", value: `${videogames.length} juegos` },
  ].filter(Boolean);
}

export default function HobbiesPage() {
  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb
          items={[{ label: "Sobre mí", href: "/" }, { label: "Hobbies" }]}
        />
        <h1>Mis aficiones</h1>
        <p className="lead">Tres cosas a las que dedico parte de mi tiempo libre.</p>
      </header>

      <ul className={styles.list}>
        {hobbies.map((hobby, index) => {
          const details = hobby.id === "videojuegos" ? detallesVideojuegos() : hobby.details;

          return (
            <li key={hobby.id}>
              <article className={`${styles.card} ${styles[hobby.tone] ?? ""}`}>
                <div className={styles.cover}>
                  <Image
                    src={hobby.cover || "/covers/placeholder.svg"}
                    alt=""
                    fill
                    sizes="(max-width: 736px) 100vw, 26rem"
                    // la primera se ve sin hacer scroll
                    priority={index === 0}
                    unoptimized={hobby.cover?.endsWith(".svg")}
                  />
                </div>

                <div className={styles.info}>
                  <h2>{hobby.title}</h2>
                  <p>{hobby.text}</p>

                  {details?.length > 0 && (
                    <dl className={styles.details}>
                      {details.map((detail) => (
                        <div key={detail.label}>
                          <dt>{detail.label}</dt>
                          <dd>{detail.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {hobby.link && (
                    <Link className={styles.link} href={hobby.link.href}>
                      {hobby.link.label}
                    </Link>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
