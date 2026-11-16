import { Upload, Button, Tooltip, Typography } from 'antd';
import { InboxOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import IconTextComponent from "../IconTextComponent";

const { Text } = Typography;

export const MAX_PHOTOS = 6

// Fotos de un producto: se añaden arrastrando (pauta 4.5), se ven en miniatura (pauta 3.3)
// y se puede elegir la principal o quitar cualquiera con un clic (pauta 4.18).
// photos: [{ url }] — la primera es la principal.
let ProductPhotosComponent = ({ photos, onAdd, onRemove, onSetMain, openNotification, busy }) => {
    // Se validan todos los ficheros de una vez y se pasan juntos a onAdd
    let beforeUpload = (file, fileList) => {
        if (file !== fileList[fileList.length - 1])
            return false
        let valid = fileList.filter(f => {
            if (!["image/png", "image/jpeg"].includes(f.type)) {
                openNotification?.("top", `"${f.name}" is not a PNG or JPG image. Choose a photo in one of those formats.`, "error")
                return false
            }
            if (f.size > 2 * 1024 * 1024) {
                openNotification?.("top", `"${f.name}" is bigger than 2 MB. Choose a smaller photo.`, "error")
                return false
            }
            return true
        })
        let room = MAX_PHOTOS - photos.length
        if (valid.length > room)
            openNotification?.("top", `A product can have ${MAX_PHOTOS} photos at most, only the first ${room} were added.`, "warning")
        if (valid.length > 0 && room > 0)
            onAdd(valid.slice(0, room))
        return false
    }

    return (
        <div className="photos">
            {photos.length > 0 &&
                <div className="photos-grid">
                    {photos.map((p, i) =>
                        <div key={p.url} className={"photo-thumb" + (i == 0 ? " photo-thumb-main" : "")}>
                            <img src={p.url} alt={"Photo " + (i + 1)}/>
                            {i == 0 && <IconTextComponent icon={<StarFilled/>} small className="photo-main-label">Main photo</IconTextComponent>}
                            <div className="photo-actions">
                                {i > 0 &&
                                    <Tooltip title="Use as main photo">
                                        <Button size="small" icon={<StarOutlined/>} disabled={busy}
                                                aria-label="Use as main photo" onClick={() => onSetMain(p)}/>
                                    </Tooltip>}
                                <Tooltip title="Remove photo">
                                    <Button size="small" danger icon={<DeleteOutlined/>} disabled={busy}
                                            aria-label="Remove photo" onClick={() => onRemove(p)}/>
                                </Tooltip>
                            </div>
                        </div>
                    )}
                </div>}
            {photos.length < MAX_PHOTOS &&
                <Upload.Dragger multiple showUploadList={false} accept="image/png,image/jpeg"
                                beforeUpload={beforeUpload} disabled={busy}>
                    <p className="ant-upload-drag-icon"><InboxOutlined/></p>
                    <p className="ant-upload-text">Drag your photos here or click to choose them</p>
                    <Text type="secondary">{photos.length} of {MAX_PHOTOS} · PNG or JPG, 2 MB max.</Text>
                </Upload.Dragger>}
        </div>
    )
}

export default ProductPhotosComponent;
