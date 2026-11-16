import { Typography } from 'antd';
import IconTextComponent from "./IconTextComponent";

const { Title, Text } = Typography;

// Cabecera de sección única para toda la aplicación (home, perfil, detalle...):
// título a la izquierda, contador opcional y acción opcional ("See all") a la derecha.
let SectionTitleComponent = ({ icon, title, count, extra }) => {
    return (
        <div className="section-title">
            <Title level={4} style={{ margin: 0 }}>
                <IconTextComponent icon={icon}>
                    {title}{count != null && <>{" "}<Text type="secondary" className="section-title-count">({count})</Text></>}
                </IconTextComponent>
            </Title>
            {extra}
        </div>
    )
}

export default SectionTitleComponent;
