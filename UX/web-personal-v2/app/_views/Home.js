import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { contact, education, experience } from "../data/profile";
import { dictionaries } from "../i18n/dictionaries";
import { href, pageMetadata, pick } from "../i18n/config";
import styles from "./home.module.css";

const text = {
  es: {
    title: "Sobre mí",
    description:
      "Presentación de Sergio Riesco Collar, estudiante de Ingeniería Informática del Software y del Máster Universitario en Ingeniería Web de la Universidad de Oviedo.",
    lead: "Vivo en Gijón. Estoy terminando el Grado en Ingeniería Informática del Software y estudio el Máster Universitario en Ingeniería Web, ambos en la Universidad de Oviedo.",
    intro: "Presentación",
    p1: "Me interesa aprender, construir cosas y entender la tecnología que hay detrás de las que usamos cada día.",
    p2: "En este sitio puedes ver mi formación y experiencia, y también las cuatro cosas que mejor me definen fuera de clase: la música, los videojuegos, las series y mis aficiones.",
    photoAlt: "Fotografía de Sergio Riesco Collar",
    summary: "En resumen",
    livesIn: "Vivo en",
    city: "Gijón, Asturias",
    studies: "Estudios",
    experience: "Experiencia",
    seeEducation: "Ver formación y experiencia",
    contact: "Contacto",
    seeContact: "Más formas de contacto y referencias",
    sections: "Mis secciones",
    list: [
      { key: "education", title: "Formación", text: "Mis estudios y las prácticas en Mecalux." },
      { key: "music", title: "Música", text: "Mis grupos y artistas favoritos, organizados por género." },
      { key: "videogames", title: "Videojuegos", text: "Zelda, Outer Wilds, DOOM y el que estoy jugando ahora mismo." },
      { key: "series", title: "Series", text: "Breaking Bad, The Boys, Invincible y la que estoy viendo." },
      { key: "hobbies", title: "Hobbies", text: "Skate, pizzas y videojuegos." },
      { key: "contact", title: "Contacto", text: "Cómo escribirme y quién me avala." },
    ],
  },
  en: {
    title: "About me",
    description:
      "Introduction to Sergio Riesco Collar, Software Engineering student and Master's student in Web Engineering at the University of Oviedo.",
    lead: "I live in Gijón, Spain. I'm finishing my Bachelor's Degree in Software Engineering and studying the Master's Degree in Web Engineering, both at the University of Oviedo.",
    intro: "Introduction",
    p1: "I enjoy learning, building things and understanding the technology behind the things we use every day.",
    p2: "On this site you can see my education and experience, and also the four things that best define me outside class: music, video games, TV series and my hobbies.",
    photoAlt: "Photograph of Sergio Riesco Collar",
    summary: "At a glance",
    livesIn: "I live in",
    city: "Gijón, Asturias, Spain",
    studies: "Studies",
    experience: "Experience",
    seeEducation: "See education and experience",
    contact: "Contact",
    seeContact: "More ways to contact me and references",
    sections: "My sections",
    list: [
      { key: "education", title: "Education", text: "My studies and my internship at Mecalux." },
      { key: "music", title: "Music", text: "My favourite bands and artists, grouped by genre." },
      { key: "videogames", title: "Video games", text: "Zelda, Outer Wilds, DOOM and the one I'm playing right now." },
      { key: "series", title: "TV series", text: "Breaking Bad, The Boys, Invincible and the one I'm watching." },
      { key: "hobbies", title: "Hobbies", text: "Skating, pizzas and video games." },
      { key: "contact", title: "Contact", text: "How to reach me and who can vouch for me." },
    ],
  },
};

export function metadata(lang) {
  const t = text[lang];
  // La plantilla "%s | Sergio..." no se aplica a la página del propio layout,
  // así que aquí va el título completo.
  return pageMetadata({
    key: "home",
    lang,
    title: { absolute: `${t.title} | Sergio Riesco Collar` },
    description: t.description,
  });
}

function years(item, lang) {
  if (item.end) {
    return `${item.start}–${item.end}`;
  }
  return lang === "es" ? `desde ${item.start}` : `since ${item.start}`;
}

export default function Home({ lang }) {
  const t = text[lang];
  const job = experience[0];

  return (
    <main className="container page" id="contenido">
      <header className="page-header">
        <Breadcrumb label={dictionaries[lang].breadcrumb} items={[{ label: t.title }]} />
        <h1>Sergio Riesco Collar</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <section aria-labelledby="presentacion">
        <h2 id="presentacion">{t.intro}</h2>

        <div className={styles.profile}>
          <div className={styles.profileText}>
            <p>{t.p1}</p>
            <p>{t.p2}</p>
          </div>

          <Image
            className={styles.photo}
            src="/sergio.jpg"
            alt={t.photoAlt}
            width={1200}
            height={960}
            sizes="(max-width: 640px) 100vw, 22rem"
            priority
          />
        </div>
      </section>

      <section aria-labelledby="datos">
        <h2 id="datos">{t.summary}</h2>
        <dl className={styles.factList}>
          <div className={styles.fact}>
            <dt>{t.livesIn}</dt>
            <dd>{t.city}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{t.studies}</dt>
            {education.map((item) => (
              <dd key={item.id}>
                {pick(item.title, lang)}
                <span className={styles.factDetail}>
                  {pick(item.center, lang)} · {years(item, lang)} · {pick(item.status, lang)}
                </span>
              </dd>
            ))}
          </div>
          <div className={styles.fact}>
            <dt>{t.experience}</dt>
            <dd>
              {pick(job.role, lang)}, {job.company}
              <span className={styles.factDetail}>{pick(job.summary, lang)}</span>
            </dd>
          </div>
        </dl>
        <p>
          <Link href={href("education", lang)}>{t.seeEducation}</Link>
        </p>
      </section>

      <section aria-labelledby="contacto">
        <h2 id="contacto">{t.contact}</h2>
        <address className={styles.contact}>
          <dl className={styles.factList}>
            {contact.map((item) => (
              <div className={styles.fact} key={item.id}>
                <dt>{pick(item.label, lang)}</dt>
                <dd>
                  <a href={item.href}>{item.text}</a>
                </dd>
              </div>
            ))}
          </dl>
        </address>
        <p>
          <Link href={href("contact", lang)}>{t.seeContact}</Link>
        </p>
      </section>

      <section aria-labelledby="secciones">
        <h2 id="secciones">{t.sections}</h2>
        <ul className={styles.sectionList}>
          {t.list.map((section) => (
            <li key={section.key}>
              <Link className={styles.sectionLink} href={href(section.key, lang)}>
                <span className={styles.sectionLinkTitle}>{section.title}</span>
                <span className={styles.sectionLinkText}>{section.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
