import Link from "next/link";
import { Avatar, Typography } from 'antd';

const { Text } = Typography;

// Colores oscuros: la inicial blanca tiene un contraste de al menos 4.5:1 con todos
const avatarColors = ["#c2410c", "#5b3fd9", "#a16207", "#0f766e", "#15803d", "#be185d", "#1d4ed8"]

// Enlace al perfil de un usuario con su avatar (inicial + color fijo por usuario).
// Si el nombre no cabe se corta con "..." y se ve entero al pasar el ratón.
let UserLinkComponent = ({ userId, email, name, size = "small" }) => {
    if (userId == null)
        return null

    let text = name || email || ("User " + userId)
    let color = avatarColors[userId % avatarColors.length]

    return (
        <Link href={"/user/" + userId} className="user-link">
            <Avatar size={size} style={{ backgroundColor: color, flex: "none" }}>
                {text.charAt(0).toUpperCase()}
            </Avatar>
            <Text ellipsis={{ tooltip: text }} style={{ color: "inherit", minWidth: 0 }}>{text}</Text>
        </Link>
    )
}

export default UserLinkComponent;
