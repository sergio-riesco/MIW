import CreateProductComponent from "./components/products/CreateProductComponent";

export default function CreateProductPage({openNotification}) {

  return (
    <div>
      <CreateProductComponent openNotification={openNotification}/>
    </div>
  );
}
