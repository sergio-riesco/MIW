import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Descriptions, Empty, Typography, Tag, Skeleton, Button } from 'antd';
import { ShoppingCartOutlined, ShopOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { formatPrice } from "../../../utils/UtilsProducts";
import { productImageUrl, onImageError } from "../../../utils/UtilsImages";
import { getLoggedUserId } from "../../../utils/UtilsUser";
import DateComponent from "../DateComponent";
import CategoryTagComponent from "../products/CategoryTagComponent";
import UserLinkComponent from "../user/UserLinkComponent";
import SectionTitleComponent from "../SectionTitleComponent";
import { plainText } from "../../../utils/UtilsText";

const { Text, Title, Paragraph } = Typography;

// Detalle de una transacción como un resumen de pedido:
// 1) qué se compró (foto, título, categoría y precio), 2) quién participó, 3) pago y envío, 4) fechas.
let DetailsTransactionComponent = ({id}) => {
    let [transaction, setTransaction] = useState(null)
    let [image, setImage] = useState(null)
    let [loaded, setLoaded] = useState(false)
    let [loggedUserId, setLoggedUserId] = useState(null)

    useEffect(() => {
        setLoggedUserId(getLoggedUserId())
        if (id != null) {
            getTransaction(id);
        }
    }, [id])

    // El backend no tiene GET /transactions/:id, se busca entre las transacciones propias
    let getTransaction = async (id) => {
        let response = await fetch(
            process.env.NEXT_PUBLIC_BACKEND_BASE_URL + "/transactions/own",
            {
                method: "GET",
                headers: {
                    "apikey": localStorage.getItem("apiKey")
                },
            });

        if (response.ok) {
            let jsonData = await response.json();
            let found = jsonData.find(t => t.tid == id)
            setTransaction(found ?? null)
            if (found)
                setImage(productImageUrl(found.productId))
        } else {
            let responseBody = await response.json();
            let serverErrors = responseBody.errors;
            serverErrors.forEach(e => {
                console.log("Error: " + e.msg)
            })
        }
        setLoaded(true)
    }

    // Mientras carga no se muestran datos falsos ("Deleted product", "Other"...)
    if (!loaded) {
        return <Card><Skeleton active avatar={{ shape: "square", size: 96 }} paragraph={{ rows: 6 }}/></Card>
    }

    if (transaction == null) {
        return (
            <Card>
                <Empty description="This transaction does not exist or is not yours">
                    <Link href="/transactions"><Button type="primary" icon={<ArrowLeftOutlined/>}>
                        Back to my transactions</Button></Link>
                </Empty>
            </Card>
        )
    }

    let isPurchase = transaction.buyerId == loggedUserId
    let productDeleted = transaction.title == null
    let shippingAddress = [transaction.buyerAddress, transaction.buyerPostCode, transaction.buyerCountry]
        .filter(v => v != null && v !== "").join(", ")

    return (
        <Card>
            {/* 1. Qué se ha comprado o vendido */}
            <div className="transaction-summary">
                <img className="transaction-summary-image" src={image} onError={onImageError}
                     alt={transaction.title ?? "Deleted product"}/>
                <div className="transaction-summary-info">
                    {isPurchase ?
                        <Tag color="blue" icon={<ShoppingCartOutlined/>}>Purchase</Tag> :
                        <Tag color="green" icon={<ShopOutlined/>}>Sale</Tag>}
                    <Title level={4} style={{ margin: 0 }} ellipsis={{ rows: 2, tooltip: transaction.title }}>
                        {productDeleted ? <Text type="secondary">Deleted product</Text> :
                            <Link href={"/detailProduct/" + transaction.productId}>{transaction.title}</Link>}
                    </Title>
                    <CategoryTagComponent category={transaction.category} small/>
                </div>
                <div className="transaction-summary-price">
                    <Text type="secondary">{isPurchase ? "You paid" : "You earned"}</Text>
                    <div className="transaction-price">{formatPrice(transaction.productPrice)}</div>
                </div>
            </div>

            {transaction.description &&
                <Paragraph type="secondary" ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
                           style={{ margin: "16px 0 0", maxWidth: "70ch" }}>
                    {plainText(transaction.description)}
                </Paragraph>}

            {/* 2-4. Personas, pago y envío, fechas: etiquetas encima del valor para que no se partan */}
            <div className="transaction-groups">
                <section>
                    <SectionTitleComponent title="People"/>
                    <Descriptions layout="vertical" column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }} colon={false}>
                        <Descriptions.Item label="Seller">
                            <UserLinkComponent userId={transaction.sellerId} email={transaction.sellerEmail}
                                               name={transaction.sellerName}/>
                        </Descriptions.Item>
                        <Descriptions.Item label="Buyer">
                            <UserLinkComponent userId={transaction.buyerId} email={transaction.buyerEmail}
                                               name={transaction.buyerName}/>
                        </Descriptions.Item>
                    </Descriptions>
                </section>
                <section>
                    <SectionTitleComponent title="Payment and shipping"/>
                    <Descriptions layout="vertical" column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }} colon={false}>
                        <Descriptions.Item label="Payment method">
                            {transaction.buyerPaymentId ?? <Text type="secondary">Not specified</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Shipping address">
                            {shippingAddress || <Text type="secondary">Not specified</Text>}
                        </Descriptions.Item>
                    </Descriptions>
                </section>
                <section>
                    <SectionTitleComponent title="Dates"/>
                    <Descriptions layout="vertical" column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }} colon={false}>
                        <Descriptions.Item label="Started">
                            <DateComponent timestamp={transaction.startDate} type={undefined}/>
                        </Descriptions.Item>
                        <Descriptions.Item label="Finished">
                            {transaction.endDate ? <DateComponent timestamp={transaction.endDate} type={undefined}/> :
                                <Text type="secondary">In progress</Text>}
                        </Descriptions.Item>
                    </Descriptions>
                </section>
            </div>

            {/* Acción principal destacada y la secundaria al lado (pautas 1.9 y 1.10) */}
            <div className="detail-actions">
                {!productDeleted &&
                    <Link href={"/detailProduct/" + transaction.productId}>
                        <Button type="primary" icon={<EyeOutlined/>}>View product page</Button>
                    </Link>}
                <Link href="/transactions"><Button icon={<ArrowLeftOutlined/>}>Back to my transactions</Button></Link>
            </div>
        </Card>
    )
}

export default DetailsTransactionComponent;
