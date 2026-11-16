import { Tooltip, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { timestampToString, timestampToTimeAgo } from "../../utils/UtilsDates";
import IconTextComponent from "./IconTextComponent";

const { Text } = Typography;

// Fecha como tiempo transcurrido y la fecha completa al pasar el ratón (pauta 3.20)
let DateComponent = ({ timestamp, icon = true, type = "secondary" }) => {
    if (timestamp == null || timestamp <= 0)
        return <Text type={type}>-</Text>

    return (
        <Tooltip title={timestampToString(timestamp)}>
            <Text type={type} style={{ whiteSpace: "nowrap" }}>
                {icon ? <IconTextComponent icon={<CalendarOutlined/>} small>{timestampToTimeAgo(timestamp)}</IconTextComponent> :
                    timestampToTimeAgo(timestamp)}
            </Text>
        </Tooltip>
    )
}

export default DateComponent;
