import { Tag } from 'antd';
import { getCategory } from "../../../utils/UtilsCategories";

let CategoryTagComponent = ({ category, small }) => {
    let c = getCategory(category)
    return (
        <Tag icon={c.icon} color={c.color} bordered={false}
             style={small ? { fontSize: 12, marginInlineEnd: 0 } : undefined}>
            {c.label}
        </Tag>
    )
}

export default CategoryTagComponent;
