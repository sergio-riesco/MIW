import { PlaySquareOutlined, LaptopOutlined, SkinOutlined, HomeOutlined, TrophyOutlined,
    BookOutlined, EnvironmentOutlined, AppstoreOutlined } from '@ant-design/icons';

// Categorías hardcodeadas, el value es lo que se guarda en la columna products.category
// Cada una tiene un icono y un color para reconocerla rápido
export const categories = [
    { value: "consola", label: "Consoles", icon: <PlaySquareOutlined/>, color: "purple" },
    { value: "electronica", label: "Electronics", icon: <LaptopOutlined/>, color: "blue" },
    { value: "ropa", label: "Clothes", icon: <SkinOutlined/>, color: "magenta" },
    { value: "hogar", label: "Home", icon: <HomeOutlined/>, color: "orange" },
    { value: "deportes", label: "Sports", icon: <TrophyOutlined/>, color: "volcano" },
    { value: "libros", label: "Books", icon: <BookOutlined/>, color: "gold" },
    { value: "planta", label: "Plants", icon: <EnvironmentOutlined/>, color: "green" },
]

export const otherCategory = { value: null, label: "Other", icon: <AppstoreOutlined/>, color: "default" }

export let getCategory = (value) => {
    return categories.find(c => c.value == value) ?? otherCategory
}

export let categoryLabel = (value) => {
    return getCategory(value).label
}

// Opciones para un <Select>, con icono y opcionalmente el número de productos de cada categoría
export let categoryOptions = (products) => {
    return categories.map(c => ({
        value: c.value,
        label: <span>{c.icon} {c.label}{products ? ` (${products.filter(p => p.category == c.value).length})` : ""}</span>
    }))
}
