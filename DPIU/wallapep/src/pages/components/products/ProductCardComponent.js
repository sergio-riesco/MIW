import Link from "next/link";
import { Card, Typography, Button, Badge, Popconfirm, Tooltip } from 'antd';
import { ShoppingCartOutlined, StarFilled, EyeOutlined, CrownFilled } from '@ant-design/icons';
import CategoryTagComponent from "./CategoryTagComponent";
import UserLinkComponent from "../user/UserLinkComponent";
import DateComponent from "../DateComponent";
import { formatPrice, isSold } from "../../../utils/UtilsProducts";
import { productImageUrl, onImageError } from "../../../utils/UtilsImages";
import IconTextComponent from "../IconTextComponent";

const { Text } = Typography;

// Vendedores con al menos estas ventas se destacan con "Top seller" (pauta 1.14)
export const TOP_SELLER_SALES = 2

// Card de producto reutilizable (home, listado, perfil y vista previa al vender):
// imagen cuadrada, precio destacado y pocas propiedades (pautas 1.7, 1.12 y 3.10).
// Todas las cards miden lo mismo sea cual sea la imagen o el texto (pauta 4.19):
//  - la imagen ocupa siempre un cuadrado y se ve entera (fondo desenfocado de la propia foto)
//  - cada línea de texto es de una sola línea y se corta con "..." mostrando el texto entero en un tooltip
//  - el botón de compra ocupa siempre su hueco y solo se hace visible al pasar el ratón (pauta 1.13)
// Con preview=true no tiene enlaces ni acciones (vista previa del formulario de venta, pauta 3.26).
let ProductCardComponent = ({ product, loggedUserId, onBuy, viewed, preview = false }) => {
    if (product == null)
        return null

    let sold = isSold(product)
    let isMine = loggedUserId != null && product.sellerId == loggedUserId
    let price = formatPrice(product.price)
    let topSeller = (product.sellerSales ?? 0) >= TOP_SELLER_SALES
    let href = `/detailProduct/${product.id}`
    // En la vista previa no hay enlaces
    let wrap = (className, children) => preview ?
        <div className={className}>{children}</div> : <Link href={href} className={className}>{children}</Link>

    let card = (
        <Card className={"product-card" + (sold ? " product-card-sold" : "") + (preview ? " product-card-preview" : "")}
              variant="borderless"
              cover={
                  wrap("product-card-cover", <>
                      <img className="product-card-image" src={product.image ?? productImageUrl(product.id)}
                           alt={product.title || "Product photo"} onError={onImageError} loading="lazy"/>
                      {viewed &&
                          <Tooltip title="You have already seen this product">
                              <IconTextComponent icon={<EyeOutlined/>} small className="product-card-viewed">Viewed</IconTextComponent>
                          </Tooltip>}
                      {topSeller && !sold &&
                          <Tooltip title={`Sold by a top seller: ${product.sellerSales} sales`}>
                              <IconTextComponent icon={<CrownFilled/>} small className="product-card-top">Top seller</IconTextComponent>
                          </Tooltip>}
                  </>)
              }>
            {wrap("product-card-line",
                <Text strong className="product-card-price" ellipsis={{ tooltip: price }}>{price}</Text>)}
            {wrap("product-card-line",
                <Text ellipsis={{ tooltip: product.title }}>{product.title || "Your product title"}</Text>)}
            <div className="product-card-line product-card-meta">
                {/* La categoría lleva al listado de esa categoría: no es un "falso clicable" (pauta 2.3) */}
                {preview ? <CategoryTagComponent category={product.category} small/> :
                    <Link href={"/products?category=" + product.category} className="category-tag-link"
                          title="See more products of this category">
                        <CategoryTagComponent category={product.category} small/>
                    </Link>}
                <Text type="secondary" className="product-card-ellipsis">
                    <DateComponent timestamp={product.date} icon={false}/>
                </Text>
            </div>
            {product.sellerId != null &&
                <div className="product-card-line product-card-meta">
                    <span className="product-card-ellipsis">
                        <UserLinkComponent userId={product.sellerId} email={product.sellerEmail} name={product.sellerName}/>
                    </span>
                    {product.sellerSales != null &&
                        <Tooltip title={`Seller reputation: ${product.sellerSales} sales`}>
                            <Text type="secondary" style={{ flex: "none" }}>
                                <IconTextComponent icon={<StarFilled style={{ color: "#c98500" }}/>} small>{product.sellerSales}</IconTextComponent>
                            </Text>
                        </Tooltip>}
                </div>
            }
            {onBuy != null && !preview &&
                <div className="card-actions">
                    {sold ?
                        <Button block disabled>Sold</Button> :
                        <Popconfirm title={`Buy "${product.title}" for ${price}?`}
                                    description="You can undo it during the next 2 minutes."
                                    okText="Buy" disabled={isMine} onConfirm={() => onBuy(product)}>
                            <Button type="primary" block icon={<ShoppingCartOutlined/>} disabled={isMine}>
                                {isMine ? "Your product" : "Buy now"}
                            </Button>
                        </Popconfirm>}
                </div>
            }
        </Card>
    )

    // Los vendidos se marcan con una cinta gris (no se usa rojo, que indica error: pauta 2.7)
    return (
        <div className="product-card-wrap">
            {sold ? <Badge.Ribbon text="Sold" color="var(--wallapep-muted)">{card}</Badge.Ribbon> : card}
        </div>
    )
}

export default ProductCardComponent;
