import { useRouter } from "next/router";
import Link from "next/link";
import { Breadcrumb } from "antd";
import DetailsProductComponent from "../components/products/DetailsProductComponent";

export default function DetailsProductPage({openNotification}) {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <Breadcrumb className="page-breadcrumb" items={[
          { title: <Link href="/products">Products</Link> },
          { title: "Product " + (id ?? "") },
      ]}/>
      <DetailsProductComponent id = {id} openNotification={openNotification}/>
    </div>
  );
}
