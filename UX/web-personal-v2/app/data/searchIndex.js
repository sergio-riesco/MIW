// Índice del buscador. Se construye a partir de los mismos datos que usan
// las páginas, así cualquier elemento nuevo aparece en la búsqueda sin
// tocar nada aquí.

import { categories } from "./music";
import { hobbies } from "./hobbies";
import { education, experience, references } from "./profile";
import { series } from "./series";
import { videogames } from "./videogames";
import { href, musicCategoryHref, pick } from "../i18n/config";

// Nombre de cada sección en los dos idiomas. Sale encima del título de cada
// resultado y también se busca en él.
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

// Descripción de las páginas que no tienen una lista de datos detrás
// (inicio, contacto, ayuda y mapa), para que también se puedan encontrar.
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

// Construye el índice de un idioma ("es" o "en"). Cada entrada es un objeto:
//   section  sección donde está (sale encima del título)
//   title    título del resultado, que es el enlace
//   text     descripción corta que sale debajo del título
//   extra    texto que se busca pero no se muestra (opcional)
//   href     página a la que lleva el resultado, en el idioma pedido
// pick() elige el texto del idioma cuando un dato es un objeto { es, en }.
export function buildIndex(lang) {
  const names = sectionNames[lang];
  const entries = [];

  // Páginas generales
  for (const key of ["home", "contact", "help", "sitemap"]) {
    entries.push({
      section: names[key],
      title: names[key],
      text: pageTexts[lang][key],
      href: href(key, lang),
    });
  }

  // Grado y máster: centro, año de inicio y estado
  for (const item of education) {
    entries.push({
      section: names.education,
      title: pick(item.title, lang),
      text: `${pick(item.center, lang)} · ${item.start} · ${pick(item.status, lang)}`,
      href: href("education", lang),
    });
  }

  // Prácticas. Las tareas y tecnologías van en extra: así "ROS2" encuentra
  // las prácticas aunque no salga en el resultado.
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

  // Personas que me avalan (página de contacto)
  for (const person of references) {
    entries.push({
      section: names.contact,
      title: person.name,
      text: pick(person.relation, lang),
      href: href("contact", lang),
    });
  }

  // Música: una entrada por género (con la lista de sus grupos como texto) y
  // otra por grupo (con el álbum y la canción del fragmento). Los dos llevan
  // a la página del género.
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
        href: musicCategoryHref(category.id, lang),
      });
    }
  }

  // Videojuegos: género y descripción
  for (const game of videogames) {
    entries.push({
      section: names.videogames,
      title: game.title,
      text: `${pick(game.genre, lang)} · ${pick(game.description, lang)}`,
      href: href("videogames", lang),
    });
  }

  // Series: género, temporada y descripción
  for (const show of series) {
    entries.push({
      section: names.series,
      title: show.title,
      text: `${pick(show.genre, lang)} · ${show.season} · ${pick(show.description, lang)}`,
      href: href("series", lang),
    });
  }

  // Aficiones. Los detalles (etiqueta y valor) van en extra.
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
// normalize("NFD") separa cada letra de su acento ("é" pasa a "e" + acento) y
// la expresión regular borra los acentos (rango Unicode U+0300 a U+036F).
export function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Devuelve las entradas que contienen todas las palabras buscadas,
// primero las que coinciden en el título.
export function search(query, lang) {
  // Separa la búsqueda en palabras; filter(Boolean) quita las vacías que
  // quedan si hay varios espacios seguidos.
  const words = normalize(query).split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  return buildIndex(lang)
    .map((entry) => {
      const title = normalize(entry.title);
      // Todo el texto de la entrada junto, para buscar en cualquier campo
      const all = normalize(`${entry.title} ${entry.section} ${entry.text} ${entry.extra ?? ""}`);

      // Tienen que estar todas las palabras. includes() acepta trozos de
      // palabra: "zeld" encuentra "Zelda".
      if (!words.every((word) => all.includes(word))) {
        return null;
      }

      // Un punto por cada palabra que está en el título
      const score = words.filter((word) => title.includes(word)).length;
      return { ...entry, score };
    })
    .filter(Boolean)
    // De más a menos puntos. sort() es estable: los empates se quedan en el
    // orden del índice.
    .sort((a, b) => b.score - a.score);
}
