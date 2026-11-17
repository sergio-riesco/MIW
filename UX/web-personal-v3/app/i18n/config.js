// Idiomas, rutas de cada página en cada idioma y utilidades de traducción.
// El español va en la raíz (/musica) y el inglés bajo /en (/en/music).

export const languages = ["es", "en"];

export const SITE_URL = "https://miw-five.vercel.app";

// Cambiar esta fecha cada vez que se actualice el contenido del sitio.
export const LAST_UPDATED = "2026-11-12";

export const routes = {
  home: { es: "/", en: "/en" },
  education: { es: "/formacion", en: "/en/education" },
  music: { es: "/musica", en: "/en/music" },
  videogames: { es: "/videojuegos", en: "/en/videogames" },
  series: { es: "/series", en: "/en/series" },
  hobbies: { es: "/hobbies", en: "/en/hobbies" },
  contact: { es: "/contacto", en: "/en/contact" },
  search: { es: "/buscar", en: "/en/search" },
  sitemap: { es: "/mapa", en: "/en/sitemap" },
  help: { es: "/ayuda", en: "/en/help" },
};

export function href(key, lang) {
  return routes[key][lang];
}

export function musicCategoryHref(id, lang) {
  return `${routes.music[lang]}/${id}`;
}

// Los textos de los datos pueden ser una cadena (igual en los dos idiomas)
// o un objeto { es, en }.
export function pick(value, lang) {
  if (value && typeof value === "object" && !Array.isArray(value) && "es" in value) {
    return value[lang] ?? value.es;
  }
  return value;
}

function stripSlash(path) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

// Ruta equivalente de la página actual en el otro idioma.
export function alternatePath(pathname, to) {
  const from = to === "en" ? "es" : "en";
  const path = stripSlash(pathname || "/");

  for (const key of Object.keys(routes)) {
    if (routes[key][from] === path) {
      return routes[key][to];
    }
  }

  const musicBase = routes.music[from] + "/";
  if (path.startsWith(musicBase)) {
    return routes.music[to] + "/" + path.slice(musicBase.length);
  }

  return routes.home[to];
}

// Clave de la sección de la ruta (para marcar el menú).
export function sectionOf(pathname, lang) {
  const path = stripSlash(pathname || "/");
  let match = null;

  for (const key of Object.keys(routes)) {
    const route = routes[key][lang];
    if (path === route || (key !== "home" && path.startsWith(route + "/"))) {
      match = key;
    }
  }

  return match;
}

// title y description de una página, con la URL canónica y la del otro idioma.
export function pageMetadata({ key, lang, title, description, path }) {
  const own = path ?? routes[key][lang];
  const other = lang === "es" ? "en" : "es";
  const otherPath = path ? alternatePath(path, other) : routes[key][other];

  return {
    title,
    description,
    alternates: {
      canonical: own,
      languages: { [lang]: own, [other]: otherPath },
    },
  };
}

export function formatDate(iso, lang, options = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(iso));
}
