import "@/styles/globals.css";
import Link from "next/link";
import 'antd/dist/reset.css';
import { Layout, Menu, Avatar, Typography, Button, Input, Dropdown, ConfigProvider, Grid, Space, notification } from 'antd';
import { LoginOutlined, UserAddOutlined, AppstoreOutlined, PlusOutlined,
    ShopOutlined, SwapOutlined, LogoutOutlined, UserOutlined, DownOutlined } from '@ant-design/icons';
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";
import { Provider } from "react-redux";
import store from "../reducers/store"
import { getLoggedUserId } from "../utils/UtilsUser";

const { Text } = Typography;
const { useBreakpoint } = Grid;

// Identidad propia de Wallapep: violeta como color de marca (no se confunde con los colores
// con significado: verde vendido, azul a la venta, rojo errores), tipografía Plus Jakarta Sans
// y esquinas redondeadas (no pastillas). Los mismos valores están como variables en globals.css.
const brand = { primary: "#5b3fd9", primaryDark: "#4a2fc0", ink: "#221f33" }
const theme = {
    token: {
        colorPrimary: brand.primary,
        colorLink: brand.primaryDark,
        colorText: brand.ink,
        // Más contraste (WCAG AA): texto secundario ≥ 4.5:1 y bordes de los controles ≥ 3:1 sobre blanco
        colorTextSecondary: "#3f3c52",
        colorTextTertiary: "#5b5870",
        colorTextQuaternary: "#6f6c84",
        colorTextPlaceholder: "#6f6c84",
        colorTextDisabled: "#7d7a90",
        colorBorder: "#8f8aa6",
        colorBorderSecondary: "#d1cce0",
        colorSplit: "#d1cce0",
        borderRadius: 10,
        borderRadiusLG: 14,
        fontSize: 15,
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    components: {
        Button: { controlHeightLG: 46, fontWeight: 600, primaryShadow: "none" },
        Card: { paddingLG: 24 },
        Menu: { itemColor: brand.ink, horizontalItemSelectedColor: brand.primaryDark },
        Tag: { borderRadiusSM: 6 },
    }
}

export default function App({ Component, pageProps }) {
    const [api, contextHolder] = notification.useNotification();
    const screens = useBreakpoint();

    const pathname = usePathname();
    let router = useRouter()
    let [login, setLogin] = useState(false);
    let [charUser,setCharUser] = useState("a")
    let [loggedUserId, setLoggedUserId] = useState(null)
    let [searchText, setSearchText] = useState("")

    useEffect(() => {
        checkAll();
    }, [])

    // Al cambiar el login se actualiza el avatar de la cabecera
    useEffect(() => {
        setCharUser(localStorage.getItem("email")?.charAt(0).toUpperCase())
        setLoggedUserId(getLoggedUserId())
    }, [login])

    // La caja de búsqueda refleja la búsqueda actual del listado
    useEffect(() => {
        setSearchText(router.query.title ?? "")
    }, [router.query.title])

    let checkAll = async () => {
        let isActive = await checkLoginIsActive()
        checkUserAccess(isActive)
    }

    let checkUserAccess= async (isActive) => {
        if (!isActive && !["/", "/login", "/register"].includes(pathname)) {
            router.push("/login");
        }
    }

    let checkLoginIsActive = async () => {
        if(localStorage.getItem("apiKey") == null){
            setLogin(false);
            return;
        }

        let response = await fetch(
            process.env.NEXT_PUBLIC_BACKEND_BASE_URL + "/users/isActiveApiKey",
            {
                method: "GET",
                headers: {
                    "apikey": localStorage.getItem("apiKey")
                }
            });

        if (response.ok) {
            let jsonData = await response.json();
            setLogin(jsonData.activeApiKey)

            if (!jsonData.activeApiKey){
                router.push("/login")
            }
            return(jsonData.activeApiKey)
        } else {
            setLogin(false)
            router.push("/login")
            return (false)
        }
    }


    let disconnect = async () => {
        await fetch(
            process.env.NEXT_PUBLIC_BACKEND_BASE_URL +"/users/disconnect",
            {
                method: "GET",
                headers: {
                    "apikey": localStorage.getItem("apiKey")
                }
            });

        localStorage.removeItem("apiKey");
        localStorage.removeItem("email");
        setLogin(false)
        openNotification("top", "You have been disconnected", "info")
        router.push("/login")
    }

    // Búsqueda de la cabecera: lleva al listado con el título como filtro
    let search = (text) => {
        if (!login) {
            router.push("/login")
            return
        }
        router.push(text ? "/products?title=" + encodeURIComponent(text) : "/products")
    }

  let { Header, Content, Footer } = Layout;

  // extra permite pasar más opciones de antd (key, btn, duration...), por ejemplo para "Deshacer"
  const openNotification = (placement, text, type, extra = {}) => {
        api[type]({
            message: extra.message ?? type.charAt(0).toUpperCase() + type.slice(1),
            description: text,
            placement,
            ...extra,
        });
    };

    // Opción del menú resaltada según la página actual (pauta 3.23)
    let menuKeyByPath = [
        ["/products", "menuProducts"], ["/detailProduct", "menuProducts"],
        ["/myProducts", "menuMyProduct"], ["/editProduct", "menuMyProduct"],
        ["/transactions", "menuTransactions"], ["/detailTransaction", "menuTransactions"],
    ]
    let selectedMenuKey = menuKeyByPath.find(([path]) => pathname?.startsWith(path))?.[1]

    // Pocas opciones visibles (pauta 1.11): las menos usadas van en el menú del avatar
    let userMenuItems = [
        { key: "profile", icon: <UserOutlined/>, label: <Link href={"/user/" + loggedUserId}>My profile</Link> },
        { key: "myProducts", icon: <ShopOutlined/>, label: <Link href="/myProducts">My products</Link> },
        { key: "transactions", icon: <SwapOutlined/>, label: <Link href="/transactions">My transactions</Link> },
        { type: "divider" },
        { key: "disconnect", icon: <LogoutOutlined/>, danger: true, label: "Disconnect", onClick: disconnect },
    ]

  return (
    <Provider store={store}>
      <Head>
          <title>Wallapep - buy and sell second-hand products</title>
          <meta name="description" content="Buy and sell second-hand products" />
          <link rel="icon" href="/logo.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
      </Head>
      <ConfigProvider theme={theme}>
      <Layout className="layout" style={{ minHeight: "100vh", background: "#fff" }}>
        {contextHolder}
          {/* Cabecera fija arriba (pauta 2.1): logo a la izquierda, búsqueda, menú y acción principal */}
          {/* Cabecera, contenido y pie comparten ancho máximo y margen lateral para que todo quede alineado */}
          <Header className="app-header">
            <div className="app-header-inner">
                {/* El logo siempre lleva a la página principal */}
                <Link href="/" title="Wallapep home" aria-current={pathname == "/" ? "page" : undefined}
                      className={"app-logo" + (pathname == "/" ? " app-logo-active" : "")}>
                    <img src="/logo.png" alt="Wallapep" width="40" height="40"/>
                    {screens.lg && <Text strong style={{ fontSize: 22, color: "var(--wallapep-primary)", letterSpacing: "-0.02em" }}>wallapep</Text>}
                </Link>

                <Input.Search placeholder="Search in all categories" allowClear size="large"
                              value={searchText} onChange={(e) => setSearchText(e.target.value)}
                              onSearch={search} style={{ flex: 1, maxWidth: 560 }}/>

                {login && screens.md &&
                    <Menu mode="horizontal" selectedKeys={[selectedMenuKey]} className="app-menu"
                          style={{ flex: "none", borderBottom: "none", minWidth: screens.xl ? 420 : 168 }}
                          items={ [
                        { key:"menuProducts", icon: <AppstoreOutlined/>, title: "Products",
                          label: <Link href="/products" title="Products" aria-label="Products">{screens.xl && "Products"}</Link>},
                        { key:"menuMyProduct", icon: <ShopOutlined/>, title: "My products",
                          label: <Link href="/myProducts" title="My products" aria-label="My products">{screens.xl && "My products"}</Link> },
                        { key:"menuTransactions", icon: <SwapOutlined/>, title: "Transactions",
                          label: <Link href="/transactions" title="Transactions" aria-label="Transactions">{screens.xl && "Transactions"}</Link> },
                    ]}/>
                }

                <div style={{ flex: "none", marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    { login ? (
                        <>
                            {/* Tarea principal destacada (pautas 1.9 y 1.10) */}
                            <Link href="/createProduct">
                                <Button type="primary" size="large" icon={<PlusOutlined/>}>
                                    {screens.sm && "Sell"}
                                </Button>
                            </Link>
                            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
                                <Space style={{ cursor: "pointer" }}>
                                    <Avatar size="large" style={{ backgroundColor: "var(--wallapep-text)" }}>{ charUser }</Avatar>
                                    {screens.md && <DownOutlined style={{ fontSize: 12 }}/>}
                                </Space>
                            </Dropdown>
                        </>
                    ) : (
                        <>
                            {/* El botón de la página actual se resalta (pauta 3.23) */}
                            <Link href="/login"><Button size="large" icon={<LoginOutlined/>}
                                                         type={pathname == "/login" ? "primary" : "default"}>
                                {screens.sm && "Login"}</Button></Link>
                            <Link href="/register"><Button type={pathname == "/login" ? "default" : "primary"} size="large" icon={<UserAddOutlined/>}>
                                {screens.sm && "Register"}</Button></Link>
                        </>
                    )}
                </div>
            </div>
          </Header>
          <Content className="app-content">
              <Component {...pageProps} setLogin={setLogin} openNotification={openNotification} />
          </Content>
          <Footer className="app-footer">
              <div className="app-footer-inner">Wallapep · buy and sell second-hand products</div>
          </Footer>
      </Layout>
      </ConfigProvider>
    </Provider>
  )
}
