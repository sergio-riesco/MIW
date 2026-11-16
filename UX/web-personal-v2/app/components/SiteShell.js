import Link from "next/link";
import { dictionaries, EMAIL } from "../i18n/dictionaries";
import { formatDate, href, LAST_UPDATED, SITE_URL } from "../i18n/config";
import InlineScript from "./InlineScript";
import LanguageSwitch from "./LanguageSwitch";
import MenuToggle from "./MenuToggle";
import NavMenu from "./NavMenu";
import ThemeToggle from "./ThemeToggle";
import Clarity from "./Clarity";
import styles from "./SiteShell.module.css";
import "../globals.css";

const navKeys = ["home", "education", "music", "videogames", "series", "hobbies", "contact"];

// Pone data-theme antes de pintar para que no haya parpadeo al recargar.
// Tiene que hacer lo mismo que ThemeToggle.js. También añade la clase "js"
// a <html>: solo entonces el menú de móvil se pliega (sin JavaScript se ve
// abierto, porque el botón no funcionaría).
const themeScript = `(function(){document.documentElement.classList.add("js");try{var p=localStorage.getItem("theme");var t=(p==="light"||p==="dark")?p:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","light")}})()`;

export function siteMetadata(lang) {
  const t = dictionaries[lang];

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t.siteName,
      template: `%s | ${t.siteName}`,
    },
    description: t.siteDescription,
  };
}

function SearchForm({ id, className, lang, labels }) {
  return (
    <form
      className={`${styles.search} ${className}`}
      role="search"
      action={href("search", lang)}
      method="get"
    >
      <label className="visually-hidden" htmlFor={id}>
        {labels.label}
      </label>
      <input
        id={id}
        className={styles.searchInput}
        type="search"
        name="q"
        placeholder={labels.placeholder}
        autoComplete="off"
      />
      <button className={styles.searchButton} type="submit">
        {labels.button}
      </button>
    </form>
  );
}

// Plantilla común (cabecera, menú, pie) de las páginas en español y en inglés.
export default function SiteShell({ lang, children }) {
  const t = dictionaries[lang];
  const navigation = navKeys.map((key) => ({
    key,
    href: href(key, lang),
    label: t.nav[key],
  }));
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(t.footer.feedbackSubject)}`;

  return (
    <html lang={lang} data-theme="light" suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body>
        <a className="skip-link" href="#contenido">
          {t.skipLink}
        </a>

        <header className={styles.siteHeader}>
          <div className={`container ${styles.headerTop}`}>
            <p className={styles.siteTitle}>{t.siteName}</p>

            <div className={styles.tools}>
              {/* En escritorio el buscador va aquí; en móvil, dentro del menú */}
              <SearchForm
                id="buscar-cabecera"
                className={styles.searchDesktop}
                lang={lang}
                labels={t.search}
              />
              <LanguageSwitch
                lang={lang}
                labels={t.language}
                className={styles.languageDesktop}
              />
              <ThemeToggle labels={t.theme} />
              <MenuToggle panelId="menu-principal" labels={t.menu} />
            </div>
          </div>

          {/* En móvil es un desplegable que abre el botón «Menú». Sin
              JavaScript se ve siempre abierto. */}
          <div className={`container ${styles.panel}`} id="menu-principal">
            <SearchForm
              id="buscar-menu"
              className={styles.searchMobile}
              lang={lang}
              labels={t.search}
            />
            <NavMenu lang={lang} label={t.mainNav} items={navigation} />
            <LanguageSwitch
              lang={lang}
              labels={t.language}
              className={styles.languageMobile}
            />
          </div>
        </header>

        {children}

        <footer className={styles.siteFooter}>
          <div className={`container ${styles.footerContent}`}>
            <nav aria-label={t.footer.nav}>
              <ul className={styles.footerLinks}>
                <li>
                  <Link href={href("sitemap", lang)}>{t.footer.sitemap}</Link>
                </li>
                <li>
                  <Link href={href("help", lang)}>{t.footer.help}</Link>
                </li>
                <li>
                  <Link href={href("contact", lang)}>{t.footer.contact}</Link>
                </li>
              </ul>
            </nav>

            <p>
              {t.footer.feedback} <a href={mailto}>{t.footer.feedbackLink}</a>.
            </p>

            <p>
              {t.footer.lastUpdated}{" "}
              <time dateTime={LAST_UPDATED}>{formatDate(LAST_UPDATED, lang)}</time>
            </p>

            <p>
              © 2026 Sergio Riesco Collar · {t.footer.place}
            </p>
          </div>
        </footer>
        <Clarity />
      </body>
    </html>
  );
}
