import { useRouter } from "next/router";
import Link from "next/link";
import { Breadcrumb } from "antd";
import EditProductFormComponent from "../components/products/EditProductFormComponent";

export default function EditProductPage({openNotification}) {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="page-wide">
      <Breadcrumb className="page-breadcrumb" items={[
          { title: <Link href="/myProducts">My Products</Link> },
          { title: "Edit product " + (id ?? "") },
      ]}/>
      <EditProductFormComponent id = {id} openNotification={openNotification}/>
    </div>
  );
}
