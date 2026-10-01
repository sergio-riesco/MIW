import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "./components/Breadcrumb";
import styles from "./page.module.css";

export const metadata = {
  title: "Sobre mí",
  description:
    "Presentación de Sergio Riesco Collar, estudiante de Ingeniería Informática de Software y del Máster en Ingeniería Web de la Universidad de Oviedo.",
};

const facts = [
  { label: "Vivo en", value: "Gijón, Asturias" },
  {
    label: "Estudios",
    value: "Grado en Ingeniería Informática de Software",
    detail: "Universidad de Oviedo (en curso)",
  },
  {
    label: "Actualmente",
    value: "Estudiando el Máster en Ingeniería Web",
    detail: "Universidad de Oviedo",
  },
];

const contact = [
  {
    label: "Correo",
    text: "sergioriescocollar@gmail.com",
    href: "mailto:sergioriescocollar@gmail.com",
  },
  {
    label: "GitHub",
    text: "github.com/sergio-riesco",
    href: "https://github.com/sergio-riesco",
  },
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
          Vivo en Gijón. Estudio el Grado en Ingeniería Informática de Software y
          el Máster en Ingeniería Web, ambos en la Universidad de Oviedo.
        </p>
      </header>

      <section aria-labelledby="presentacion">
        <h2 id="presentacion">Presentación</h2>

        <div className={styles.profile}>
          <div className={styles.profileText}>
            <p>
              Me interesa aprender, construir cosas y entender la tecnología que
              hay detrás de las que usamos cada día.
            </p>
            <p>
              Este sitio reúne las cuatro partes que mejor me definen: la
              música, los videojuegos, las series y mis aficiones.
            </p>
          </div>

          <Image
            className={styles.photo}
            src="/sergio.jpg"
            alt="Sergio Riesco Collar"
            width={1200}
            height={960}
            sizes="(max-width: 640px) 100vw, 22rem"
          />
        </div>
      </section>

      <section aria-labelledby="datos">
        <h2 id="datos">En resumen</h2>
        <dl className={styles.factList}>
          {facts.map((fact) => (
            <div className={styles.fact} key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>
                {fact.value}
                {fact.detail && (
                  <span className={styles.factDetail}>{fact.detail}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="contacto">
        <h2 id="contacto">Contacto</h2>
        <address className={styles.contact}>
          <dl className={styles.factList}>
            {contact.map((item) => (
              <div className={styles.fact} key={item.label}>
                <dt>{item.label}</dt>
                <dd>
                  <a href={item.href}>{item.text}</a>
                </dd>
              </div>
            ))}
          </dl>
        </address>
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
