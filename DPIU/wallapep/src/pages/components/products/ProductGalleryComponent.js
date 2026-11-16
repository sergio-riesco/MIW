import { useState } from "react";
import { Image, Tooltip } from 'antd';
import { MOCKUP_IMAGE } from "../../../utils/UtilsImages";

// Galería de fotos del detalle (pauta 3.27): foto grande con zoom y miniaturas debajo para cambiarla.
// Al ampliar se puede pasar de una foto a otra con las flechas.
let ProductGalleryComponent = ({ images, title }) => {
    let [current, setCurrent] = useState(0)
    let list = images.length > 0 ? images : [MOCKUP_IMAGE]
    let index = Math.min(current, list.length - 1)

    return (
        <div className="gallery">
            <Image.PreviewGroup items={list} preview={{ current: index, onChange: (i) => setCurrent(i) }}>
                <div className="gallery-main">
                    <Image src={list[index]} alt={title} fallback={MOCKUP_IMAGE}
                           style={{ width: "100%", maxHeight: 520, objectFit: "contain" }}/>
                </div>
            </Image.PreviewGroup>
            {list.length > 1 &&
                <div className="gallery-thumbs" role="list">
                    {list.map((src, i) =>
                        <Tooltip key={src} title={`Photo ${i + 1} of ${list.length}`}>
                            <button type="button" role="listitem" aria-label={`Show photo ${i + 1}`}
                                    className={"gallery-thumb" + (i == index ? " gallery-thumb-active" : "")}
                                    onClick={() => setCurrent(i)}>
                                <img src={src} alt=""/>
                            </button>
                        </Tooltip>
                    )}
                </div>}
        </div>
    )
}

export default ProductGalleryComponent;
