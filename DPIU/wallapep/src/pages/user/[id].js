import { useRouter } from "next/router";
import UserProfileComponent from "../components/user/UserProfileComponent";

export default function UserProfilePage({openNotification}) {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <UserProfileComponent id = {id} openNotification={openNotification}/>
    </div>
  );
}
