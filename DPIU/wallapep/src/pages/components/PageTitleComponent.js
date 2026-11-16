import { Typography } from 'antd';
import IconTextComponent from "./IconTextComponent";

const { Title } = Typography;

// Título de cada vista con un icono delante, para saber siempre en qué parte del sitio estamos.
// El margen va en el contenedor (no en el título) para que la acción de la derecha quede centrada con él.
let PageTitleComponent = ({ icon, title, extra }) => {
    return (
        <div className="page-title">
            <Title level={2} style={{ margin: 0 }}><IconTextComponent icon={icon}>{title}</IconTextComponent></Title>
            {extra}
        </div>
    )
}

export default PageTitleComponent;
