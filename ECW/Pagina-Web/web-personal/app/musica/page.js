import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { categories } from "../data/music";
import styles from "./musica.module.css";

export const metadata = {
  title: "Música",
  description:
    "Mis grupos y artistas favoritos, organizados por género musical.",
};

export default function MusicPage() {
  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb items={[{ label: "Sobre mí", href: "/" }, { label: "Música" }]} />
        <h1>Música</h1>
        <p className="lead">
          Escucho todo tipo de música pero en especial me gusta el rock. Aquí
          están mis grupos y artistas, agrupados por género junto a sus álbumes más famosos.
        </p>
      </header>

      <ul className={styles.grid}>
        {categories.map((category, categoryIndex) => (
          <li key={category.id}>
            <Link className={styles.card} href={`/musica/${category.id}`}>
              <span className={styles.covers}>
                {category.bands.slice(0, 4).map((band, index) => (
                  <Image
                    key={band.id}
                    src={band.cover || "/covers/videogames/placeholder.svg"}
                    alt=""
                    width={40}
                    height={40}
                    sizes="40px"
                    // La primera tarjeta es la que se ve sin hacer scroll.
                    priority={categoryIndex === 0 && index === 0}
                    unoptimized={band.cover?.endsWith(".svg")}
                  />
                ))}
              </span>

              <span className={styles.name}>{category.name}</span>
              <span className={styles.count}>
                {category.bands.length}{" "}
                {category.bands.length === 1 ? "grupo" : "grupos"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
