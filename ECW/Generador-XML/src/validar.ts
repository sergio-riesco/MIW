// Comprueba el formulario antes de crear el XML: los campos #REQUIRED del DTD
// y los tipos del XSD (año e idioma). El navegador no sabe validar contra un
// XSD sin librerías, así que lo hago a mano.
import type { Sitio } from './model.js';

// xs:language: es, en, es-ES...
const IDIOMA = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/;

// xs:gYear: 4 cifras o más (puede llevar zona horaria)
const ANIO = /^-?\d{4,}(Z|[+-]\d{2}:\d{2})?$/;

const vacio = (s: string) => s.trim() === '';

/** Lista de errores (vacía si está todo bien). */
export function validarSitio(s: Sitio): string[] {
  const errores: string[] = [];
  const falta = (que: string) => errores.push(`Falta ${que}.`);

  if (vacio(s.autor)) falta('el nombre del autor');
  if (!vacio(s.idioma) && !IDIOMA.test(s.idioma.trim())) {
    errores.push(`El idioma «${s.idioma}» no es un código de idioma válido (por ejemplo es, en o es-ES).`);
  }

  s.datos.forEach((d, i) => { if (vacio(d.etiqueta)) falta(`la etiqueta del dato ${i + 1}`); });
  s.contactos.forEach((c, i) => {
    if (vacio(c.etiqueta)) falta(`la etiqueta del contacto ${i + 1}`);
    if (vacio(c.enlace)) falta(`el enlace del contacto ${i + 1}`);
  });

  s.grupos.forEach((g, i) => { if (vacio(g.nombre)) falta(`el nombre del grupo ${i + 1}`); });
  s.juegos.forEach((j, i) => { if (vacio(j.titulo)) falta(`el título del videojuego ${i + 1}`); });
  s.series.forEach((e, i) => {
    const nombre = vacio(e.titulo) ? `la serie ${i + 1}` : `«${e.titulo}»`;
    if (vacio(e.titulo)) falta(`el título de la serie ${i + 1}`);
    if (!vacio(e.anio) && !ANIO.test(e.anio.trim())) {
      errores.push(`El año de ${nombre} («${e.anio}») no es un año válido (por ejemplo 2019).`);
    }
  });
  s.aficiones.forEach((a, i) => { if (vacio(a.titulo)) falta(`el título de la afición ${i + 1}`); });

  return errores;
}
