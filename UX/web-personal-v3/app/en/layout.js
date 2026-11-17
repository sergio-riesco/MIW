import SiteShell, { siteMetadata } from "../components/SiteShell";

export const metadata = siteMetadata("en");

// Plantilla raíz de las páginas en inglés.
export default function Layout({ children }) {
  return <SiteShell lang="en">{children}</SiteShell>;
}
