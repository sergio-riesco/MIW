import LoginFormComponent from "./components/user/LoginFormComponent";

export default function LoginPage({setLogin, openNotification}) {

  return (
    <div>
      <LoginFormComponent setLogin={setLogin} 
        openNotification={openNotification}/>
    </div>
  );
}