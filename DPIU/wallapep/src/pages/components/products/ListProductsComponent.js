import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Col, Row, Input, InputNumber, Empty, Button, Typography, Space, Tag, Segmented, Switch,
    Pagination, AutoComplete, Skeleton } from 'antd';
import { AppstoreOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { categories, getCategory } from "../../../utils/UtilsCategories";
import { addImagesToProducts } from "../../../utils/UtilsImages";
import { formatPrice, isSold, productGridCol, plural } from "../../../utils/UtilsProducts";
import { apiRequest } from "../../../utils/UtilsApi";
import { buyWithUndo } from "../../../utils/UtilsPurchase";
import { getLoggedUserId } from "../../../utils/UtilsUser";
import { getViewedProducts } from "../../../utils/UtilsViewed";
import ProductCardComponent from "./ProductCardComponent";
import PageTitleComponent from "../PageTitleComponent";

const { Text } = Typography;
const { CheckableTag } = Tag;

const PAGE_SIZE = 12

const emptyFilters = {
    category: undefined,
    title: "",
    minPrice: null,
    maxPrice: null,
    onlyForSale: true,
}

let ListProductsComponent = ({openNotification}) => {
  let router = useRouter()
  let [products, setProducts] = useState([]);
  let [loading, setLoading] = useState(true);
  let [filters, setFilters] = useState(emptyFilters);
  let [order, setOrder] = useState("newest");
  let [page, setPage] = useState(1);
  let [loggedUserId, setLoggedUserId] = useState(null)
  let [viewed, setViewed] = useState([])

  useEffect(() => {
    setLoggedUserId(getLoggedUserId())
    setViewed(getViewedProducts())
    getProducts();
  }, []);

  // Se puede llegar desde la home (?category=) o desde la búsqueda de la cabecera (?title=)
  useEffect(() => {
    if (!router.isReady) return
    setFilters({ ...emptyFilters, category: router.query.category, title: router.query.title ?? "" })
    setPage(1)
  }, [router.isReady, router.query.category, router.query.title]);


  let getProducts = async () => {
    let { ok, data, errors } = await apiRequest("GET", "/products")
    if (ok)
      setProducts(addImagesToProducts(data))
    else
      errors.forEach(e => openNotification?.("top", e.msg, "error"))
    setLoading(false)
  };

  // Compra con "Deshacer" (pauta 5.3)
  let clickBuy = (product) => buyWithUndo({
      product, openNotification,
      onBought: () => setProducts(prev => prev.map(p => p.id == product.id ? { ...p, buyerId: loggedUserId } : p)),
      onUndone: () => setProducts(prev => prev.map(p => p.id == product.id ? { ...p, buyerId: null, buyerEmail: null } : p)),
  })

  let modifyFilter = (key, value) => {
      setFilters({
          ...filters,
          [key]: value
      })
      setPage(1)
  }

  // Filtrado en el frontend, todos los filtros se aplican a la vez (combinados)
  let matches = (p, f) => {
      if (f.onlyForSale && isSold(p))
          return false
      if (f.category != null && p.category != f.category)
          return false
      if (f.title != "" && !p.title?.toLowerCase().includes(f.title.toLowerCase()))
          return false
      if (f.minPrice != null && p.price < f.minPrice)
          return false
      if (f.maxPrice != null && p.price > f.maxPrice)
          return false
      return true
  }

  let filteredProducts = products.filter(p => matches(p, filters))

  let sortedProducts = [...filteredProducts].sort((a, b) => {
      if (order == "priceAsc") return a.price - b.price
      if (order == "priceDesc") return b.price - a.price
      return (b.date ?? 0) - (a.date ?? 0)
  })

  let pageProducts = sortedProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Número de resultados de cada categoría con el resto de filtros aplicados (pautas 3.16 y 3.21)
  let countForCategory = (category) => products.filter(p => matches(p, { ...filters, category })).length

  // Sugerencias al escribir el título (pauta 4.9) con cuántos resultados da cada una (previsualización, pauta 3.26)
  let titleSuggestions = filters.title.length > 0 ?
      [...new Set(products.map(p => p.title).filter(t => t?.toLowerCase().includes(filters.title.toLowerCase())))]
          .slice(0, 6).map(t => {
              let n = products.filter(p => matches(p, { ...filters, title: t })).length
              return { value: t, label: <span className="suggestion"><span>{t}</span>
                  <Text type="secondary">{plural(n, "result")}</Text></span> }
          }) : []

  // Filtros aplicados, cada uno se puede quitar por separado (pauta 4.18)
  let appliedFilters = []
  if (filters.title != "")
      appliedFilters.push({ key: "title", label: `"${filters.title}"`, reset: "" })
  if (filters.category != null)
      appliedFilters.push({ key: "category", label: getCategory(filters.category).label, reset: undefined })
  if (filters.minPrice != null)
      appliedFilters.push({ key: "minPrice", label: "From " + formatPrice(filters.minPrice), reset: null })
  if (filters.maxPrice != null)
      appliedFilters.push({ key: "maxPrice", label: "Up to " + formatPrice(filters.maxPrice), reset: null })
  if (!filters.onlyForSale)
      appliedFilters.push({ key: "onlyForSale", label: "Including sold", reset: true })

  let clearFilters = () => {
      setFilters(emptyFilters)
      setPage(1)
  }

  return (
    <div>
      <PageTitleComponent icon={<AppstoreOutlined/>} title="Products"/>

      {/* Todos los filtros juntos en un bloque, separados entre sí por 16px */}
      <div className="list-filters">
      {/* Búsqueda por título: botón de buscar a la derecha del campo (pauta 2.4) */}
      <AutoComplete options={titleSuggestions} value={filters.title} style={{ width: "100%", maxWidth: 600 }}
                    onChange={(value) => modifyFilter("title", value ?? "")}
                    onSelect={(value) => modifyFilter("title", value)}>
          <Input.Search size="large" allowClear enterButton="Search" aria-label="Search products by title"
                        placeholder="What are you looking for? e.g. bike, iPhone..."
                        onSearch={(value) => modifyFilter("title", value ?? "")}/>
      </AutoComplete>

      {/* Categorías como chips en vez de un desplegable (pauta 4.8), con su número de productos */}
      <div className="category-strip">
          <CheckableTag className="filter-chip" checked={filters.category == null}
                        onChange={() => modifyFilter("category", undefined)}>
              All ({products.filter(p => matches(p, { ...filters, category: undefined })).length})
          </CheckableTag>
          {categories.map(c =>
              <CheckableTag key={c.value} className="filter-chip" checked={filters.category == c.value}
                            onChange={(checked) => modifyFilter("category", checked ? c.value : undefined)}>
                  {c.icon} {c.label} ({countForCategory(c.value)})
              </CheckableTag>
          )}
      </div>

      {/* Cada filtro con su etiqueta, para que se entienda de un vistazo (pauta 1.2) */}
      <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={10} lg={8}>
              <Text type="secondary" className="filter-label">Price</Text>
              <Space.Compact style={{ width: "100%" }}>
                  <InputNumber placeholder="Min price" min={0} style={{ width: "50%" }} addonAfter="€"
                               value={filters.minPrice}
                               onChange={(value) => modifyFilter("minPrice", value)}/>
                  <InputNumber placeholder="Max price" min={filters.minPrice ?? 0} style={{ width: "50%" }} addonAfter="€"
                               value={filters.maxPrice}
                               onChange={(value) => modifyFilter("maxPrice", value)}/>
              </Space.Compact>
          </Col>
          <Col xs={24} md={6} lg={5}>
              <Text type="secondary" className="filter-label">Status</Text>
              <Space style={{ height: 32 }}>
                  <Switch checked={filters.onlyForSale} onChange={(checked) => modifyFilter("onlyForSale", checked)}/>
                  <Text>Only for sale</Text>
              </Space>
          </Col>
          <Col xs={24} md={8} lg={11} className="list-order">
              <Text type="secondary" className="filter-label">Sort by</Text>
              <Segmented value={order} onChange={setOrder}
                         options={[
                             { value: "newest", label: "Newest" },
                             { value: "priceAsc", label: "Cheapest" },
                             { value: "priceDesc", label: "Most expensive" },
                         ]}/>
          </Col>
      </Row>
      </div>

      {/* Número de resultados siempre visible y filtros aplicados (pautas 3.16 y 4.18) */}
      <div className="list-results">
          <Text strong style={{ fontSize: 16 }}>{loading ? "Loading products…" : plural(sortedProducts.length, "result")}</Text>
          {appliedFilters.map(f =>
              <Tag key={f.key} closable onClose={(e) => { e.preventDefault(); modifyFilter(f.key, f.reset) }}
                   color="purple" className="applied-filter">
                  {f.label}
              </Tag>
          )}
          {appliedFilters.length > 0 &&
              <Button type="link" size="small" icon={<CloseOutlined/>} onClick={clearFilters}>Clear all</Button>}
      </div>

      {/* Esqueleto con la misma forma que el grid de cards */}
      {loading &&
          <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map(i =>
                  <Col {...productGridCol} key={i}>
                      <div className="skeleton-block" style={{ aspectRatio: "1 / 1" }}/>
                      <Skeleton active title={false} paragraph={{ rows: 3 }} style={{ marginTop: 16 }}/>
                  </Col>)}
          </Row>}

      {/* Diseño específico para 0 resultados con alternativas (pauta 3.17) */}
      { !loading && sortedProducts.length == 0 &&
          <Empty description={<span>No products match your search.<br/>Try other words, another category or a wider price range.</span>}>
              <Space wrap>
                  {appliedFilters.length > 0 && <Button type="primary" onClick={clearFilters}>Clear filters</Button>}
                  {filters.onlyForSale && <Button onClick={() => modifyFilter("onlyForSale", false)}>Include sold products</Button>}
              </Space>
          </Empty>
      }

      <Row gutter={ [16, 16] } className="fade-in" key={page + JSON.stringify(filters) + order}>
            { pageProducts.map( p =>
                <Col {...productGridCol} key={p.id}>
                    <ProductCardComponent product={p} loggedUserId={loggedUserId} onBuy={clickBuy}
                                          viewed={viewed.includes(p.id)}/>
                </Col>
             )}
      </Row>

      {/* Paginación para evitar el scroll excesivo (pauta 3.15) */}
      {sortedProducts.length > PAGE_SIZE &&
          <Pagination style={{ marginTop: 32, textAlign: "center", justifyContent: "center" }}
                      current={page} pageSize={PAGE_SIZE} total={sortedProducts.length} showSizeChanger={false}
                      onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }) }}/>
      }
    </div>
  );
};

export default ListProductsComponent;
