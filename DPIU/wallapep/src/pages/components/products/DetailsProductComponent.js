import {useState, useEffect } from "react";
import Link from "next/link";
import { Typography, Card, Button, Row, Col, Popconfirm, Space, Avatar, Divider, Skeleton, Alert, Segmented, Empty, Tooltip } from 'antd';
import { ShoppingCartOutlined, StarFilled, EditOutlined, RightOutlined, FileTextOutlined, FontSizeOutlined,
    SwapOutlined } from '@ant-design/icons';
import SectionTitleComponent from "../SectionTitleComponent";
import CategoryTagComponent from "./CategoryTagComponent";
import UserLinkComponent from "../user/UserLinkComponent";
import DateComponent from "../DateComponent";
import ProductGalleryComponent from "./ProductGalleryComponent";
import { getLoggedUserId } from "../../../utils/UtilsUser";
import { formatPrice, getProductImages, plural } from "../../../utils/UtilsProducts";
import { apiRequest } from "../../../utils/UtilsApi";
import { buyWithUndo } from "../../../utils/UtilsPurchase";
import { markProductViewed } from "../../../utils/UtilsViewed";
import { renderRichText } from "../../../utils/UtilsText";
import IconTextComponent from "../IconTextComponent";

const { Text, Title } = Typography;

// Tamaños de letra de la descripción para una lectura cómoda (pauta 1.17); se recuerda la elección
const TEXT_SIZES = { S: 14, M: 16, L: 19 }
const TEXT_SIZE_KEY = "descriptionTextSize"

let DetailsProductComponent  = ({id, openNotification}) => {
    let [product, setProduct] = useState(null)
    let [notFound, setNotFound] = useState(false)
    let [images, setImages] = useState([])
    let [loggedUserId, setLoggedUserId] = useState(null)
    let [textSize, setTextSize] = useState("M")
    let [buying, setBuying] = useState(false)

    useEffect(() => {
        setLoggedUserId(getLoggedUserId())
        try { setTextSize(localStorage.getItem(TEXT_SIZE_KEY) ?? "M") } catch (e) { /* sin almacenamiento */ }
        // en el primer render de una ruta dinámica la id puede no estar todavía
        if (id != null) {
            getProduct(id);
            getProductImages(id).then(setImages)
            markProductViewed(id)
        }
    }, [id])

    let getProduct = async (id) => {
        let { ok, data, errors } = await apiRequest("GET", "/products/" + id)
        if (ok && data != null)
            setProduct(data)
        else {
            setNotFound(true)
            errors.forEach(e => console.log("Error: " + e.msg))
        }
    }

    // Se compra sin salir de la página: el producto pasa a vendido y se puede deshacer unos segundos (pauta 5.3)
    let clickBuy = async () => {
        setBuying(true)
        await buyWithUndo({
            product, openNotification,
            onBought: () => setProduct(p => ({ ...p, buyerId: loggedUserId, buyerName: "you", justBought: true })),
            onUndone: () => setProduct(p => ({ ...p, buyerId: null, buyerName: null, buyerEmail: null, justBought: false })),
        })
        setBuying(false)
    }

    let changeTextSize = (size) => {
        setTextSize(size)
        try { localStorage.setItem(TEXT_SIZE_KEY, size) } catch (e) { /* sin almacenamiento */ }
    }

    if (notFound)
        return <Card><Empty description="This product does not exist or has been deleted">
            <Link href="/products"><Button type="primary">See other products</Button></Link>
        </Empty></Card>

    if (product == null)
        return (
            <Row gutter={[32, 32]}>
                <Col xs={24} md={13}>
                    <div className="skeleton-block" style={{ height: 400 }}/>
                </Col>
                <Col xs={24} md={11}>
                    <Card><Skeleton active paragraph={{ rows: 5 }}/></Card>
                </Col>
            </Row>
        )

    let sold = product.buyerId != null
    let isMine = loggedUserId != null && product.sellerId == loggedUserId
    let sellerName = product.sellerName || product.sellerEmail

    return (
    <Row gutter={[32, 32]}>
        {/* En móvil primero la foto y la compra, después la descripción (orden natural, pauta 3.18) */}
        <Col xs={{ span: 24, order: 1 }} md={{ span: 13, order: 1 }}>
            <ProductGalleryComponent images={images} title={product.title}/>
        </Col>

        <Col xs={{ span: 24, order: 2 }} md={{ span: 11, order: 2 }} className="detail-side">
            <Card className="detail-buy-card">
                {/* Jerarquía: precio > título > propiedades (pauta 1.6) */}
                <Title level={1} style={{ margin: 0 }}>{ formatPrice(product.price) }</Title>
                <Title level={4} style={{ margin: "4px 0 16px", wordBreak: "break-word", fontWeight: 400 }}>{ product.title }</Title>
                <Space wrap>
                    <Link href={"/products?category=" + product.category} title="See more products of this category">
                        <CategoryTagComponent category={product.category}/>
                    </Link>
                    <DateComponent timestamp={product.date}/>
                </Space>

                <div style={{ marginTop: 24 }}>
                    { sold && product.justBought ?
                        <Alert type="success" showIcon message="You bought this product"
                               description={<span>You can undo it from the notification for a few seconds, or see it
                                   in <Link href="/transactions">My transactions</Link>.</span>}/>
                    : sold ?
                        <Alert type="info" showIcon message="This product has already been sold"
                               description={<span>Bought by <UserLinkComponent userId={product.buyerId}
                                   email={product.buyerEmail} name={product.buyerName}/>.{" "}
                                   <Link href={"/products?category=" + product.category}>See similar products</Link></span>}/>
                    : isMine ?
                        <Link href={"/editProduct/" + product.id}>
                            <Button size="large" block icon={<EditOutlined/>}>Edit your product</Button>
                        </Link>
                    :
                        <Popconfirm title={`Buy "${product.title}" for ${formatPrice(product.price)}?`}
                                    description="You can undo it during the next 2 minutes."
                                    okText="Buy" onConfirm={clickBuy}>
                            <Button type="primary" size="large" block icon={<ShoppingCartOutlined/>} loading={buying}>
                                Buy now
                            </Button>
                        </Popconfirm>
                    }
                </div>

                <Divider style={{ margin: "24px 0" }}/>

                {/* Vendedor y su reputación sin navegar a otra página */}
                <Link href={"/user/" + product.sellerId} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Avatar size={52} style={{ backgroundColor: "var(--wallapep-text)", flex: "none" }}>
                        {sellerName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis style={{ display: "block", fontSize: 16 }}>{ sellerName }</Text>
                        <Text type="secondary">
                            <IconTextComponent icon={<StarFilled style={{ color: "#c98500" }}/>} small>{ plural(product.sellerSales ?? 0, "sale") }</IconTextComponent>
                        </Text>
                    </div>
                    <RightOutlined style={{ color: "var(--wallapep-muted)" }}/>
                </Link>
            </Card>
        </Col>

        <Col xs={{ span: 24, order: 3 }} md={{ span: 13, order: 3 }} className="detail-description">
            <SectionTitleComponent icon={<FileTextOutlined/>} title="Description"
                extra={product.description &&
                    <Tooltip title="Text size">
                        <Segmented size="small" value={textSize} onChange={changeTextSize}
                                   options={[{ value: "S", label: "A-" }, { value: "M", label: "A" }, { value: "L", label: "A+" }]}
                                   aria-label="Text size"/>
                    </Tooltip>}/>
            {/* Descripción con formato (pauta 4.15) y como mucho 70 caracteres por línea (pauta 1.17) */}
            <div className="rich-text" style={{ fontSize: TEXT_SIZES[textSize] }}>
                {product.description ? renderRichText(product.description) :
                    <Text type="secondary">The seller has not added a description.</Text>}
            </div>
        </Col>
    </Row>

    )
}

export default DetailsProductComponent;
