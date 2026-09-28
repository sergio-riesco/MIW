/**
 * app.mjs -- Logica de la interfaz web de VXML Doctor.
 * -----------------------------------------------------------------------------
 * Carga los tres motores en el NAVEGADOR y muestra sus informes:
 *
 *   - JavaScript      packages/impl-js/vxml-lint.mjs  (referencia)
 *   - TypeScript      packages/impl-ts/lib/vxml-lint.js (compilado a ESM)
 *   - WebAssembly     packages/impl-wasm/lib/vxml_doctor.wasm via fetch
 *
 * Todos dependen del catalogo compartido packages/core/contrato.mjs, que en el
 * navegador recibe reglas.json inyectado en globalThis.__VXML_CATALOGO: por eso
 * el primer paso es descargarlo por HTTP ANTES de importar ningun motor.
 * -----------------------------------------------------------------------------
 */

// --- 0. Catalogo compartido --------------------------------------------------
const respCatalogo = await fetch(new URL("../core/reglas.json", import.meta.url));
if (!respCatalogo.ok) {
  document.body.insertAdjacentHTML("afterbegin", `<p style="color:#b91c1c">No se pudo cargar reglas.json (${respCatalogo.status}).</p>`);
  throw new Error("Sin catalogo no hay motores.");
}
globalThis.__VXML_CATALOGO = await respCatalogo.json();

// --- 1. Motores (carga perezosa) ---------------------------------------------
let motores = null;
async function cargarMotores() {
  if (motores) return motores;
  const [js, ts, wasm] = await Promise.all([
    import("../impl-js/vxml-lint.mjs"),
    import("../impl-ts/lib/vxml-lint.js"),
    import("./cargador-wasm.mjs"),
  ]);
  await wasm.cargarMotorWasm();
  motores = {
    js: { nombre: "JavaScript", analizar: (texto, nombre, bytes) => js.analizarTexto(texto, nombre, bytes) },
    ts: { nombre: "TypeScript", analizar: (texto, nombre, bytes) => ts.analizarTexto(texto, nombre, bytes) },
    wasm: { nombre: "WebAssembly (Rust)", analizar: (texto, nombre, bytes) => wasm.analizarTextoWasm(bytes, nombre) },
  };
  return motores;
}

// --- 2. Referencias DOM ------------------------------------------------------
const $ = (id) => document.getElementById(id);
const texto = $("texto"), estado = $("estado"), cuerpo = $("cuerpo"),
  comparativa = $("comparativa"), tablaComparativa = $("tabla-comparativa"),
  origen = $("origen"), fichero = $("fichero");

// --- 3. Selector de corpus ---------------------------------------------------
try {
  const r = await fetch("/api/corpus");
  if (r.ok) {
    const { ficheros } = await r.json();
    for (const f of ficheros) {
      const op = document.createElement("option");
      op.value = f.ruta;
      op.textContent = `${f.nombre}  (${(f.bytes / 1024).toFixed(1)} KiB)`;
      origen.appendChild(op);
    }
  }
} catch { /* sin API no pasa nada: sigue el pegado manual */ }

let bytesActuales = null; // Uint8Array del documento que se esta analizando

function nombreActual() {
  return origen.value ? origen.value.split("/").pop() : "pegado.vxml";
}

origen.addEventListener("change", async () => {
  if (!origen.value) return;
  estado.textContent = "Cargando " + origen.value + " …";
  try {
    const r = await fetch(origen.value);
    const buf = await r.arrayBuffer();
    texto.value = new TextDecoder().decode(buf);
    bytesActuales = new Uint8Array(buf);
    estado.textContent = "Cargado: " + (buf.byteLength / 1024).toFixed(1) + " KiB.";
    if (bytesActuales.byteLength < 2_500_000) analizar(); // autocarga si no es enorme
    else estado.textContent += " Pulsa «Analizar».";
  } catch (e) {
    estado.textContent = "Error al cargar el fichero: " + e.message;
  }
});

fichero.addEventListener("change", async () => {
  const f = fichero.files?.[0];
  if (!f) return;
  const buf = await f.arrayBuffer();
  texto.value = new TextDecoder().decode(buf);
  bytesActuales = new Uint8Array(buf);
  estado.textContent = "Subido: " + f.name + " (" + (buf.byteLength / 1024).toFixed(1) + " KiB).";
});

texto.addEventListener("input", () => { bytesActuales = null; });

// --- 4. Resaltado del selector de motor --------------------------------------
for (const label of $("motores").querySelectorAll("label")) {
  label.addEventListener("click", () => {
    for (const l of $("motores").querySelectorAll("label")) l.classList.toggle("sel", l === label);
  });
}
$("motores").querySelector('input[value="js"]').parentElement.classList.add("sel");

function motorSeleccionado() {
  return document.querySelector('input[name="motor"]:checked').value;
}

// --- 5. Analisis -------------------------------------------------------------
function obtenerBytes() {
  if (bytesActuales) return bytesActuales;
  return new TextEncoder().encode(texto.value);
}
function obtenerTexto() {
  return bytesActuales ? new TextDecoder().decode(bytesActuales) : texto.value;
}

async function analizar() {
  estado.textContent = "Cargando motor " + motorSeleccionado() + " …";
  comparativa.classList.add("oculto");
  try {
    await cargarMotores();
    const m = motores[motorSeleccionado()];
    const t0 = performance.now();
    const json = m.analizar(obtenerTexto(), nombreActual(), obtenerBytes());
    const ms = performance.now() - t0;
    pintarInforme(JSON.parse(json), ms, m.nombre);
    estado.textContent = `${m.nombre} · ${ms.toFixed(2)} ms · JSON canónico de ${json.length} bytes.`;
  } catch (e) {
    cuerpo.innerHTML = `<p class="vacio">Error: ${String(e.message || e)}</p>`;
    estado.textContent = "Falló el análisis.";
  }
}

function pintarInforme(inf, ms, motor) {
  const chips = `
    <div class="resumen">
      <div class="chip"><b>${inf.bytes}</b>bytes</div>
      <div class="chip"><b>${inf.lineas}</b>líneas</div>
      <div class="chip"><b>${inf.elementos}</b>elementos</div>
      <div class="chip"><b>${inf.estadisticas.formularios}</b>forms</div>
      <div class="chip"><b>${inf.estadisticas.campos}</b>campos</div>
      <div class="chip"><b>${inf.estadisticas.prompts}</b>prompts</div>
      <div class="chip"><b>${inf.estadisticas.saltos}</b>saltos</div>
      <div class="chip"><b>${inf.estadisticas.scripts}</b>scripts</div>
      <div class="chip"><b class="grafo">${inf.grafo.nodos}·${inf.grafo.aristas}·${inf.grafo.ciclos}</b>grafo n/a/c</div>
      <div class="chip"><b class="grafo">${inf.grafo.inalcanzables.length}</b>inaccesibles</div>
      <div class="chip"><b>${inf.diagnosticos.length}</b>diagnósticos</div>
      <div class="chip"><b>${ms.toFixed(2)} ms</b>${motor}</div>
    </div>`;

  const filas = inf.diagnosticos.map((d) => {
    const sev = "sev-" + d.gravedad;
    return `<tr>
      <td class="${sev}">${d.regla}</td>
      <td class="${sev}">${d.gravedad}</td>
      <td>${d.linea}:${d.columna}</td>
      <td>&lt;${escHTML(d.elemento)}&gt;</td>
      <td>${d.detalle ? escHTML(d.detalle) : ""}</td>
      <td>${escHTML(d.mensaje)}</td>
    </tr>`;
  }).join("");

  const forms = inf.formularios.map((f) =>
    `#${escHTML(f.id || "(sin id)")} · línea ${f.linea} · ${f.campos} campos · ` +
    (f.accesible ? "accesible" : "inaccesible")).join(" · ");

  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(inf, null, 2);

  cuerpo.innerHTML = "";
  cuerpo.insertAdjacentHTML("beforeend", chips);
  if (inf.formularios.length) cuerpo.insertAdjacentHTML("beforeend",
    `<h3>Formularios</h3><p class="form-list">${forms}</p>`);
  if (inf.diagnosticos.length) {
    cuerpo.insertAdjacentHTML("beforeend",
      `<h3>Diagnósticos</h3>
       <table><thead><tr><th>Regla</th><th>Gravedad</th><th>Posición</th><th>Elemento</th><th>Detalle</th><th>Mensaje</th></tr></thead>
       <tbody>${filas}</tbody></table>`);
  } else {
    cuerpo.insertAdjacentHTML("beforeend", `<p class="vacio">Sin diagnósticos: el documento cumple las 18 reglas.</p>`);
  }
  cuerpo.insertAdjacentHTML("beforeend", `<h3>Informe canónico (JSON)</h3>`);
  cuerpo.appendChild(pre);
}

/** Escapa texto del documento antes de insertarlo en HTML. */
function escHTML(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// --- 6. Comparativa de los tres motores --------------------------------------
async function comparar() {
  estado.textContent = "Comparando los tres motores …";
  try {
    const textoDoc = obtenerTexto();
    const bytes = obtenerBytes();
    const nombre = nombreActual();
    const tInicio = performance.now();

    await cargarMotores();
    const resultados = {};
    for (const id of ["js", "ts", "wasm"]) {
      const m = motores[id];
      const t0 = performance.now();
      const json = m.analizar(textoDoc, nombre, bytes);
      resultados[id] = { ms: performance.now() - t0, json, bytes: json.length };
    }
    const base = resultados.js;
    const filasComparativa = ["js", "ts", "wasm"].map((id) => {
      const r = resultados[id];
      const igual = r.json === base.json;
      return `<tr>
        <td>${motores[id].nombre}</td>
        <td>${r.ms.toFixed(2)} ms</td>
        <td>${r.bytes} bytes</td>
        <td class="${igual ? "comp-igual" : "comp-error"}">${igual ? "✓ idéntico" : "✗ DIFERENTE"}</td>
      </tr>`;
    }).join("");
    tablaComparativa.innerHTML =
      `<thead><tr><th>Motor</th><th>Tiempo</th><th>JSON</th><th>vs. JS</th></tr></thead><tbody>${filasComparativa}</tbody>`;
    comparativa.classList.remove("oculto");
    pintarInforme(JSON.parse(base.json), base.ms, "comparativa");
    estado.textContent = "Comparativa lista (" + (performance.now() - tInicio).toFixed(1) + " ms total).";
  } catch (e) {
    estado.textContent = "Falló la comparativa: " + String(e.message || e);
  }
}

$("btn-analizar").addEventListener("click", analizar);
$("btn-comparar").addEventListener("click", comparar);
estado.textContent = "Interfaz lista. Elige un documento y pulsa «Analizar».";