export const metadata = {
  title: "Series",
  description: "Las series que más me gustan y la que estoy viendo ahora mismo.",
};

export default function SeriesPage() {
  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <p className="eyebrow">Series</p>
        <h1>Series</h1>
        <p className="lead">
          Estas son las series que más me gustan y la que estoy viendo ahora
          mismo.
        </p>
      </header>

      <section aria-labelledby="favoritas">
        <h2 id="favoritas">Mis series</h2>
        <ul className="plain-list">
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
