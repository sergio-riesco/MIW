import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { hobbies } from "../data/hobbies";
import { videogames } from "../data/videogames";
import { dictionaries } from "../i18n/dictionaries";
import { href, pageMetadata, pick } from "../i18n/config";
import styles from "./hobbies.module.css";

const text = {
  es: {
    title: "Mis aficiones",
    navTitle: "Hobbies",
    description: "Mis aficiones: videojuegos, skate y hacer pizzas.",
    home: "Sobre mí",
    lead: "Tres cosas a las que dedico parte de mi tiempo libre.",
    playing: "Jugando ahora",
    favorite: "Mi favorito",
    inList: "En mi lista",
    games: "juegos",
    imageOf: "Ilustración de",
  },
  en: {
    title: "My hobbies",
    navTitle: "Hobbies",
    description: "My hobbies: video games, skating and making pizzas.",
    home: "About me",
    lead: "Three things I spend part of my free time on.",
    playing: "Playing now",
    favorite: "My favourite",
    inList: "On my list",
    games: "games",
    imageOf: "Illustration of",
  },
};

export function metadata(lang) {
  const t = text[lang];
  return pageMetadata({ key: "hobbies", lang, title: t.navTitle, description: t.description });
}

// Los datos de videojuegos salen de la lista de la página de videojuegos,
// así no hay que repetirlos aquí.
function detallesVideojuegos(t) {
  const actual = videogames.find((game) => game.current);
  const favorito = videogames.find((game) => game.favorite);

  return [
    actual && { label: t.playing, value: actual.title },
    favorito && { label: t.favorite, value: favorito.title },
    { label: t.inList, value: `${videogames.length} ${t.games}` },
  ].filter(Boolean);
}

export default function Hobbies({ lang }) {
  const t = text[lang];

  return (
    <main className="container page" id="contenido" data-section="hobbies">
      <header className="page-header">
        <Breadcrumb
          label={dictionaries[lang].breadcrumb}
          items={[{ label: t.home, href: href("home", lang) }, { label: t.navTitle }]}
        />
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <ul className={styles.list}>
        {hobbies.map((hobby, index) => {
          const title = pick(hobby.title, lang);
          const details =
            hobby.id === "videojuegos"
              ? detallesVideojuegos(t)
              : hobby.details?.map((detail) => ({
                  label: pick(detail.label, lang),
                  value: pick(detail.value, lang),
                }));

          return (
            <li key={hobby.id}>
              <article className={`${styles.card} ${styles[hobby.tone] ?? ""}`}>
                <div className={styles.cover}>
                  <Image
                    src={hobby.cover || "/covers/placeholder.svg"}
                    alt={`${t.imageOf} ${title.toLowerCase()}`}
                    fill
                    sizes="(max-width: 736px) 100vw, 26rem"
                    // la primera se ve sin hacer scroll
                    priority={index === 0}
                    unoptimized={hobby.cover?.endsWith(".svg")}
                  />
                </div>

                <div className={styles.info}>
                  <h2>{title}</h2>
                  <p>{pick(hobby.text, lang)}</p>

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
                    <Link className={styles.link} href={href(hobby.link.to, lang)}>
                      {pick(hobby.link.label, lang)}
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
