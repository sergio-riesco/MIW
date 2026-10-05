// Datos del formulario. Misma estructura que el XML; xml.ts pasa de uno a otro.
// los colores que admite el atributo tono del DTD
export const TONOS = ['verde', 'rojo', 'morado', 'azul', 'ambar'];
// "Mi ruta: de casa al Rinconín" -> { etiqueta, valor }. Sin ":" la etiqueta queda vacía.
export function leerDatos(texto) {
    return texto.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
        const i = l.indexOf(':');
        return i < 0 ? { etiqueta: '', valor: l } : { etiqueta: l.slice(0, i).trim(), valor: l.slice(i + 1).trim() };
    });
}
const seccionVacia = () => ({ titulo: '', introduccion: '', descripcion: '' });
export const sitioVacio = () => ({
    autor: '', idioma: 'es', pie: '', resumen: '', parrafos: '', foto: '',
    datos: [], contactos: [], grupos: [], juegos: [], series: [], aficiones: [],
    secciones: {
        musica: seccionVacia(), videojuegos: seccionVacia(), series: seccionVacia(), aficiones: seccionVacia(),
    },
});
