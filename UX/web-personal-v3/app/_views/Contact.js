import Breadcrumb from "../components/Breadcrumb";
import { contact, references } from "../data/profile";
import { dictionaries, EMAIL } from "../i18n/dictionaries";
import { href, pageMetadata, pick } from "../i18n/config";
import styles from "./pages.module.css";

const text = {
  es: {
    title: "Contacto",
    description:
      "Cómo contactar con Sergio Riesco Collar (correo, GitHub, LinkedIn e Instagram) y personas que le avalan.",
    home: "Sobre mí",
    lead: "La forma más rápida de hablar conmigo es por correo. Suelo contestar en uno o dos días.",
    ways: "Dónde encontrarme",
    write: "Escribirme un correo",
    subject: "Contacto desde la web personal",
    references: "Personas que me avalan",
    referencesIntro:
      "Estas personas me conocen por mi trabajo en clase y pueden dar referencias sobre mí.",
    profile: (name) => `Perfil de ${name} en LinkedIn`,
  },
  en: {
    title: "Contact",
    description:
      "How to contact Sergio Riesco Collar (email, GitHub, LinkedIn and Instagram) and people who can vouch for him.",
    home: "About me",
    lead: "The quickest way to reach me is by email. I usually reply within one or two days.",
    ways: "Where to find me",
    write: "Send me an email",
    subject: "Contact from the personal website",
    references: "References",
    referencesIntro:
      "These people know me from my work in class and can give references about me.",
    profile: (name) => `${name}'s LinkedIn profile`,
  },
};

export function metadata(lang) {
  const t = text[lang];
  return pageMetadata({ key: "contact", lang, title: t.title, description: t.description });
}

export default function Contact({ lang }) {
  const t = text[lang];
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(t.subject)}`;

  return (
    <main className="container page" id="contenido" data-section="contact">
      <header className="page-header">
        <Breadcrumb
          label={dictionaries[lang].breadcrumb}
          items={[{ label: t.home, href: href("home", lang) }, { label: t.title }]}
        />
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <section aria-labelledby="donde">
        <h2 id="donde">{t.ways}</h2>
        <address className={styles.address}>
          <ul className={styles.cards}>
            {contact.map((item) => (
              <li className={styles.card} key={item.id}>
                <p className={styles.cardTitle}>{pick(item.label, lang)}</p>
                <p>
                  <a className="tap-target" href={item.href}>{item.text}</a>
                </p>
              </li>
            ))}
          </ul>
        </address>
        <p>
          <a className={styles.button} href={mailto}>
            {t.write}
          </a>
        </p>
      </section>

      <section aria-labelledby="avales">
        <h2 id="avales">{t.references}</h2>
        <p>{t.referencesIntro}</p>
        <ul className={styles.cards}>
          {references.map((person) => (
            <li className={styles.card} key={person.id}>
              <h3>{person.name}</h3>
              <p className={styles.meta}>{pick(person.role, lang)}</p>
              <p>{pick(person.relation, lang)}</p>
              <p>
                <a className="tap-target" href={person.link.href} aria-label={t.profile(person.name)}>
                  {person.link.text}
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
