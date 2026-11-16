import ListMyProductsComponent from "./components/products/ListMyProductsComponent";

export default function MyProductsPage({openNotification}) {

  return (
    <div>
      <ListMyProductsComponent openNotification={openNotification}/>
    </div>
  );
}
