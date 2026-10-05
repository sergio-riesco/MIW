// lista-corpus.mjs -- escribe corpus/lista.json con los .vxml del corpus.
// La interfaz lee de ahi el desplegable de documentos; asi funciona tambien
// en un hosting estatico como GitHub Pages, sin servidor.
//
// Se lanza solo con npm run corpus.
import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const ficheros = [];
for (const dir of ["corpus", "corpus/grande"]) {
  if (!existsSync(join(raiz, dir))) continue;
  for (const f of readdirSync(join(raiz, dir)).filter((x) => x.endsWith(".vxml")).sort()) {
    const ruta = `${dir}/${f}`;
    ficheros.push({ nombre: f, ruta, bytes: statSync(join(raiz, ruta)).size });
  }
}

writeFileSync(join(raiz, "corpus", "lista.json"), JSON.stringify({ ficheros }, null, 2) + "\n");
console.log(`corpus/lista.json: ${ficheros.length} documentos.`);
