import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, Button, Typography, Space } from "antd";
import { PlusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { apiRequest } from "../../../utils/UtilsApi";
import { addProductImages } from "../../../utils/UtilsProducts";
import { cleanTitle, cleanDescription } from "../../../utils/UtilsText";
import ProductFormComponent, { titleOk, priceOk } from "./ProductFormComponent";
import IconTextComponent from "../IconTextComponent";

const { Text } = Typography;

const LAST_CATEGORY_KEY = "lastCategory"

let CreateProductComponent = ({openNotification}) => {
    let router = useRouter()
    let [formData, setFormData] = useState({ title: "", description: "" })
    // Fotos elegidas: se suben cuando se publica el producto
    let [photos, setPhotos] = useState([])
    let [publishing, setPublishing] = useState(false)

    // Categoría por defecto: la última que usó el usuario (pautas 4.6 y 3.19)
    useEffect(() => {
        let last = localStorage.getItem(LAST_CATEGORY_KEY)
        if (last)
            setFormData(f => ({ ...f, category: last }))
    }, [])

    let change = (key, value) => setFormData(f => ({ ...f, [key]: value }))
    let canSubmit = titleOk(formData.title) && priceOk(formData.price) && formData.category != null

    let addPhotos = (files) => setPhotos(prev => [...prev, ...files.map(file => ({ file, url: URL.createObjectURL(file) }))])
    let removePhoto = (photo) => setPhotos(prev => prev.filter(p => p != photo))
    let setMainPhoto = (photo) => setPhotos(prev => [photo, ...prev.filter(p => p != photo)])

    // another = true: "Publish and sell another" deja el formulario listo para otro producto (pauta 4.16)
    let publish = async (another) => {
        setPublishing(true)
        // Se limpian los textos antes de guardarlos (pauta 4.19)
        let product = { ...formData, title: cleanTitle(formData.title), description: cleanDescription(formData.description) }
        let { ok, data, errors } = await apiRequest("POST", "/products", product)
        if (!ok) {
            errors.forEach(e => openNotification?.("top", e.msg, "error"))
            setPublishing(false)
            return
        }
        if (photos.length > 0) {
            let result = await addProductImages(data.productId, photos.map(p => p.file))
            result.errors.forEach(e => openNotification?.("top", "The product was published but a photo failed: " + e.msg, "warning"))
        }
        localStorage.setItem(LAST_CATEGORY_KEY, product.category)
        setPublishing(false)
        if (another) {
            openNotification?.("top", `"${product.title}" is now for sale. Fill in the form to sell another product.`, "success",
                { message: "Published" })
            setFormData({ title: "", description: "", category: product.category })
            setPhotos([])
            window.scrollTo({ top: 0, behavior: "smooth" })
        } else {
            openNotification?.("top", `"${product.title}" is now for sale`, "success", { message: "Published" })
            router.push("/myProducts")
        }
    }

    return (
        <div className="page-wide">
            <Card title={<IconTextComponent icon={<PlusCircleOutlined/>}>What are you selling?</IconTextComponent>}>
                <ProductFormComponent value={formData} onChange={change} photos={photos} onAddPhotos={addPhotos}
                                      onRemovePhoto={removePhoto} onSetMainPhoto={setMainPhoto}
                                      openNotification={openNotification}
                                      actions={
                                          <div className="form-actions">
                                              <Button type="primary" onClick={() => publish(false)} loading={publishing}
                                                      disabled={!canSubmit} block>
                                                  Publish product
                                              </Button>
                                              <Button icon={<PlusOutlined/>} onClick={() => publish(true)}
                                                      disabled={!canSubmit || publishing} block>
                                                  Publish and sell another
                                              </Button>
                                              {!canSubmit &&
                                                  <Text type="secondary">Fill in the title, category and price to publish</Text>}
                                          </div>
                                      }/>
            </Card>
        </div>
    )
}

export default CreateProductComponent;
