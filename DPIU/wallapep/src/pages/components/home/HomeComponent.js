import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Typography, Col, Row, Empty, Badge, Button, Space, Input, FloatButton } from 'antd';
import { ShoppingCartOutlined, PlusOutlined, RightOutlined, SafetyCertificateOutlined,
    ThunderboltOutlined, StarFilled, AppstoreOutlined } from '@ant-design/icons';
import { categories, otherCategory } from "../../../utils/UtilsCategories";
import { addImagesToProducts } from "../../../utils/UtilsImages";
import { getLoggedUserId } from "../../../utils/UtilsUser";
import { getViewedProducts } from "../../../utils/UtilsViewed";
import { isSold, productGridCol } from "../../../utils/UtilsProducts";
import ProductCardComponent from "../products/ProductCardComponent";
import SectionTitleComponent from "../SectionTitleComponent";
import IconTextComponent from "../IconTextComponent";

const { Title, Paragraph, Text } = Typography;

// Productos que se muestran por categoría en la home, el resto en "See all" (revelación progresiva)
const PRODUCTS_PER_CATEGORY = 4

let HomeComponent = () => {
    let router = useRouter()
    let [products, setProducts] = useState([])
    let [logged, setLogged] = useState(false)
    let [loggedUserId, setLoggedUserId] = useState(null)
    let [viewed, setViewed] = useState([])

    useEffect(() => {
        // GET /products requiere apiKey, sin login solo se muestran las categorías
        if (localStorage.getItem("apiKey") != null) {
            setLogged(true)
            setLoggedUserId(getLoggedUserId())
            setViewed(getViewedProducts())
            getProducts();
        }
    }, [])

    let getProducts = async () => {
        let response = await fetch(process.env.NEXT_PUBLIC_BACKEND_BASE_URL + "/products",
            {
                method: "GET",
                headers: {
                    "apikey": localStorage.getItem("apiKey")
                },
            });

        if (response.ok) {
            let jsonData = await response.json();
            // Solo los que siguen a la venta (sin comprador), los más nuevos primero
            let productsForSale = jsonData.filter(p => !isSold(p))
                .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
            setProducts(addImagesToProducts(productsForSale))
        } else {
            let responseBody = await response.json();
            let serverErrors = responseBody.errors;
            serverErrors.forEach(e => {
                console.log("Error: " + e.msg)
            })
        }
    }

    // Categorías hardcodeadas + "Other" para los productos antiguos sin categoría conocida
    let categoriesToShow = [...categories]
    if (products.some(p => !categories.find(c => c.value == p.category))) {
        categoriesToShow.push(otherCategory)
    }

    let productsOfCategory = (categoryValue) => {
        if (categoryValue == null)
            return products.filter(p => !categories.find(c => c.value == p.category))
        return products.filter(p => p.category == categoryValue)
    }

    let categoryHref = (c) => logged && c.value != null ? "/products?category=" + c.value :
        logged ? "#category-" + c.label : "/login"

    return (
        <div>
            {/* Presentación: qué es la aplicación, búsqueda y una sola acción principal (pautas 1.8, 1.9 y 3.12).
                Fondo suave en lugar de un bloque de color intenso (pauta 1.5) */}
            <div className="section home-hero">
                <Row align="middle" gutter={[32, 24]}>
                    <Col xs={24} md={15}>
                        <Title style={{ margin: "0 0 16px 0" }}>
                            Buy and sell second-hand products near you
                        </Title>
                        <Paragraph type="secondary" style={{ fontSize: 17, maxWidth: 560, marginBottom: 24 }}>
                            Wallapep is a marketplace where you can sell the things you no longer use and find
                            great deals from other people.
                        </Paragraph>
                        {logged ?
                            <>
                                <Input.Search size="large" placeholder="What are you looking for? e.g. bike, iPhone..."
                                              enterButton="Search" allowClear className="home-search"
                                              onSearch={(text) => router.push(text ? "/products?title=" + encodeURIComponent(text) : "/products")}/>
                                <Space wrap style={{ marginTop: 16 }}>
                                    <Link href="/createProduct">
                                        <Button type="primary" size="large" icon={<PlusOutlined/>}>Sell a product</Button>
                                    </Link>
                                    <Link href="/products">
                                        <Button type="link" size="large" icon={<ShoppingCartOutlined/>}>Browse all products</Button>
                                    </Link>
                                </Space>
                            </>
                            :
                            <Space wrap>
                                <Link href="/register">
                                    <Button type="primary" size="large">Create a free account</Button>
                                </Link>
                                <Link href="/login"><Button type="link" size="large">Login</Button></Link>
                            </Space>
                        }
                    </Col>
                    <Col xs={0} md={9}>
                        <Space direction="vertical" size="middle" className="home-hero-points">
                            <IconTextComponent icon={<PlusOutlined/>}>Publish a product with photos in seconds</IconTextComponent>
                            <IconTextComponent icon={<StarFilled/>}>Check the seller's reputation before buying</IconTextComponent>
                            <IconTextComponent icon={<ThunderboltOutlined/>}>Buy it in one click, and undo it if you change your mind</IconTextComponent>
                            <IconTextComponent icon={<SafetyCertificateOutlined/>}>Follow your purchases and sales</IconTextComponent>
                        </Space>
                    </Col>
                </Row>
            </div>

            {/* Categorías con icono y número de productos (pautas 3.3 y 3.21) */}
            <section className="section">
            <SectionTitleComponent icon={<AppstoreOutlined/>} title="Categories"/>
            <div className="category-strip">
                {categoriesToShow.map(c =>
                    <Link key={c.label} href={categoryHref(c)} className="category-bubble">
                        <Badge count={logged ? productsOfCategory(c.value).length : 0} showZero={logged}
                               color="var(--wallapep-text)" offset={[-4, 4]}>
                            <span className="category-bubble-icon">{c.icon}</span>
                        </Badge>
                        <Text>{c.label}</Text>
                    </Link>
                )}
            </div>
            </section>

            {!logged &&
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                       description={<span><Link href="/login">Login</Link> or <Link href="/register">register</Link> to
                           see the products for sale in each category</span>}/>
            }

            {logged && categoriesToShow.map(c =>
                <section key={c.label} id={"category-" + c.label} className="section">
                    <SectionTitleComponent icon={c.icon} title={c.label} count={productsOfCategory(c.value).length}
                        extra={c.value != null && productsOfCategory(c.value).length > PRODUCTS_PER_CATEGORY &&
                            <Link href={"/products?category=" + c.value}>See all <RightOutlined/></Link>}/>
                    {productsOfCategory(c.value).length == 0 ?
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} className="category-empty"
                               description={"No products for sale in " + c.label + " yet"}>
                            <Link href="/createProduct"><Button>Be the first to sell one</Button></Link>
                        </Empty>
                        :
                        <Row gutter={[16, 16]}>
                            {productsOfCategory(c.value).slice(0, PRODUCTS_PER_CATEGORY).map(p =>
                                <Col {...productGridCol} key={p.id}>
                                    <ProductCardComponent product={p} loggedUserId={loggedUserId}
                                                          viewed={viewed.includes(p.id)}/>
                                </Col>
                            )}
                        </Row>
                    }
                </section>
            )}
            {/* Volver arriba en una página larga (pauta 3.15) */}
            <FloatButton.BackTop tooltip="Back to top"/>
        </div>
    )
}

export default HomeComponent;
