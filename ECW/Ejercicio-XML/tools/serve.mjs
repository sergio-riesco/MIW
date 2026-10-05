// serve.mjs -- servidor estatico para la interfaz web.
// Sirve la carpeta tal cual, como lo haria GitHub Pages: / abre index.html,
// que lleva a packages/ui/.
//
// Uso: node tools/serve.mjs [puerto]
// Si el puerto esta ocupado (o Windows lo tiene reservado, que da EACCES en
// lugar de EADDRINUSE) prueba con el siguiente.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname, extname, normalize, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));

// 5173 no cae en los rangos que reserva Hyper-V en Windows
const PUERTO_POR_DEFECTO = 5173;

// cuantos puertos probar como mucho
const INTENTOS_PUERTO = 20;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".vxml": "application/voicexml+xml; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

async function enviar(raiz, res, rutaRel) {
  const ruta = normalize(join(raiz, rutaRel));
  if (!ruta.startsWith(raiz + sep) && ruta !== raiz) {
    res.writeHead(403).end("Fuera de la raiz.");
    return;
  }
  try {
    const data = await readFile(ruta);
    res.writeHead(200, {
      "Content-Type": MIME[extname(ruta).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 — " + rutaRel);
  }
}

// crea el servidor (sin ponerlo a escuchar)
export function crearServidor(raizProyecto) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    let ruta = decodeURIComponent(url.pathname);

    if (ruta.endsWith("/")) ruta += "index.html";

    await enviar(raizProyecto, res, ruta.slice(1));
    console.log(new Date().toISOString().slice(11, 19), req.method, req.url);
  });
}

// arranca y devuelve { servidor, puerto }
export function arrancar(raizProyecto, puerto = PUERTO_POR_DEFECTO) {
  const servidor = crearServidor(raizProyecto);
  const primero = puerto;
  return new Promise((resolve, reject) => {
    servidor.on("error", reintentar);
    servidor.listen(puerto, () => {
      servidor.removeListener("error", reintentar);
      resolve({ servidor, puerto: servidor.address().port });
    });

    // con puerto 0 el sistema elige uno libre, no hay que reintentar
    function reintentar(err) {
      const recuperable = err.code === "EACCES" || err.code === "EADDRINUSE";
      if (!recuperable || puerto === 0 || puerto - primero >= INTENTOS_PUERTO) {
        return reject(
          new Error(
            `No se pudo escuchar en el puerto ${puerto} (${err.code}). ` +
              (recuperable
                ? `Prueba con otro: node tools/serve.mjs <puerto>  (en Windows, ` +
                  `netsh interface ipv4 show excludedportrange protocol=tcp lista los reservados).`
                : err.message)
          )
        );
      }
      puerto += 1;
      console.warn(`Puerto ${puerto - 1} no disponible (${err.code}); probando ${puerto}...`);
      servidor.listen(puerto);
    }
  });
}

// si se ejecuta directamente con node
const directo = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (directo) {
  const raiz = join(aqui, "..");
  const puerto = Number(process.argv[2] || process.env.PORT || PUERTO_POR_DEFECTO);
  try {
    const { servidor } = await arrancar(raiz, puerto);
    console.log(`VXML Doctor UI en http://localhost:${servidor.address().port}/  (raiz: ${raiz})`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}