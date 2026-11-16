// Icono + texto alineados de verdad: centrados en vertical y con un hueco fijo entre ellos.
// Antes se escribía "<Icono/> texto" y el hueco dependía del espacio de la fuente (0-3 px) y el icono
// quedaba apoyado en la línea base, un poco más bajo o más alto que el texto.
// small: hueco de 4px para textos pequeños (etiquetas, valoraciones); por defecto 6px.
let IconTextComponent = ({ icon, children, small = false, className = "", style }) => (
    <span className={"icon-text" + (small ? " icon-text-sm" : "") + (className ? " " + className : "")} style={style}>
        {icon}
        <span className="icon-text-label">{children}</span>
    </span>
)

export default IconTextComponent;
