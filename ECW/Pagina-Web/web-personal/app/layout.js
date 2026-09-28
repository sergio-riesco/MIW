import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";
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

        <header className="site-header">
          <div className="container header-content">
            <Link className="site-title" href="/">
              Sergio Riesco Collar
            </Link>

            <div className="header-actions">
              <nav aria-label="Navegación principal">
                <ul>
                  {navigation.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="container footer-content">
            <p>© 2026 Sergio Riesco Collar</p>
            <p>Gijón, Asturias · HTML, CSS y Next.js</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
