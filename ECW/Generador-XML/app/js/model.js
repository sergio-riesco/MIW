// Datos del formulario. Misma estructura que el XML; xml.ts pasa de uno a otro.
const seccionVacia = () => ({ titulo: '', introduccion: '', descripcion: '' });
export const sitioVacio = () => ({
    autor: '', idioma: 'es', pie: '', resumen: '', parrafos: '', foto: '',
    datos: [], contactos: [], grupos: [], juegos: [], series: [], aficiones: [],
    secciones: {
        musica: seccionVacia(), videojuegos: seccionVacia(), series: seccionVacia(), aficiones: seccionVacia(),
    },
});
