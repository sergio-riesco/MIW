import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { hobbies } from "../data/hobbies";
import styles from "./hobbies.module.css";

export const metadata = {
  title: "Hobbies",
  description: "Mis aficiones: videojuegos, skate y hacer pizzas.",
};

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
        {hobbies.map((hobby) => (
          <li key={hobby.id}>
            <article className={styles.card}>
              <div className={styles.cover}>
                <Image
                  src={hobby.cover || "/covers/videogames/placeholder.svg"}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 22rem"
                  unoptimized={hobby.cover?.endsWith(".svg")}
                />
              </div>

              <div className={styles.info}>
                <h2>{hobby.title}</h2>
                <p>{hobby.text}</p>

                {hobby.link && (
                  <Link className={styles.link} href={hobby.link.href}>
                    {hobby.link.label}
                  </Link>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
