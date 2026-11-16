import ListProductsComponent from "./components/products/ListProductsComponent";

export default function ProductsPage({openNotification}) {

  return (
    <div>
      <ListProductsComponent openNotification={openNotification}/>
    </div>
  );
}
