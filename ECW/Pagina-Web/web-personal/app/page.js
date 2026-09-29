import Link from "next/link";
import Breadcrumb from "./components/Breadcrumb";
import styles from "./page.module.css";

export const metadata = {
  title: "Sobre mí",
  description:
    "Presentación de Sergio Riesco Collar, estudiante de Ingeniería Informática de Software y del Máster en Ingeniería Web.",
};

const facts = [
  { label: "Vivo en", value: "Gijón, Asturias" },
  { label: "Grado", value: "Ingeniería Informática de Software" },
  { label: "Máster", value: "Ingeniería Web" },
  { label: "Universidad", value: "Universidad de Oviedo" },
];

const sections = [
  {
    href: "/musica",
    title: "Música",
    text: "Mis grupos y artistas favoritos, organizados por género.",
  },
  {
    href: "/videojuegos",
    title: "Videojuegos",
    text: "DOOM, Zelda, Outer Wilds y el que estoy jugando ahora mismo.",
  },
  {
    href: "/series",
    title: "Series",
    text: "The Boys, Invincible, Breaking Bad y la que estoy viendo.",
  },
  {
    href: "/hobbies",
    title: "Hobbies",
    text: "Skate, pizzas y videojuegos.",
  },
];

export default function Home() {
  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb items={[{ label: "Sobre mí" }]} />
        <h1>Sergio Riesco Collar</h1>
        <p className="lead">
          Vivo en Gijón y estudio Ingeniería Informática de Software y el
          Máster en Ingeniería Web en la Universidad de Oviedo.
        </p>
      </header>

      <section aria-labelledby="presentacion">
        <h2 id="presentacion">Presentación</h2>
        <p>
          Me interesa aprender, construir cosas y entender la tecnología que hay
          detrás de las que usamos cada día.
        </p>
        <p>
          Este sitio reúne las cuatro partes que mejor me definen: la música,
          los videojuegos, las series y mis aficiones.
        </p>
      </section>

      <section aria-labelledby="datos">
        <h2 id="datos">En resumen</h2>
        <dl className={styles.factList}>
          {facts.map((fact) => (
            <div className={styles.fact} key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="secciones">
        <h2 id="secciones">Mis secciones</h2>
        <ul className={styles.sectionList}>
          {sections.map((section) => (
            <li key={section.href}>
              <Link className={styles.sectionLink} href={section.href}>
                <span className={styles.sectionLinkTitle}>{section.title}</span>
                <span className={styles.sectionLinkText}>{section.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
