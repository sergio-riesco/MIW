import { useState, useRef } from "react";
import { useRouter } from "next/router";
import {modifyStateProperty} from "../../../utils/UtilsState";
import {Card, Form, Input, Button , Typography } from "antd";
import { LoginOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from "next/link";
import { friendlyMessage } from "../../../utils/UtilsApi";
import {
    validateFormDataInputRequired,
    validateFormDataInputEmail,
    allowSubmitForm,
    setServerErrors,
    joinAllServerErrorMessages
 } from "../../../utils/UtilsValidations"
import IconTextComponent from "../IconTextComponent";

let LoginFormComponent = ({setLogin, openNotification}) => {
    let router = useRouter()

    // validación
    let requiredInForm = ["email","password"]
    let [formErrors, setFormErrors] = useState({})
 
    let [formData,setFormData] = useState({

    })

    let clickLogin = async () => {
        let response = await fetch(process.env.NEXT_PUBLIC_BACKEND_BASE_URL+"/users/login",{
            method: "POST",
            headers: { "Content-Type" : "application/json "},
            body: JSON.stringify(formData)
        })

        if (response.ok){
            let responseBody = await response.json();
            if ( responseBody.apiKey && responseBody.email){
                localStorage.setItem("apiKey",responseBody.apiKey)
                localStorage.setItem("email",responseBody.email)
            }
            console.log("ok "+responseBody)
            setLogin(true)
            openNotification("top", "Welcome back to Wallapep", "success", { message: "Logged in" })
            router.push("/products");
        } else {
            let responseBody = await response.json();
            let serverErrors = responseBody.errors;

            setServerErrors(serverErrors,setFormErrors)
            let notificationMsg = joinAllServerErrorMessages(serverErrors)
            // Mensaje descriptivo con la forma de solucionarlo (pauta 5.4)
            openNotification("top", friendlyMessage(notificationMsg), "error", { message: "Could not log in" })
        }

    }

    return (
        <div className="page-narrow">
                <Card title={<IconTextComponent icon={<LoginOutlined/>}>Login to Wallapep</IconTextComponent>}>
            {/* Texto clave destacado (pauta 1.6) */}
            <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
                Log in to <Typography.Text strong>buy, sell and follow your transactions</Typography.Text>.
            </Typography.Paragraph>
            <Form layout="vertical" size="large">
            <Form.Item label="Email" required key="email-input" extra="The email you used to register" validateStatus={
                validateFormDataInputEmail(
                    formData, "email", formErrors, setFormErrors) ? "success" : "error"}
                help={formErrors?.email?.msg}>
                <Input prefix={<MailOutlined/>} placeholder="name@example.com" type="email" inputMode="email"
                    autoComplete="email" allowClear maxLength={50}
                    value={formData.email}
                    onChange={(i) => {
                    modifyStateProperty(formData, setFormData,
                        "email", i.currentTarget.value.trim().toLowerCase())
                }}/>
            </Form.Item>

            <Form.Item label="Password" required validateStatus={
                validateFormDataInputRequired(
                    formData, "password", formErrors, setFormErrors) ? "success" : "error"}
                help={formErrors?.password?.msg}>
                <Input.Password prefix={<LockOutlined/>} autoComplete="current-password"
                    placeholder="your password"
                    onPressEnter={() => allowSubmitForm(formData,formErrors,requiredInForm) && clickLogin()}
                    onChange={(i) => {
                    modifyStateProperty(formData, setFormData,
                        "password", i.currentTarget.value)
                }}/>
            </Form.Item>


            <div className="form-actions">
                { allowSubmitForm(formData,formErrors,requiredInForm) ?
                    <Button type="primary" onClick={clickLogin} block >Login</Button> :
                    <Button type="primary" block disabled>Login</Button>
                }
                <div>
                    <Typography.Text type="secondary">Don't have an account? </Typography.Text>
                    <Link href="/register" style={{ color: "var(--wallapep-primary-dark)", fontWeight: 600 }}>Register</Link>
                </div>
            </div>
            </Form>
                </Card>
        </div>

    )
}

export default LoginFormComponent;
