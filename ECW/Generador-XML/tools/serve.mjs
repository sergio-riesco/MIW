// serve.mjs -- servidor estatico para probar la interfaz y los sitios.
//   http://localhost:5174/                  interfaz (app/)
//   http://localhost:5174/sitios/<nombre>/  sitios generados
// Acepta peticiones Range, que es lo que usa el navegador para moverse por
// los videos.
//
// Uso: node tools/serve.mjs [puerto]
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const puerto = Number(process.argv[2] || process.env.PORT || 5174);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".xml": "application/xml; charset=utf-8",
  ".dtd": "application/xml-dtd; charset=utf-8",
  ".xsd": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".txt": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (ruta === "/") {
    res.writeHead(302, { Location: "/app/" }).end();
    return;
  }
  if (ruta.endsWith("/")) ruta += "index.html";

  const archivo = normalize(join(raiz, ruta));
  if (!archivo.startsWith(raiz + sep)) {
    res.writeHead(403).end("Fuera del proyecto.");
    return;
  }

  let info;
  try {
    info = await stat(archivo);
    if (!info.isFile()) throw new Error();
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("No encontrado: " + ruta);
    return;
  }

  const cabeceras = {
    "Content-Type": MIME[extname(archivo).toLowerCase()] || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  };

  // Range: bytes=inicio-fin
  const rango = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (rango) {
    const inicio = rango[1] ? Number(rango[1]) : info.size - Number(rango[2]);
    const fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), info.size - 1) : info.size - 1;
    if (inicio > fin || inicio >= info.size) {
      res.writeHead(416, { "Content-Range": `bytes */${info.size}` }).end();
      return;
    }
    res.writeHead(206, {
      ...cabeceras,
      "Content-Range": `bytes ${inicio}-${fin}/${info.size}`,
      "Content-Length": fin - inicio + 1,
    });
    createReadStream(archivo, { start: inicio, end: fin }).pipe(res);
    return;
  }

  res.writeHead(200, { ...cabeceras, "Content-Length": info.size });
  createReadStream(archivo).pipe(res);
}).listen(puerto, () => {
  console.log(`Generador:        http://localhost:${puerto}/`);
  console.log(`Sitios generados: http://localhost:${puerto}/sitios/<nombre>/`);
});
