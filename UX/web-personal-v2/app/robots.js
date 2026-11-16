// /robots.txt: todo se puede indexar y se indica dónde está el sitemap.
import { SITE_URL } from "./i18n/config";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
