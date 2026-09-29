import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
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
        <li>
          <h2>Videojuegos</h2>
          <p>
            Es una de mis aficiones. Si quieres, puedes ver mi lista en la
            página de <Link href="/videojuegos">videojuegos</Link>.
          </p>
        </li>
        <li>
          <h2>Skate</h2>
          <p>Me gusta hacer skate sobre todo para dar paseos, no para hacer trucos.</p>
        </li>
        <li>
          <h2>Pizzas</h2>
          <p>Hacer pizzas es otra de las cosas que más me gustan.</p>
        </li>
      </ul>
    </main>
  );
}
