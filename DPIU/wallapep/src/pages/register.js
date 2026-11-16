import CreateUserComponent from "./components/user/CreateUserComponent";

export default function RegisterPage({openNotification}) {

  return (
    <div>
      <CreateUserComponent openNotification={openNotification}/>
    </div>
  );
}
