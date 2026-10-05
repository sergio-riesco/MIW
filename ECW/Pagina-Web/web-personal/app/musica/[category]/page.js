import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "../../components/Breadcrumb";
import { categories } from "../../data/music";
import styles from "./categoria.module.css";

// Genera una página estática por cada categoría en el momento de la compilación.
export function generateStaticParams() {
  return categories.map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }) {
  const { category: slug } = await params;
  const category = categories.find((item) => item.id === slug);

  if (!category) {
    return {};
  }

  return {
    title: category.name,
    description: `Mis grupos y artistas de ${category.name}.`,
  };
}

export default async function MusicCategoryPage({ params }) {
  const { category: slug } = await params;
  const category = categories.find((item) => item.id === slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb
          items={[
            { label: "Sobre mí", href: "/" },
            { label: "Música", href: "/musica" },
            { label: category.name },
          ]}
        />
        <h1>{category.name}</h1>
        <p className="lead">
          {category.bands.length}{" "}
          {category.bands.length === 1 ? "grupo" : "grupos"}
        </p>
      </header>

      <nav className={styles.back} aria-label="Volver a la lista de géneros">
        <Link className={styles.backLink} href="/musica">
          <span className={styles.backArrow} aria-hidden="true">
            ←
          </span>
          Volver a todos los géneros
        </Link>
      </nav>

      <ul className={styles.list}>
        {category.bands.map((band) => (
          <li key={band.id}>
            <article className={styles.band}>
              <div className={styles.cover}>
                <Image
                  src={band.cover || "/covers/placeholder.svg"}
                  alt=""
                  width={88}
                  height={88}
                  sizes="88px"
                  unoptimized={band.cover?.endsWith(".svg")}
                />
              </div>

              <div className={styles.info}>
                <h2>{band.name}</h2>
                {band.album && <p className={styles.album}>{band.album}</p>}

                {band.snippet && (
                  <figure className={styles.snippet}>
                    <figcaption>
                      Fragmento de «{band.snippet.track}»
                    </figcaption>
                    {/* preload="none": no se descarga nada hasta pulsar play. */}
                    <audio controls preload="none" src={band.snippet.src}>
                      <a href={band.snippet.src}>
                        Descargar el fragmento de {band.snippet.track}
                      </a>
                    </audio>
                  </figure>
                )}
              </div>

              {band.favorite && <span className={styles.badge}>★ Favorito</span>}
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
