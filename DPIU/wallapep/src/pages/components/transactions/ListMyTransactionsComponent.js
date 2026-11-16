import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Table, Tag, Typography, Row, Col, Segmented, Empty, Button } from 'antd';
import { SwapOutlined, ShoppingCartOutlined, ShopOutlined, RightOutlined, WalletOutlined, CreditCardOutlined,
    AppstoreOutlined } from '@ant-design/icons';
import { productImageUrl, onImageError } from "../../../utils/UtilsImages";
import { apiRequest } from "../../../utils/UtilsApi";
import { categories } from "../../../utils/UtilsCategories";
import { getLoggedUserId, transactionsSummary } from "../../../utils/UtilsUser";
import { formatPrice, plural } from "../../../utils/UtilsProducts";
import DateComponent from "../DateComponent";
import CategoryTagComponent from "../products/CategoryTagComponent";
import UserLinkComponent from "../user/UserLinkComponent";
import PageTitleComponent from "../PageTitleComponent";
import StatCardComponent from "../StatCardComponent";
import IconTextComponent from "../IconTextComponent";

const { Text } = Typography;

let ListMyTransactionsComponent = () => {
    let router = useRouter()
    let [transactions, setTransactions] = useState([])
    let [loading, setLoading] = useState(true)
    let [loggedUserId, setLoggedUserId] = useState(null)
    // Pestañas: todas, compras o ventas, con su número (pautas 3.8 y 3.21)
    let [tab, setTab] = useState("all")

    useEffect(() => {
        setLoggedUserId(getLoggedUserId())
        getMyTransactions();
    }, [])

    let getMyTransactions = async () => {
        let { ok, data, errors } = await apiRequest("GET", "/transactions/own")
        // tid es la id de la transacción (id es la del producto por el JOIN)
        if (ok)
            setTransactions(data.map(t => ({ ...t, key: t.tid })))
        else
            errors.forEach(e => console.log("Error: " + e.msg))
        setLoading(false)
    }

    let summary = transactionsSummary(transactions, loggedUserId)
    let purchases = transactions.filter(t => t.buyerId == loggedUserId)
    let sales = transactions.filter(t => t.sellerId == loggedUserId)
    let shown = tab == "purchases" ? purchases : tab == "sales" ? sales : transactions

    let columns = [
        {
            title: "Product",
            dataIndex: [],
            sorter: (a, b) => (a.title ?? "").localeCompare(b.title ?? ""),
            // Foto, título y categoría juntos: se reconoce el producto de un vistazo (pautas 3.3 y 1.12)
            filters: categories.map(c => ({ text: c.label, value: c.value })),
            onFilter: (value, t) => t.category == value,
            render: (t) => t.title == null ? <Text type="secondary">Deleted product</Text> :
                <Link href={"/detailProduct/" + t.productId} className="table-product">
                    <img className="table-thumb" src={productImageUrl(t.productId)} alt="" onError={onImageError} loading="lazy"/>
                    <span className="table-product-text">
                        <Text strong ellipsis={{ tooltip: t.title }} style={{ maxWidth: "min(220px, 36vw)" }}>{t.title}</Text>
                        <span className="table-product-sub"><CategoryTagComponent category={t.category} small/></span>
                    </span>
                </Link>
        },
        {
            title: "Price",
            dataIndex: "productPrice",
            align: "right",
            sorter: (a, b) => a.productPrice - b.productPrice,
            render: (price) => <Text strong style={{ fontSize: 16 }}>{formatPrice(price)}</Text>
        },
        {
            title: "Type",
            dataIndex: [],
            render: (t) => t.buyerId == loggedUserId ?
                <Tag color="blue" icon={<ShoppingCartOutlined/>}>Purchase</Tag> :
                <Tag color="green" icon={<ShopOutlined/>}>Sale</Tag>
        },
        {
            // Uno de los dos siempre soy yo: solo se muestra la otra persona
            title: "With",
            dataIndex: [],
            responsive: ['md'],
            render: (t) => t.buyerId == loggedUserId ?
                <UserLinkComponent userId={t.sellerId} email={t.sellerEmail} name={t.sellerName}/> :
                <UserLinkComponent userId={t.buyerId} email={t.buyerEmail} name={t.buyerName}/>
        },
        {
            title: "Date",
            dataIndex: "startDate",
            responsive: ['sm'],
            defaultSortOrder: "descend",
            sorter: (a, b) => (a.startDate ?? 0) - (b.startDate ?? 0),
            render: (date) => <DateComponent timestamp={date}/>
        },
        {
            // Sin botón "Details" repetido en cada fila: toda la fila lleva al detalle
            // y una flecha discreta lo indica (se resalta al pasar el ratón)
            title: "",
            dataIndex: "tid",
            width: 40,
            align: "right",
            render: () => <RightOutlined className="row-chevron" aria-hidden/>
        },
    ]

    return (
        <div>
            <PageTitleComponent icon={<SwapOutlined/>} title="My transactions"
                                extra={<Link href="/products"><Button icon={<AppstoreOutlined/>}>Browse products</Button></Link>}/>
            <Row gutter={[16, 16]} className="section">
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<ShoppingCartOutlined/>} title="Purchases" value={summary.purchases}
                                       note={summary.purchasesLastMonth + " last month"}/>
                </Col>
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<ShopOutlined/>} title="Sales" value={summary.sales}
                                       note={summary.salesLastMonth + " last month"}/>
                </Col>
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<CreditCardOutlined/>} title="Spent" value={formatPrice(summary.spent)}
                                       note={"in " + plural(summary.purchases, "purchase")}/>
                </Col>
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<WalletOutlined/>} title="Earned" value={formatPrice(summary.earned)}
                                       valueColor="var(--wallapep-primary-dark)" note={"in " + plural(summary.sales, "sale")}/>
                </Col>
            </Row>
            <div className="table-toolbar">
                <Segmented value={tab} onChange={setTab} options={[
                    { value: "all", label: `All (${transactions.length})` },
                    { value: "purchases", label: <IconTextComponent icon={<ShoppingCartOutlined/>} small>Purchases ({purchases.length})</IconTextComponent> },
                    { value: "sales", label: <IconTextComponent icon={<ShopOutlined/>} small>Sales ({sales.length})</IconTextComponent> },
                ]}/>
            </div>
            {/* Toda la fila es clicable para ver los detalles (pauta 3.1) */}
            <Table columns={columns} dataSource={shown} scroll={{ x: "max-content" }} loading={loading}
                   rowClassName="clickable-row"
                   onRow={(t) => ({ onClick: (e) => {
                       // los enlaces de dentro (producto, usuarios) mantienen su propio destino
                       if (!e.target.closest("a")) router.push("/detailTransaction/" + t.tid)
                   } })}
                   pagination={{ pageSize: 10, hideOnSinglePage: true }}
                   locale={{ emptyText: loading ? " " :
                       <Empty description={tab == "sales" ? "You have not sold anything yet" :
                           tab == "purchases" ? "You have not bought anything yet" : "You have not bought or sold any product yet"}>
                           {tab == "sales" ?
                               <Link href="/createProduct"><Button type="primary">Sell a product</Button></Link> :
                               <Link href="/products"><Button type="primary">Find something to buy</Button></Link>}
                       </Empty> }}></Table>
        </div>
    )
}

export default ListMyTransactionsComponent;
