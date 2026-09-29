import Breadcrumb from "../components/Breadcrumb";
import styles from "./series.module.css";

export const metadata = {
  title: "Series",
  description: "Las series que más me gustan y la que estoy viendo ahora mismo.",
};

export default function SeriesPage() {
  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb
          items={[{ label: "Sobre mí", href: "/" }, { label: "Series" }]}
        />
        <h1>Series</h1>
        <p className="lead">
          Estas son las series que más me gustan y la que estoy viendo ahora
          mismo.
        </p>
      </header>

      <section aria-labelledby="favoritas">
        <h2 id="favoritas">Mis series</h2>
        <ul className={styles.list}>
          <li>The Boys</li>
          <li>Invincible</li>
          <li>Breaking Bad</li>
          <li>Better Call Saul</li>
        </ul>
      </section>

      <section aria-labelledby="actualmente">
        <h2 id="actualmente">Ahora estoy viendo</h2>
        <p>Lanterns.</p>
      </section>
    </main>
  );
}
