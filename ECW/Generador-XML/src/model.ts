// Modelo de datos del formulario. Es la misma estructura que el lenguaje
// XML (esquema/sitio.dtd); xml.ts convierte en los dos sentidos.

/** Dato personal o forma de contacto del perfil. */
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

export interface Aficion { titulo: string; texto: string; imagen: string; enlace: string; textoEnlace: string }

/** Atributos comunes de las cuatro secciones. */
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
