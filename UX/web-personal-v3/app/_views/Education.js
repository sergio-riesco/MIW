import Breadcrumb from "../components/Breadcrumb";
import { education, experience } from "../data/profile";
import { dictionaries } from "../i18n/dictionaries";
import { formatDate, href, pageMetadata, pick } from "../i18n/config";
import styles from "./pages.module.css";

const text = {
  es: {
    title: "Formación y experiencia",
    navTitle: "Formación",
    description:
      "Formación académica y experiencia de Sergio Riesco Collar: Grado en Ingeniería Informática del Software, Máster en Ingeniería Web y prácticas de robótica en Mecalux.",
    home: "Sobre mí",
    lead: "Mis estudios en la Universidad de Oviedo y mis prácticas en Mecalux Software Solutions.",
    education: "Formación",
    experience: "Experiencia",
    now: "actualidad",
    whatIDid: "Qué hice",
    tech: "Tecnologías",
  },
  en: {
    title: "Education and experience",
    navTitle: "Education",
    description:
      "Education and experience of Sergio Riesco Collar: Bachelor's Degree in Software Engineering, Master's Degree in Web Engineering and a robotics internship at Mecalux.",
    home: "About me",
    lead: "My studies at the University of Oviedo and my internship at Mecalux Software Solutions.",
    education: "Education",
    experience: "Experience",
    now: "present",
    whatIDid: "What I did",
    tech: "Technologies",
  },
};

export function metadata(lang) {
  const t = text[lang];
  return pageMetadata({ key: "education", lang, title: t.navTitle, description: t.description });
}

// Fecha en <time>: solo el año (2022) o el día completo (2026-03-02).
function DateText({ value, lang, fallback }) {
  if (!value) {
    return fallback;
  }
  const label = value.length === 4 ? value : formatDate(value, lang);
  return <time dateTime={value}>{label}</time>;
}

export default function Education({ lang }) {
  const t = text[lang];

  return (
    <main className="container page" id="contenido" data-section="education">
      <header className="page-header">
        <Breadcrumb
          label={dictionaries[lang].breadcrumb}
          items={[{ label: t.home, href: href("home", lang) }, { label: t.navTitle }]}
        />
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </header>

      <section aria-labelledby="formacion">
        <h2 id="formacion">{t.education}</h2>
        <ol className={styles.timeline}>
          {education.map((item) => (
            <li key={item.id}>
              <article className={styles.entry}>
                <p className={styles.dates}>
                  <DateText value={item.start} lang={lang} /> –{" "}
                  <DateText value={item.end} lang={lang} fallback={t.now} />
                </p>
                <h3>{pick(item.title, lang)}</h3>
                <p className={styles.meta}>
                  {pick(item.center, lang)} · <strong>{pick(item.status, lang)}</strong>
                </p>
                <p>{pick(item.text, lang)}</p>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="experiencia">
        <h2 id="experiencia">{t.experience}</h2>
        <ol className={styles.timeline}>
          {experience.map((job) => (
            <li key={job.id}>
              <article className={styles.entry}>
                <p className={styles.dates}>
                  <DateText value={job.start} lang={lang} /> –{" "}
                  <DateText value={job.end} lang={lang} fallback={t.now} />
                </p>
                <h3>{pick(job.role, lang)}</h3>
                <p className={styles.meta}>{job.company}</p>
                <p>{pick(job.summary, lang)}</p>

                <h4>{t.whatIDid}</h4>
                <ul className={styles.bullets}>
                  {job.tasks.map((task, index) => (
                    <li key={index}>{pick(task, lang)}</li>
                  ))}
                </ul>

                <h4>{t.tech}</h4>
                <ul className={styles.tags}>
                  {job.skills.map((skill) => {
                    const label = pick(skill, lang);
                    return <li key={label}>{label}</li>;
                  })}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
