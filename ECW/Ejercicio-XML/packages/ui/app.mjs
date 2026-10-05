// app.mjs -- interfaz web de VXML Doctor.
//
// Carga los tres motores en el navegador:
//   JavaScript   packages/impl-js/vxml-lint.mjs
//   TypeScript   packages/impl-ts/lib/vxml-lint.js (ya compilado)
//   WebAssembly  packages/impl-wasm/lib/vxml_doctor.wasm (con fetch)
//
// El contrato necesita el catalogo de reglas en globalThis.__VXML_CATALOGO, asi
// que lo primero es descargar reglas.json, antes de importar ningun motor.

// --- Catalogo ---
const respCatalogo = await fetch(new URL("../core/reglas.json", import.meta.url));
if (!respCatalogo.ok) {
  document.body.insertAdjacentHTML("afterbegin", `<p style="color:#b91c1c">No se pudo cargar reglas.json (${respCatalogo.status}).</p>`);
  throw new Error("Sin catalogo no hay motores.");
}
globalThis.__VXML_CATALOGO = await respCatalogo.json();
// id -> regla: los motores solo dan el id (VXML004); el nombre, el resumen
// y la norma se sacan del catalogo.
const REGLAS_POR_ID = new Map(globalThis.__VXML_CATALOGO.reglas.map((r) => [r.id, r]));

// --- Motores (se cargan al usarlos) ---
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

// --- DOM ---
const $ = (id) => document.getElementById(id);
const texto = $("texto"), estado = $("estado"), cuerpo = $("cuerpo"),
  comparativa = $("comparativa"), tablaComparativa = $("tabla-comparativa"),
  origen = $("origen"), fichero = $("fichero");

// --- Selector de documento ---
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

// --- Selector de motor ---
for (const label of $("motores").querySelectorAll("label")) {
  label.addEventListener("click", () => {
    for (const l of $("motores").querySelectorAll("label")) l.classList.toggle("sel", l === label);
  });
}
$("motores").querySelector('input[value="js"]').parentElement.classList.add("sel");

function motorSeleccionado() {
  return document.querySelector('input[name="motor"]:checked').value;
}

// --- Analisis ---
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
    estado.textContent = `${m.nombre} · ${ms.toFixed(2)} ms · JSON canónico de ${new TextEncoder().encode(json).length} bytes.`;
  } catch (e) {
    cuerpo.innerHTML = `<p class="vacio">Error: ${escHTML(String(e.message || e))}</p>`;
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

  const conteo = { error: 0, warning: 0, info: 0 };
  for (const d of inf.diagnosticos) conteo[d.gravedad] = (conteo[d.gravedad] || 0) + 1;

  const filas = inf.diagnosticos.map((d) => {
    const r = REGLAS_POR_ID.get(d.regla);
    const ayuda = r ? `${r.resumen} — ${r.norma}` : "";
    return `<tr class="diag" data-gravedad="${d.gravedad}"${r ? ` title="${escHTML(ayuda)}"` : ""}>
      <td class="mono nowrap">${escHTML(d.regla)}${r ? `<span class="sub">${escHTML(r.nombre)}</span>` : ""}</td>
      <td><span class="marca sev-${d.gravedad}">${d.gravedad}</span></td>
      <td class="num mono">${d.linea}:${d.columna}</td>
      <td class="mono nowrap">&lt;${escHTML(d.elemento)}&gt;</td>
      <td class="mono">${d.detalle ? escHTML(d.detalle) : '<span class="vacio">—</span>'}</td>
      <td>${escHTML(d.mensaje)}</td>
    </tr>`;
  }).join("");

  const filasForms = inf.formularios.map((f, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="mono">${f.id ? escHTML(f.id) : '<span class="vacio">sin id</span>'}</td>
      <td class="num">${f.linea}</td>
      <td class="num">${f.campos}</td>
      <td><span class="marca ${f.accesible ? "marca-si" : "marca-no"}">${f.accesible ? "accesible" : "inaccesible"}</span></td>
    </tr>`).join("");

  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(inf, null, 2);

  cuerpo.innerHTML = "";
  cuerpo.insertAdjacentHTML("beforeend", chips);
  if (inf.formularios.length) {
    const muertos = inf.formularios.filter((f) => !f.accesible).length;
    cuerpo.insertAdjacentHTML("beforeend",
      `<h3>Formularios <span class="contador">${inf.formularios.length}</span></h3>
       <div class="tabla-scroll">
         <table>
           <thead><tr><th>#</th><th>id</th><th>Línea</th><th>Campos</th><th>Flujo</th></tr></thead>
           <tbody>${filasForms}</tbody>
         </table>
       </div>
       <p class="nota">«Accesible» = el primer &lt;form&gt; del documento o el destino de algún
       <code>&lt;goto next="#id"&gt;</code>. Inaccesibles: <b>${muertos}</b> (VXML002).</p>`);
  }
  if (inf.diagnosticos.length) {
    const severidades = ["error", "warning", "info"];
    const botones = [`<button type="button" class="filtro sel" data-filtro="todas">Todos <b>${inf.diagnosticos.length}</b></button>`]
      .concat(severidades.map((g) => `<button type="button" class="filtro sev-${g}" data-filtro="${g}"${conteo[g] ? "" : " disabled"}>${g} <b>${conteo[g] || 0}</b></button>`))
      .join("");
    cuerpo.insertAdjacentHTML("beforeend",
      `<h3>Diagnósticos <span class="contador">${inf.diagnosticos.length}</span></h3>
       <div class="filtros" role="group" aria-label="Filtrar diagnósticos por gravedad">${botones}</div>
       <div class="tabla-scroll">
         <table class="tabla-diag">
           <colgroup><col style="width:8rem"><col style="width:5rem"><col style="width:4.5rem"><col style="width:7rem"><col style="width:7rem"><col></colgroup>
           <thead><tr><th>Regla</th><th>Gravedad</th><th>Posición</th><th>Elemento</th><th>Detalle</th><th>Mensaje</th></tr></thead>
           <tbody>${filas}</tbody>
         </table>
       </div>
       <p class="vacio oculto" id="diag-vacio">Ningún diagnóstico con ese filtro.</p>
       <p class="nota">Cada fila indica el identificador de regla y su nombre técnico; pasa el ratón
       por la regla para leer el resumen y la norma de VoiceXML que la motiva.</p>`);
    conectarFiltrosDiagnosticos();
  } else {
    cuerpo.insertAdjacentHTML("beforeend", `<p class="vacio">Sin diagnósticos: el documento cumple las 18 reglas.</p>`);
  }
  cuerpo.insertAdjacentHTML("beforeend", `<h3>Informe canónico (JSON)</h3>`);
  cuerpo.appendChild(pre);
}

// Escapa para meterlo en el HTML (tambien comillas, por si va en un atributo).
function escHTML(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML.replace(/"/g, "&quot;");
}

// Filtra por gravedad ocultando filas, sin volver a pintar la tabla.
function conectarFiltrosDiagnosticos() {
  const filasDiag = cuerpo.querySelectorAll("tr.diag");
  const aviso = $("diag-vacio");
  for (const boton of cuerpo.querySelectorAll(".filtro")) {
    boton.addEventListener("click", () => {
      const filtro = boton.dataset.filtro;
      let visibles = 0;
      for (const f of filasDiag) {
        const ver = filtro === "todas" || f.dataset.gravedad === filtro;
        f.classList.toggle("oculto", !ver);
        if (ver) visibles++;
      }
      for (const b of cuerpo.querySelectorAll(".filtro")) b.classList.toggle("sel", b === boton);
      if (aviso) aviso.classList.toggle("oculto", visibles > 0);
    });
  }
}

// --- Comparar los tres ---
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