// JS de los sitios generados: botón de tema y ventana de los tráileres.
// Sin él el sitio funciona igual, solo sin esas dos cosas.
(function () {
  "use strict";

  // Tema: lo guardado en localStorage o, si no hay nada, el del sistema.
  var raiz = document.documentElement;
  var botonTema = document.getElementById("tema");

  function oscuro() {
    var t = raiz.dataset.theme;
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function pintarBoton() {
    var o = oscuro();
    botonTema.textContent = o ? "☀" : "☾";
    botonTema.setAttribute("aria-label", o ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    botonTema.setAttribute("aria-pressed", String(o));
  }

  if (botonTema) {
    botonTema.addEventListener("click", function () {
      var nuevo = oscuro() ? "light" : "dark";
      raiz.dataset.theme = nuevo;
      try { localStorage.setItem("tema", nuevo); } catch (e) { /* sin localStorage */ }
      pintarBoton();
    });
    pintarBoton();
  }

  // Tráileres: cada portada con vídeo tiene un botón con data-trailer. El
  // <video> se crea al abrir y se quita al cerrar, así no se baja antes de
  // tiempo y deja de sonar.
  var ventana = document.getElementById("ventana-trailer");
  if (!ventana || typeof ventana.showModal !== "function") return;

  var titulo = document.getElementById("ventana-titulo");
  var hueco = ventana.querySelector(".ventana-video");

  function vaciar() {
    hueco.replaceChildren();
  }

  function cerrar() {
    vaciar();
    if (ventana.open) ventana.close();
  }

  function abrir(src, nombre) {
    titulo.textContent = nombre;
    var video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.addEventListener("error", function () {
      var aviso = document.createElement("p");
      aviso.className = "ventana-error";
      aviso.setAttribute("role", "alert");
      aviso.textContent = "No se ha podido cargar el tráiler.";
      hueco.replaceChildren(aviso);
    });
    hueco.replaceChildren(video);
    ventana.showModal();
  }

  document.querySelectorAll("[data-trailer]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      abrir(boton.dataset.trailer, boton.dataset.titulo);
    });
  });

  ventana.querySelector(".cerrar").addEventListener("click", cerrar);
  // con Escape el navegador lanza "close"
  ventana.addEventListener("close", vaciar);
  // clic fuera = cerrar
  ventana.addEventListener("click", function (e) {
    if (e.target === ventana) cerrar();
  });
})();
