import { useEffect, useState } from "react";
import { Form, Input, InputNumber, Radio, AutoComplete, Row, Col, Typography, Button, Card } from "antd";
import { BulbOutlined, EyeOutlined } from '@ant-design/icons';
import { categories, getCategory } from "../../../utils/UtilsCategories";
import { formatPrice, isSold } from "../../../utils/UtilsProducts";
import { apiRequest } from "../../../utils/UtilsApi";
import { getLoggedUserId } from "../../../utils/UtilsUser";
import ProductPhotosComponent from "./ProductPhotosComponent";
import RichTextEditorComponent from "./RichTextEditorComponent";
import ProductCardComponent from "./ProductCardComponent";
import IconTextComponent from "../IconTextComponent";

const { Text } = Typography;

export let titleOk = (title) => (title ?? "").trim().length >= 5
export let priceOk = (price) => price != null && price >= 0

// Campos de un producto, iguales al vender y al editar (pautas 2.2 y 3.18: mismo orden natural):
// fotos, título, categoría, precio y descripción. A la derecha, una vista previa de la card (pauta 3.26).
let ProductFormComponent = ({ value, onChange, photos, onAddPhotos, onRemovePhoto, onSetMainPhoto,
                              photosBusy, openNotification, actions }) => {
    let [products, setProducts] = useState([])
    let [loggedUserId, setLoggedUserId] = useState(null)

    // Los demás productos sirven para sugerir títulos y un precio (pauta 4.9)
    useEffect(() => {
        setLoggedUserId(getLoggedUserId())
        apiRequest("GET", "/products").then(({ ok, data }) => ok && setProducts(data))
    }, [])

    let others = products.filter(p => p.id != value.id)
    let sameCategory = others.filter(p => p.category == value.category)
    let typed = (value.title ?? "").trim().toLowerCase()
    let titleSuggestions = typed.length >= 2 ?
        [...new Set(others.map(p => p.title).filter(t => t?.toLowerCase().includes(typed) && t.toLowerCase() != typed))]
            .slice(0, 5).map(t => ({ value: t })) : []
    let forSale = sameCategory.filter(p => !isSold(p) && p.price != null)
    let averagePrice = forSale.length > 0 ? Math.round(forSale.reduce((t, p) => t + p.price, 0) / forSale.length) : null

    // Estado de validación en línea: nada si está vacío, error o válido (pauta 4.13)
    let status = (filled, ok) => !filled ? "" : ok ? "success" : "error"

    let preview = {
        ...value, id: value.id ?? 0, price: value.price ?? 0, image: photos[0]?.url ?? "/imageMockup.png",
        date: value.date ?? Date.now(), sellerId: loggedUserId, sellerName: "You", sellerSales: undefined,
        buyerId: null,
    }

    return (
        <Row gutter={[32, 24]}>
            <Col xs={24} lg={15}>
                <Form layout="vertical" size="large">
                    <Form.Item label="Photos" extra="The first photo is the one buyers see in the list.">
                        <ProductPhotosComponent photos={photos} onAdd={onAddPhotos} onRemove={onRemovePhoto}
                                                onSetMain={onSetMainPhoto} busy={photosBusy} openNotification={openNotification}/>
                    </Form.Item>

                    <Form.Item label="Title" required
                               validateStatus={status(value.title, titleOk(value.title))}
                               help={value.title && !titleOk(value.title) ? "The title needs at least 5 characters" : ""}>
                        <AutoComplete options={titleSuggestions} value={value.title}
                                      onChange={(v) => onChange("title", v ?? "")}>
                            <Input placeholder="e.g. Nintendo Switch OLED with two controllers" maxLength={50} showCount allowClear/>
                        </AutoComplete>
                    </Form.Item>

                    {/* Categorías visibles con su icono y color (pautas 4.8 y 3.2) */}
                    <Form.Item label="Category" required>
                        <Radio.Group value={value.category} buttonStyle="solid" className="pill-group"
                                     onChange={(e) => onChange("category", e.target.value)}>
                            {categories.map(c =>
                                <Radio.Button key={c.value} value={c.value}>
                                    <span className={"category-icon category-color-" + c.color}>{c.icon}</span> {c.label}
                                </Radio.Button>
                            )}
                        </Radio.Group>
                    </Form.Item>

                    {/* Precio con unidad, sin negativos (pautas 4.7 y 4.11) y precio sugerido (pauta 4.9) */}
                    <Form.Item label="Price" required hasFeedback
                               validateStatus={status(value.price != null, priceOk(value.price))}
                               extra={averagePrice != null &&
                                   <span className="price-suggestion">
                                       <IconTextComponent icon={<BulbOutlined/>} small>
                                           <span>Similar products in {getCategory(value.category).label} sell for
                                               about <strong>{formatPrice(averagePrice)}</strong>.</span>
                                       </IconTextComponent>
                                       {value.price != averagePrice &&
                                           <Button type="link" size="small" className="inline-link-button"
                                                   onClick={() => onChange("price", averagePrice)}>Use this price</Button>}
                                   </span>}>
                        <InputNumber min={0} max={1000000} precision={2} addonAfter="€" placeholder="0"
                                     value={value.price} onChange={(v) => onChange("price", v)} style={{ width: "100%", maxWidth: 240 }}/>
                    </Form.Item>

                    <Form.Item label="Description">
                        <RichTextEditorComponent value={value.description} onChange={(v) => onChange("description", v)}
                                                 placeholder="Brand, model, condition, size... Short and clear texts sell better."/>
                    </Form.Item>

                    {actions}
                </Form>
            </Col>

            <Col xs={0} lg={9}>
                <div className="form-preview">
                    <Text type="secondary" className="form-preview-title"><IconTextComponent icon={<EyeOutlined/>} small>This is how buyers will see it</IconTextComponent></Text>
                    <ProductCardComponent product={preview} preview/>
                </div>
            </Col>
        </Row>
    )
}

export default ProductFormComponent;
