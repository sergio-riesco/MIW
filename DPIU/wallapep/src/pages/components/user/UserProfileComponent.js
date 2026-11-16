import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Descriptions, Table, Row, Col, Avatar, Typography, Empty, Segmented, Button } from 'antd';
import { buyWithUndo } from "../../../utils/UtilsPurchase";
import { productImageUrl, onImageError } from "../../../utils/UtilsImages";
import { UserOutlined, StarFilled, CalendarOutlined, ShopOutlined, ShoppingCartOutlined,
    WalletOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { addImagesToProducts } from "../../../utils/UtilsImages";
import { getLoggedUserId, transactionsSummary } from "../../../utils/UtilsUser";
import { timestampToTimeAgo } from "../../../utils/UtilsDates";
import { getViewedProducts } from "../../../utils/UtilsViewed";
import { formatPrice, productGridCol, plural } from "../../../utils/UtilsProducts";
import { timestampToString } from "../../../utils/UtilsDates";
import StatCardComponent from "../StatCardComponent";
import SectionTitleComponent from "../SectionTitleComponent";
import DateComponent from "../DateComponent";
import ProductCardComponent from "../products/ProductCardComponent";
import UserLinkComponent from "./UserLinkComponent";
import IconTextComponent from "../IconTextComponent";

const { Title, Text } = Typography;

let UserProfileComponent = ({id, openNotification}) => {
    let [user, setUser] = useState({})
    let [transactionsAsSeller, setTransactionsAsSeller] = useState([])
    let [transactionsAsBuyer, setTransactionsAsBuyer] = useState([])
    let [productsForSale, setProductsForSale] = useState([])
    let [loggedUserId, setLoggedUserId] = useState(null)
    // Orden de los productos a la venta (pauta 3.12)
    let [order, setOrder] = useState("newest")

    useEffect(() => {
        setLoggedUserId(getLoggedUserId())
        if (id != null) {
            getUser(id);
            getTransactions(id);
            getProductsForSale(id);
        }
    }, [id])

    let showErrors = async (response) => {
        let responseBody = await response.json();
        let serverErrors = responseBody.errors;
        serverErrors.forEach(e => {
            console.log("Error: " + e.msg)
        })
    }

    // i. Datos públicos del usuario
    let getUser = async (id) => {
        let response = await fetch(process.env.NEXT_PUBLIC_BACKEND_BASE_URL + "/users/" + id,
            {
                method: "GET",
                headers: {
                    "apikey": localStorage.getItem("apiKey")
                },
            });

        if (response.ok) {
            setUser(await response.json())
        } else {
            await showErrors(response)
        }
    }

    let getPublicTransactions = async (param, id) => {
        let response = await fetch(
            process.env.NEXT_PUBLIC_BACKEND_BASE_URL + "/transactions/public?" + param + "=" + id,
            {
                method: "GET",
                headers: {
                    "apikey": localStorage.getItem("apiKey")
                },
            });
        if (response.ok) {
            let jsonData = await response.json();
            return jsonData.map(t => ({ ...t, key: t.id }))
        }
        await showErrors(response)
        return []
    }

    // ii. Transacciones en las que ha vendido y en las que ha comprado
    let getTransactions = async (id) => {
        setTransactionsAsSeller(await getPublicTransactions("sellerId", id))
        setTransactionsAsBuyer(await getPublicTransactions("buyerId", id))
    }

    // iii. Productos en venta (los suyos que todavía no tienen comprador)
    let getProductsForSale = async (id) => {
        let response = await fetch(process.env.NEXT_PUBLIC_BACKEND_BASE_URL + "/products?sellerId=" + id,
            {
                method: "GET",
                headers: {
                    "apikey": localStorage.getItem("apiKey")
                },
            });

        if (response.ok) {
            let jsonData = await response.json();
            let notSold = jsonData.filter(p => p.buyerId == null)
            setProductsForSale(addImagesToProducts(notSold))
        } else {
            await showErrors(response)
        }
    }

    // Compra con "Deshacer" (pauta 5.3): el producto se marca como vendido y vuelve si se deshace
    let clickBuy = (product) => buyWithUndo({
        product, openNotification,
        onBought: () => setProductsForSale(prev => prev.map(p => p.id == product.id ? { ...p, buyerId: loggedUserId } : p)),
        onUndone: () => setProductsForSale(prev => prev.map(p => p.id == product.id ? { ...p, buyerId: null } : p)),
    })

    let summary = transactionsSummary([...transactionsAsSeller, ...transactionsAsBuyer], Number(id))
    let isMe = loggedUserId != null && Number(id) == loggedUserId
    let sortedProducts = [...productsForSale].sort((a, b) =>
        order == "cheapest" ? a.price - b.price : order == "expensive" ? b.price - a.price : (b.date ?? 0) - (a.date ?? 0))

    let transactionColumns = (otherUser) => [
        {
            title: "Product",
            dataIndex: [],
            sorter: (a, b) => (a.title ?? "").localeCompare(b.title ?? ""),
            render: (t) => t.title == null ? <Text type="secondary">Deleted product</Text> :
                <Link href={"/detailProduct/" + t.productId} className="table-product">
                    <img className="table-thumb table-thumb-small" src={productImageUrl(t.productId)} alt=""
                         onError={onImageError} loading="lazy"/>
                    <Text ellipsis={{ tooltip: t.title }} style={{ maxWidth: 160 }}>{t.title}</Text>
                </Link>
        },
        {
            title: "Price",
            dataIndex: "productPrice",
            sorter: (a, b) => a.productPrice - b.productPrice,
            align: "right",
            render: (price) => formatPrice(price)
        },
        {
            title: otherUser == "buyer" ? "Buyer" : "Seller",
            dataIndex: [],
            responsive: ['sm'],
            render: (t) => otherUser == "buyer" ?
                <UserLinkComponent userId={t.buyerId} email={t.buyerEmail} name={t.buyerName}/> :
                <UserLinkComponent userId={t.sellerId} email={t.sellerEmail} name={t.sellerName}/>
        },
        {
            title: "Date",
            dataIndex: "startDate",
            defaultSortOrder: "descend",
            sorter: (a, b) => (a.startDate ?? 0) - (b.startDate ?? 0),
            render: (date) => <DateComponent timestamp={date} icon={false}/>
        },
    ]

    let displayName = [user.name, user.surname].filter(v => v).join(" ") || user.email

    return (
        <div>
            <Card className="block">
                <Row align="middle" gutter={[16, 16]} wrap={false}>
                    <Col>
                        <Avatar size={72} style={{ backgroundColor: "var(--wallapep-primary)" }} icon={!displayName && <UserOutlined/>}>
                            {displayName?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Col>
                    <Col flex="auto" style={{ minWidth: 0 }}>
                        <Title level={3} style={{ margin: 0 }} ellipsis={{ tooltip: displayName }}>{displayName}</Title>
                        <Text type="secondary"><IconTextComponent icon={<StarFilled style={{ color: "#c98500" }}/>} small>{summary.sales} sales
                            · {summary.purchases} purchases</IconTextComponent></Text>
                    </Col>
                    {/* En el perfil propio la acción principal es vender (pauta 1.9) */}
                    {isMe &&
                        <Col flex="none">
                            <Link href="/createProduct"><Button type="primary" icon={<PlusOutlined/>}>Sell a product</Button></Link>
                        </Col>}
                </Row>
                <Descriptions style={{ marginTop: 24 }} column={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 }}>
                    {/* El email no se parte a mitad: si no cabe se corta con "..." y se ve entero al pasar el ratón */}
                    <Descriptions.Item label="Email">
                        <Text ellipsis={{ tooltip: user.email }} style={{ maxWidth: "100%" }}>{user.email}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Country">{user.country ?? "-"}</Descriptions.Item>
                    <Descriptions.Item label="Postal code">{user.postalCode ?? "-"}</Descriptions.Item>
                </Descriptions>
            </Card>

            {/* Las 4 tarjetas miden lo mismo: mismo componente, valor en una línea y nota reservada */}
            <Row gutter={[16, 16]} className="section">
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<ShopOutlined/>} title="Sales" value={summary.sales}
                                       note={summary.salesLastMonth + " last month"}/>
                </Col>
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<ShoppingCartOutlined/>} title="Purchases" value={summary.purchases}
                                       note={summary.purchasesLastMonth + " last month"}/>
                </Col>
                <Col xs={12} md={6}>
                    {/* El número de productos a la venta ya está en su sección; aquí, lo vendido (pauta 1.15) */}
                    <StatCardComponent icon={<WalletOutlined/>} title="Sales volume" value={formatPrice(summary.earned)}
                                       note={"in " + summary.sales + (summary.sales == 1 ? " sale" : " sales")}/>
                </Col>
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<ClockCircleOutlined/>} title="Last transaction"
                                       value={summary.lastTransactionDate ? timestampToTimeAgo(summary.lastTransactionDate) : "Never"}
                                       note={summary.lastTransactionDate ? timestampToString(summary.lastTransactionDate) : undefined}/>
                </Col>
            </Row>

            <section className="section">
                <SectionTitleComponent icon={<ShopOutlined/>} title="Products for sale" count={productsForSale.length}
                    extra={productsForSale.length > 1 &&
                        <Segmented size="small" value={order} onChange={setOrder} options={[
                            { value: "newest", label: "Newest" }, { value: "cheapest", label: "Cheapest" },
                            { value: "expensive", label: "Most expensive" }]}/>}/>
                {productsForSale.length == 0 &&
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                           description={isMe ? "You have nothing for sale right now" : "This user has no products for sale right now"}>
                        {isMe ? <Link href="/createProduct"><Button type="primary">Sell a product</Button></Link> :
                            <Link href="/products"><Button>See other products</Button></Link>}
                    </Empty>}
                <Row gutter={[16, 16]}>
                {sortedProducts.map(p =>
                    <Col {...productGridCol} key={p.id}>
                        <ProductCardComponent product={p} loggedUserId={loggedUserId} onBuy={clickBuy}
                                              viewed={getViewedProducts().includes(p.id)}/>
                    </Col>
                )}
                </Row>
            </section>

            <Row gutter={[32, 32]}>
                <Col xs={24} xl={12}>
                    <SectionTitleComponent icon={<ShopOutlined/>} title="Sales" count={transactionsAsSeller.length}/>
                    <Table columns={transactionColumns("buyer")} dataSource={transactionsAsSeller} size="middle"
                           scroll={{ x: "max-content" }}
                           pagination={{ pageSize: 5, hideOnSinglePage: true }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No sales yet"/> }}/>
                </Col>
                <Col xs={24} xl={12}>
                    <SectionTitleComponent icon={<ShoppingCartOutlined/>} title="Purchases" count={transactionsAsBuyer.length}/>
                    <Table columns={transactionColumns("seller")} dataSource={transactionsAsBuyer} size="middle"
                           scroll={{ x: "max-content" }}
                           pagination={{ pageSize: 5, hideOnSinglePage: true }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No purchases yet"/> }}/>
                </Col>
            </Row>
        </div>
    )
}

export default UserProfileComponent;
