import { existsSync } from "node:fs";
import path from "node:path";

// Subtítulos de los tráileres. Para un vídeo
//   public/media/videos/series/breaking-bad.mp4
// se buscan
//   public/media/subtitles/series/breaking-bad.es.vtt
//   public/media/subtitles/series/breaking-bad.en.vtt
// y solo se añaden las pistas que existen. Se ejecuta en el servidor (al
// compilar), nunca en el navegador.
const trackLabels = {
  es: { es: "Español", en: "Spanish" },
  en: { es: "Inglés", en: "English" },
};

export function subtitleTracks(videoSrc, pageLang) {
  if (!videoSrc) {
    return [];
  }

  const base = videoSrc.replace("/media/videos/", "/media/subtitles/").replace(/\.mp4$/, "");

  // Primero la pista del idioma de la página: es la que sale activada.
  const order = pageLang === "en" ? ["en", "es"] : ["es", "en"];

  return order
    .map((lang) => ({
      lang,
      src: `${base}.${lang}.vtt`,
      label: trackLabels[lang][pageLang],
    }))
    .filter((track) => existsSync(path.join(process.cwd(), "public", track.src)));
}
