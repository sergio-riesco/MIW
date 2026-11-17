// /sitemap.xml para los buscadores, con cada página en los dos idiomas.
import { categories } from "./data/music";
import { LAST_UPDATED, musicCategoryHref, routes, SITE_URL } from "./i18n/config";

export default function sitemap() {
  const pages = Object.keys(routes)
    .filter((key) => key !== "search")
    .map((key) => routes[key]);

  for (const category of categories) {
    pages.push({ es: musicCategoryHref(category.id, "es"), en: musicCategoryHref(category.id, "en") });
  }

  return pages.flatMap((page) =>
    ["es", "en"].map((lang) => ({
      url: SITE_URL + page[lang],
      lastModified: LAST_UPDATED,
      alternates: {
        languages: { es: SITE_URL + page.es, en: SITE_URL + page.en },
      },
    })),
  );
}
