// Modelo de datos del formulario. Es la misma estructura que el lenguaje
// XML (esquema/sitio.dtd); xml.ts convierte en los dos sentidos.
const seccionVacia = () => ({ titulo: '', introduccion: '', descripcion: '' });
export const sitioVacio = () => ({
    autor: '', idioma: 'es', pie: '', resumen: '', parrafos: '', foto: '',
    datos: [], contactos: [], grupos: [], juegos: [], series: [], aficiones: [],
    secciones: {
        musica: seccionVacia(), videojuegos: seccionVacia(), series: seccionVacia(), aficiones: seccionVacia(),
    },
});
