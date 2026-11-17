// Índice del buscador. Se construye a partir de los mismos datos que usan
// las páginas, así cualquier elemento nuevo aparece en la búsqueda sin
// tocar nada aquí.

import { categories } from "./music";
import { hobbies } from "./hobbies";
import { education, experience, references } from "./profile";
import { series } from "./series";
import { videogames } from "./videogames";
import { href, musicCategoryHref, pick } from "../i18n/config";

const sectionNames = {
  es: {
    home: "Sobre mí",
    education: "Formación",
    music: "Música",
    videogames: "Videojuegos",
    series: "Series",
    hobbies: "Hobbies",
    contact: "Contacto",
    help: "Ayuda",
    sitemap: "Mapa del sitio",
  },
  en: {
    home: "About me",
    education: "Education",
    music: "Music",
    videogames: "Video games",
    series: "TV series",
    hobbies: "Hobbies",
    contact: "Contact",
    help: "Help",
    sitemap: "Site map",
  },
};

const pageTexts = {
  es: {
    home: "Presentación, dónde vivo, estudios y contacto de Sergio Riesco Collar.",
    contact: "Correo, GitHub, LinkedIn, Instagram y personas que me avalan.",
    help: "Cómo usar este sitio: menú, buscador, idioma, modo oscuro, teclado y tráileres.",
    sitemap: "Lista de todas las páginas del sitio.",
  },
  en: {
    home: "Introduction, where I live, studies and contact details of Sergio Riesco Collar.",
    contact: "Email, GitHub, LinkedIn, Instagram and references.",
    help: "How to use this site: menu, search, language, dark mode, keyboard and trailers.",
    sitemap: "List of every page on the site.",
  },
};

export function buildIndex(lang) {
  const names = sectionNames[lang];
  const entries = [];

  for (const key of ["home", "contact", "help", "sitemap"]) {
    entries.push({
      section: names[key],
      title: names[key],
      text: pageTexts[lang][key],
      href: href(key, lang),
    });
  }

  for (const item of education) {
    entries.push({
      section: names.education,
      title: pick(item.title, lang),
      text: `${pick(item.center, lang)} · ${item.start} · ${pick(item.status, lang)}`,
      href: href("education", lang),
    });
  }

  for (const job of experience) {
    entries.push({
      section: names.education,
      title: `${pick(job.role, lang)} · ${job.company}`,
      text: pick(job.summary, lang),
      extra: job.tasks.map((task) => pick(task, lang)).join(" ") +
        " " + job.skills.map((skill) => pick(skill, lang)).join(" "),
      href: href("education", lang),
    });
  }

  for (const person of references) {
    entries.push({
      section: names.contact,
      title: person.name,
      text: pick(person.relation, lang),
      href: href("contact", lang),
    });
  }

  for (const category of categories) {
    const name = pick(category.name, lang);
    entries.push({
      section: names.music,
      title: name,
      text: category.bands.map((band) => band.name).join(", "),
      href: musicCategoryHref(category.id, lang),
    });

    for (const band of category.bands) {
      entries.push({
        section: `${names.music} · ${name}`,
        title: band.name,
        text: [band.album, band.snippet?.track].filter(Boolean).join(" · "),
        // v3: con ancla, para llegar directo al grupo dentro del género
        href: `${musicCategoryHref(category.id, lang)}#${band.id}`,
      });
    }
  }

  for (const game of videogames) {
    entries.push({
      section: names.videogames,
      title: game.title,
      text: `${pick(game.genre, lang)} · ${pick(game.description, lang)}`,
      href: href("videogames", lang),
    });
  }

  for (const show of series) {
    entries.push({
      section: names.series,
      title: show.title,
      text: `${pick(show.genre, lang)} · ${show.season} · ${pick(show.description, lang)}`,
      href: href("series", lang),
    });
  }

  for (const hobby of hobbies) {
    entries.push({
      section: names.hobbies,
      title: pick(hobby.title, lang),
      text: pick(hobby.text, lang),
      extra: (hobby.details ?? [])
        .map((detail) => `${pick(detail.label, lang)} ${pick(detail.value, lang)}`)
        .join(" "),
      href: href("hobbies", lang),
    });
  }

  return entries;
}

// Minúsculas y sin tildes: "música" encuentra "Musica" y al revés.
export function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Devuelve las entradas que contienen todas las palabras buscadas,
// primero las que coinciden en el título.
export function search(query, lang) {
  const words = normalize(query).split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  return buildIndex(lang)
    .map((entry) => {
      const title = normalize(entry.title);
      const all = normalize(`${entry.title} ${entry.section} ${entry.text} ${entry.extra ?? ""}`);

      if (!words.every((word) => all.includes(word))) {
        return null;
      }

      const score = words.filter((word) => title.includes(word)).length;
      return { ...entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}
