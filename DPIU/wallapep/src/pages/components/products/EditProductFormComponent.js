import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, Button, Typography, Skeleton } from "antd";
import { EditOutlined } from '@ant-design/icons';
import { apiRequest } from "../../../utils/UtilsApi";
import { updateProduct, getProductImages, addProductImages, deleteProductImage, setMainProductImage }
    from "../../../utils/UtilsProducts";
import { cleanTitle, cleanDescription } from "../../../utils/UtilsText";
import DateComponent from "../DateComponent";
import ProductFormComponent, { titleOk, priceOk } from "./ProductFormComponent";
import IconTextComponent from "../IconTextComponent";

const { Text } = Typography;

let EditProductFormComponent = ({id, openNotification}) => {
    let router = useRouter()
    let [formData, setFormData] = useState(null)
    let [photos, setPhotos] = useState([])
    let [photosBusy, setPhotosBusy] = useState(false)
    let [saving, setSaving] = useState(false)

    useEffect(() => {
        if (id != null) {
            getProduct(id);
            // Las fotos se cargan con un parámetro para no ver una versión antigua en caché
            getProductImages(id).then(urls => setPhotos(urls.map(url => ({ url: url + "?v=" + Date.now() }))))
        }
    }, [id])

    let getProduct = async (id) => {
        let { ok, data, errors } = await apiRequest("GET", "/products/" + id)
        if (ok)
            setFormData(data)
        else
            errors.forEach(e => openNotification?.("top", e.msg, "error"))
    }

    let change = (key, value) => setFormData(f => ({ ...f, [key]: value }))

    // Las fotos se cambian en el momento (el producto ya existe): se puede cambiar la foto al editar (pauta 4.5)
    let photoChange = async (promise, okText) => {
        setPhotosBusy(true)
        let { errors, images } = await promise
        if (errors.length == 0) {
            setPhotos(images.map(url => ({ url: url + "?v=" + Date.now() })))
            openNotification?.("top", okText, "success")
        } else {
            errors.forEach(e => openNotification?.("top", e.msg, "error"))
        }
        setPhotosBusy(false)
    }
    let addPhotos = (files) => photoChange(addProductImages(id, files), files.length == 1 ? "Photo added" : files.length + " photos added")
    let removePhoto = (photo) => photoChange(deleteProductImage(id, photo.url.split("?")[0]), "Photo removed")
    let setMainPhoto = (photo) => photoChange(setMainProductImage(id, photo.url.split("?")[0]), "Main photo changed")

    let canSubmit = formData != null && titleOk(formData.title) && priceOk(formData.price)

    let clickEditProduct = async () => {
        setSaving(true)
        let product = { ...formData, title: cleanTitle(formData.title), description: cleanDescription(formData.description) }
        let errors = await updateProduct(product)
        setSaving(false)
        if (errors.length == 0) {
            openNotification?.("top", `"${product.title}" has been updated`, "success", { message: "Changes saved" })
            router.push("/myProducts")
        } else {
            errors.forEach(e => openNotification?.("top", e.msg, "error"))
        }
    }

    return (
        <Card title={<IconTextComponent icon={<EditOutlined/>}>Edit product</IconTextComponent>}
              extra={formData?.date > 0 && <Text type="secondary">Published <DateComponent timestamp={formData.date} icon={false}/></Text>}>
            {formData == null ? <Skeleton active paragraph={{ rows: 8 }}/> :
                <ProductFormComponent value={formData} onChange={change} photos={photos} photosBusy={photosBusy}
                                      onAddPhotos={addPhotos} onRemovePhoto={removePhoto} onSetMainPhoto={setMainPhoto}
                                      openNotification={openNotification}
                                      actions={
                                          <div className="form-actions">
                                              <Button type="primary" onClick={clickEditProduct} loading={saving}
                                                      disabled={!canSubmit} block>
                                                  Save changes
                                              </Button>
                                              <Button onClick={() => router.push("/myProducts")} block>Cancel</Button>
                                          </div>
                                      }/>}
        </Card>
    )
}

export default EditProductFormComponent;
