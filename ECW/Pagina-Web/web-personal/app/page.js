import Link from "next/link";

export const metadata = {
  title: "Sobre mí",
  description:
    "Presentación de Sergio Riesco Collar, estudiante de Ingeniería Informática de Software y del Máster en Ingeniería Web.",
};

export default function Home() {
  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <p className="eyebrow">Sobre mí</p>
        <h1>Sergio Riesco Collar</h1>
        <p className="lead">
          Vivo en Gijón y estudio Ingeniería Informática de Software y el
          Máster en Ingeniería Web en la Universidad de Oviedo.
        </p>
      </header>

      <section aria-labelledby="presentacion">
        <h2 id="presentacion">Presentación</h2>
        <p>
          Me interesa aprender, construir cosas y entender la tecnología que
          hay detrás de las que usamos cada día.
        </p>
        <p>
          Este sitio reúne las cinco partes que mejor me definen: la música,
          los videojuegos, las series y mis aficiones.
        </p>
      </section>

      <section aria-labelledby="secciones">
        <h2 id="secciones">Mis secciones</h2>
        <ul className="link-list">
          <li><Link href="/musica">Música</Link>: rock de los años 70.</li>
          <li><Link href="/videojuegos">Videojuegos</Link>: DOOM, Zelda y Outer Wilds.</li>
          <li><Link href="/series">Series</Link>: The Boys, Invincible, Breaking Bad y más.</li>
          <li><Link href="/hobbies">Hobbies</Link>: skate, pizzas y videojuegos.</li>
        </ul>
      </section>
    </main>
  );
}
