import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";
import styles from "./layout.module.css";
import "./globals.css";

const navigation = [
  { href: "/", label: "Sobre mí" },
  { href: "/musica", label: "Música" },
  { href: "/videojuegos", label: "Videojuegos" },
  { href: "/series", label: "Series" },
  { href: "/hobbies", label: "Hobbies" },
];

export const metadata = {
  title: {
    default: "Sergio Riesco Collar",
    template: "%s | Sergio Riesco Collar",
  },
  description:
    "Sitio personal de Sergio Riesco Collar, estudiante de Ingeniería Informática de Software y del Máster en Ingeniería Web de la Universidad de Oviedo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido">
          Saltar al contenido principal
        </a>

        <header className={styles.siteHeader}>
          <div className={`container ${styles.headerContent}`}>
            <Link className={styles.siteTitle} href="/">
              Sergio Riesco Collar
            </Link>

            <div className={styles.headerActions}>
              <nav aria-label="Navegación principal">
                <ul className={styles.navList}>
                  {navigation.map((item) => (
                    <li key={item.href}>
                      <Link className={styles.navLink} href={item.href}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {children}

        <footer className={styles.siteFooter}>
          <div className={`container ${styles.footerContent}`}>
            <p>© 2026 Sergio Riesco Collar</p>
            <p>Gijón, Asturias · HTML, CSS y Next.js</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
