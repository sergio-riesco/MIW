// Modelo de datos del formulario. Se serializa a XML (xml.ts).
export interface Par { etiqueta: string; texto: string; enlace: string }
export interface Grupo { categoria: string; nombre: string; album: string; imagen: string; favorito: boolean }
export interface Juego { titulo: string; genero: string; descripcion: string; imagen: string; actual: boolean; favorito: boolean }
export interface Serie { titulo: string; genero: string; anio: string; descripcion: string; imagen: string; actual: boolean; favorita: boolean }
export interface Aficion { titulo: string; texto: string; imagen: string }

export interface Seccion { introduccion: string; descripcion: string }
export type ClaveSeccion = 'musica' | 'videojuegos' | 'series' | 'aficiones';

export interface Sitio {
  autor: string; idioma: string; resumen: string; parrafos: string; foto: string;
  datos: Par[]; contactos: Par[]; grupos: Grupo[]; juegos: Juego[]; series: Serie[]; aficiones: Aficion[];
  secciones: Record<ClaveSeccion, Seccion>;
}

export const sitioVacio = (): Sitio => ({
  autor: '', idioma: 'es', resumen: '', parrafos: '', foto: '',
  datos: [], contactos: [], grupos: [], juegos: [], series: [], aficiones: [],
  secciones: {
    musica: { introduccion: '', descripcion: '' }, videojuegos: { introduccion: '', descripcion: '' },
    series: { introduccion: '', descripcion: '' }, aficiones: { introduccion: '', descripcion: '' },
  },
});
