import {useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Table, Space, InputNumber, Button, Tag, Typography, Row, Col, Empty, Dropdown, Modal, Segmented } from 'antd';
import { ShopOutlined, AppstoreOutlined, TagOutlined, WalletOutlined, EditOutlined, DeleteOutlined, CheckOutlined,
    CloseOutlined, PlusOutlined, MoreOutlined, EuroOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import Link from "next/link";
import { categories } from "../../../utils/UtilsCategories";
import { updateProduct, deleteProduct, formatPrice, plural } from "../../../utils/UtilsProducts";
import { apiRequest, withUndo } from "../../../utils/UtilsApi";
import { productImageUrl, onImageError } from "../../../utils/UtilsImages";
import CategoryTagComponent from "./CategoryTagComponent";
import UserLinkComponent from "../user/UserLinkComponent";
import PageTitleComponent from "../PageTitleComponent";
import DateComponent from "../DateComponent";
import StatCardComponent from "../StatCardComponent";

const { Text } = Typography;

let ListMyProductsComponent = ({openNotification}) => {
    let router = useRouter()
    let [products, setProducts] = useState([])
    // Mientras carga no se muestra el estado vacío ni ceros
    let [loading, setLoading] = useState(true)
    // Pestañas: todos, a la venta o vendidos (pautas 3.8 y 3.12)
    let [tab, setTab] = useState("all")
    // Selección para borrar varios a la vez (pauta 4.16)
    let [selectedIds, setSelectedIds] = useState([])
    // Edición del precio directamente en la tabla (pauta 4.14)
    let [editingPrice, setEditingPrice] = useState({ id: null, price: null })
    // Fila recién cambiada, se resalta un momento (pauta 3.4)
    let [flashId, setFlashId] = useState(null)
    let [modal, modalContextHolder] = Modal.useModal()
    // Borrados que todavía se pueden deshacer: al salir de la página se hacen ya
    let pendingCommits = useRef([])

    useEffect(() => {
        getMyProducts();
        return () => pendingCommits.current.forEach(commitNow => commitNow())
    }, [])

    let getMyProducts = async () => {
        let { ok, data, errors } = await apiRequest("GET", "/products/own/")
        if (ok)
            setProducts(data.map(p => ({ ...p, key: p.id })))
        else
            errors.forEach(e => openNotification?.("top", e.msg, "error"))
        setLoading(false)
    }

    // Borrar no se puede deshacer en el servidor: se pide confirmación y, además, durante unos segundos
    // se puede deshacer antes de enviarlo (pauta 5.3)
    let confirmDelete = (toDelete) => {
        let one = toDelete.length == 1
        modal.confirm({
            title: one ? `Delete "${toDelete[0].title}"?` : `Delete ${toDelete.length} products?`,
            icon: <ExclamationCircleFilled style={{ color: "#ff4d4f" }}/>,
            content: (one ? "The product" : "The products") + " will be removed from Wallapep. You will have a few seconds to undo it.",
            okText: "Delete",
            okButtonProps: { danger: true },
            cancelText: "Cancel",
            onOk: () => deleteWithUndo(toDelete),
        })
    }

    let deleteWithUndo = (toDelete) => {
        let ids = toDelete.map(p => p.id)
        // Posición original de cada producto, para devolverlos a su sitio al deshacer
        let originalOrder = products.map(p => p.id)
        let byOriginalOrder = (a, b) => originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id)
        setProducts(prev => prev.filter(p => !ids.includes(p.id)))
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
        let commitNow = withUndo({
            openNotification, key: "delete-" + ids.join("-"), seconds: 6,
            message: toDelete.length == 1 ? "Product deleted" : plural(toDelete.length, "product") + " deleted",
            description: toDelete.length == 1 ? `"${toDelete[0].title}" has been deleted.` : toDelete.map(p => p.title).join(", "),
            commit: async () => {
                for (let p of toDelete) {
                    let errors = await deleteProduct(p.id)
                    if (errors.length > 0) {
                        setProducts(prev => [...prev, p])
                        errors.forEach(e => openNotification?.("top", `"${p.title}" could not be deleted: ${e.msg}`, "error"))
                    }
                }
            },
            undo: () => {
                setProducts(prev => [...prev, ...toDelete].sort(byOriginalOrder))
                setFlashId(toDelete[0].id)
                openNotification?.("bottomLeft", "Nothing has been deleted", "info",
                    { key: "delete-" + ids.join("-"), message: "Undone", duration: 2 })
            },
        })
        pendingCommits.current.push(commitNow)
    }

    let savePrice = async (product) => {
        let errors = await updateProduct({ ...product, price: editingPrice.price })
        if (errors.length == 0) {
            setProducts(products.map(p => p.id == product.id ? { ...p, price: editingPrice.price } : p))
            setFlashId(product.id)
            openNotification?.("top", "Price of \"" + product.title + "\" updated to " + formatPrice(editingPrice.price), "success")
            setEditingPrice({ id: null, price: null })
        } else {
            errors.forEach(e => openNotification?.("top", e.msg, "error"))
        }
    }

    // El resaltado de la fila cambiada dura un momento
    useEffect(() => {
        if (flashId == null) return
        let t = setTimeout(() => setFlashId(null), 1600)
        return () => clearTimeout(t)
    }, [flashId])

    // Resumen antes de la tabla (pauta 3.25)
    let sold = products.filter(p => p.buyerId != null)
    let forSale = products.filter(p => p.buyerId == null)
    let earned = sold.reduce((total, p) => total + (p.price ?? 0), 0)
    let shown = tab == "sale" ? forSale : tab == "sold" ? sold : products
    let selectedForSale = forSale.filter(p => selectedIds.includes(p.id))

    let columns = [
        {
            // Foto, título y fecha juntos: menos columnas y se reconoce el producto de un vistazo (pautas 3.3 y 1.12)
            title: "Product",
            dataIndex: "title",
            sorter: (a, b) => (a.title ?? "").localeCompare(b.title ?? ""),
            render: (title, product) =>
                <Link href={"/detailProduct/" + product.id} className="table-product">
                    <img className="table-thumb" src={productImageUrl(product.id)} alt="" onError={onImageError} loading="lazy"/>
                    <span className="table-product-text">
                        <Text strong ellipsis={{ tooltip: title }} style={{ maxWidth: "min(240px, 40vw)" }}>{title}</Text>
                        <Text type="secondary" className="table-product-sub">
                            <DateComponent timestamp={product.date} icon={false}/>
                        </Text>
                    </span>
                </Link>
        },
        {
            title: "Category",
            dataIndex: "category",
            responsive: ['md'],
            filters: categories.map(c => ({ text: c.label, value: c.value })),
            onFilter: (value, product) => product.category == value,
            render: (category) => <CategoryTagComponent category={category} small/>
        },
        {
            // Números alineados a la derecha (pauta 3.11)
            title: "Price",
            dataIndex: "price",
            align: "right",
            sorter: (a, b) => a.price - b.price,
            render: (price, product) => editingPrice.id == product.id ?
                <Space.Compact>
                    <InputNumber min={0} max={1000000} precision={2} size="small" autoFocus addonAfter="€"
                                 value={editingPrice.price} style={{ width: 130 }} aria-label="New price"
                                 onChange={(value) => setEditingPrice({ id: product.id, price: value })}
                                 onPressEnter={() => savePrice(product)}/>
                    <Button size="small" type="primary" icon={<CheckOutlined/>} aria-label="Save price"
                            disabled={editingPrice.price == null} onClick={() => savePrice(product)}/>
                    <Button size="small" icon={<CloseOutlined/>} aria-label="Cancel"
                            onClick={() => setEditingPrice({ id: null, price: null })}/>
                </Space.Compact>
                :
                <Text strong style={{ fontSize: 16 }}>{formatPrice(price)}</Text>
        },
        {
            title: "Status",
            dataIndex: [],
            responsive: ['sm'],
            render: (product) => product.buyerId != null ?
                <Space direction="vertical" size={4}>
                    <Tag color="green" icon={<CheckOutlined/>}>Sold</Tag>
                    <UserLinkComponent userId={product.buyerId} email={product.buyerEmail} name={product.buyerName}/>
                </Space>
                :
                <Tag color="processing">For sale</Tag>
        },
        {
            // Acciones agrupadas en un menú "..." que solo se ve al pasar por la fila
            title: "",
            dataIndex: "id",
            align: "right",
            width: 56,
            // fija a la derecha: en móvil la tabla hace scroll pero el menú sigue a mano
            fixed: "right",
            render: (id, product) => {
                let isSold = product.buyerId != null
                return (
                    <Dropdown trigger={["click"]} placement="bottomRight" menu={{
                        items: [
                            { key: "edit", icon: <EditOutlined/>, label: "Edit" },
                            { key: "price", icon: <EuroOutlined/>, label: "Change price", disabled: isSold },
                            { type: "divider" },
                            { key: "delete", icon: <DeleteOutlined/>, danger: true, disabled: isSold,
                              label: isSold ? "Sold products cannot be deleted" : "Delete" },
                        ],
                        onClick: ({ key }) => {
                            if (key == "edit") router.push("/editProduct/" + id)
                            if (key == "price") setEditingPrice({ id: product.id, price: product.price })
                            if (key == "delete") confirmDelete([product])
                        }
                    }}>
                        <Button className="row-actions" type="text" icon={<MoreOutlined/>}
                                aria-label={"Actions for " + product.title}/>
                    </Dropdown>
                )
            }
        },
    ]

    return (
        <div>
            {modalContextHolder}
            <PageTitleComponent icon={<ShopOutlined/>} title="My products"
                                extra={<Link href="/createProduct">
                                    <Button type="primary" icon={<PlusOutlined/>}>Sell a product</Button>
                                </Link>}/>
            <Row gutter={[16, 16]} className="section">
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<AppstoreOutlined/>} title="Products" value={products.length} note="published"/>
                </Col>
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<TagOutlined/>} title="For sale" value={forSale.length}
                                       note="waiting for a buyer"/>
                </Col>
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<CheckOutlined/>} title="Sold" value={sold.length} note="already bought"/>
                </Col>
                <Col xs={12} md={6}>
                    <StatCardComponent icon={<WalletOutlined/>} title="Earned" value={formatPrice(earned)}
                                       valueColor="var(--wallapep-primary-dark)" note={"from " + plural(sold.length, "sale")}/>
                </Col>
            </Row>

            {/* Barra de la tabla: pestañas con el número de cada una (pautas 3.16 y 3.21) y acciones en lote */}
            <div className="table-toolbar">
                <Segmented value={tab} onChange={(v) => { setTab(v); setSelectedIds([]) }} options={[
                    { value: "all", label: `All (${products.length})` },
                    { value: "sale", label: `For sale (${forSale.length})` },
                    { value: "sold", label: `Sold (${sold.length})` },
                ]}/>
                {selectedForSale.length > 0 &&
                    <Space className="fade-in">
                        <Text>{plural(selectedForSale.length, "product")} selected</Text>
                        <Button danger icon={<DeleteOutlined/>} onClick={() => confirmDelete(selectedForSale)}>
                            Delete selected</Button>
                        <Button type="text" onClick={() => setSelectedIds([])}>Clear selection</Button>
                    </Space>}
            </div>

            <Table columns={columns} dataSource={shown} scroll={{ x: "max-content" }} loading={loading}
                   rowClassName={(p) => p.id == flashId ? "row-flash" : ""}
                   rowSelection={{
                       selectedRowKeys: selectedIds,
                       onChange: (keys) => setSelectedIds(keys),
                       // Los vendidos no se pueden borrar, así que no se pueden seleccionar
                       getCheckboxProps: (p) => ({ disabled: p.buyerId != null, title: p.buyerId != null ? "Sold products cannot be deleted" : "" }),
                   }}
                   pagination={{ pageSize: 10, hideOnSinglePage: true }}
                   locale={{ emptyText: loading ? " " : tab != "all" && products.length > 0 ?
                       <Empty description={tab == "sold" ? "You have not sold anything yet" : "Everything you published has been sold"}/> :
                       <Empty description="You are not selling anything yet">
                           <Link href="/createProduct"><Button type="primary">Sell your first product</Button></Link>
                       </Empty> }}></Table>

            {/* La acción principal se repite al final de la lista (pauta 3.7) */}
            {!loading && products.length > 0 &&
                <div className="list-end-action">
                    <Link href="/createProduct"><Button icon={<PlusOutlined/>}>Sell another product</Button></Link>
                </div>}
        </div>
    )
}

export default ListMyProductsComponent;
