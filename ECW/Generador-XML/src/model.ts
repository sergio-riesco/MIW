// Datos del formulario. Misma estructura que el XML; xml.ts pasa de uno a otro.

/** Dato o contacto del perfil. */
export interface Par { etiqueta: string; texto: string; detalle: string; enlace: string }

export interface Grupo {
  categoria: string; nombre: string; album: string; imagen: string;
  fragmento: string; cancion: string; favorito: boolean;
}

export interface Juego {
  titulo: string; genero: string; descripcion: string; imagen: string; trailer: string;
  actual: boolean; favorito: boolean;
}

export interface Serie {
  titulo: string; genero: string; anio: string; descripcion: string; imagen: string; trailer: string;
  actual: boolean; favorita: boolean;
}

// datos: uno por línea, "Etiqueta: valor" (se convierten en <dato>)
export interface Aficion {
  titulo: string; texto: string; imagen: string; tono: string; datos: string;
  enlace: string; textoEnlace: string;
}

// los colores que admite el atributo tono del DTD
export const TONOS = ['verde', 'rojo', 'morado', 'azul', 'ambar'] as const;

// "Mi ruta: de casa al Rinconín" -> { etiqueta, valor }. Sin ":" la etiqueta queda vacía.
export function leerDatos(texto: string): { etiqueta: string; valor: string }[] {
  return texto.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf(':');
    return i < 0 ? { etiqueta: '', valor: l } : { etiqueta: l.slice(0, i).trim(), valor: l.slice(i + 1).trim() };
  });
}

/** Lo que comparten las cuatro secciones. */
export interface Seccion { titulo: string; introduccion: string; descripcion: string }
export type ClaveSeccion = 'musica' | 'videojuegos' | 'series' | 'aficiones';

export interface Sitio {
  autor: string; idioma: string; pie: string;
  resumen: string; parrafos: string; foto: string;
  datos: Par[]; contactos: Par[];
  grupos: Grupo[]; juegos: Juego[]; series: Serie[]; aficiones: Aficion[];
  secciones: Record<ClaveSeccion, Seccion>;
}

const seccionVacia = (): Seccion => ({ titulo: '', introduccion: '', descripcion: '' });

export const sitioVacio = (): Sitio => ({
  autor: '', idioma: 'es', pie: '', resumen: '', parrafos: '', foto: '',
  datos: [], contactos: [], grupos: [], juegos: [], series: [], aficiones: [],
  secciones: {
    musica: seccionVacia(), videojuegos: seccionVacia(), series: seccionVacia(), aficiones: seccionVacia(),
  },
});
