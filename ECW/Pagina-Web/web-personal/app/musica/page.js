export const metadata = {
  title: "Música",
  description: "Mis grupos favoritos de rock de los años 70.",
};

export default function MusicPage() {
  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <p className="eyebrow">Música</p>
        <h1>Rock de los años 70</h1>
        <p className="lead">
          Me gusta especialmente el rock de los años setenta.
        </p>
      </header>

      <section aria-labelledby="grupos">
        <h2 id="grupos">Grupos que me gustan</h2>
        <ul className="plain-list">
          <li>Pink Floyd</li>
          <li>Electric Light Orchestra</li>
          <li>Blue Öyster Cult</li>
          <li>The Alan Parsons Project</li>
        </ul>
      </section>
    </main>
  );
}
