import { useRouter } from "next/router";
import Link from "next/link";
import { Breadcrumb } from "antd";
import DetailsTransactionComponent from "../components/transactions/DetailsTransactionComponent";

export default function DetailsTransactionPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="page-medium">
      <Breadcrumb className="page-breadcrumb" items={[
          { title: <Link href="/transactions">My transactions</Link> },
          { title: "Transaction " + (id ?? "") },
      ]}/>
      <DetailsTransactionComponent id = {id}/>
    </div>
  );
}
