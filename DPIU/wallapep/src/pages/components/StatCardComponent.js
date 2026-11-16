import { Card, Typography, Tooltip } from 'antd';
import IconTextComponent from "./IconTextComponent";

const { Text } = Typography;

// Tarjeta de resumen numérico. Todas miden lo mismo en cualquier vista:
// etiqueta, valor en una sola línea (se corta con "..." si no cabe) y una línea de nota
// que siempre ocupa su hueco aunque no haya nota, para que ninguna quede más baja.
let StatCardComponent = ({ title, value, icon, note, valueColor }) => {
    return (
        <Card className="stat-card" variant="outlined">
            <Text type="secondary" className="stat-card-title"><IconTextComponent icon={icon} small>{title}</IconTextComponent></Text>
            <Tooltip title={typeof value == "string" ? value : undefined}>
                <div className="stat-card-value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
            </Tooltip>
            <Text type="secondary" className="stat-card-note">{note ?? " "}</Text>
        </Card>
    )
}

export default StatCardComponent;
