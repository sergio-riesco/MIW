import SiteShell, { siteMetadata } from "../components/SiteShell";

export const metadata = siteMetadata("es");

// Plantilla raíz de las páginas en español.
export default function Layout({ children }) {
  return <SiteShell lang="es">{children}</SiteShell>;
}
