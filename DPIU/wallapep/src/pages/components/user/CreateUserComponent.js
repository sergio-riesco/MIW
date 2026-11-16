import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { modifyStateProperty} from "../../../utils/UtilsState";
import { countryOptions } from "../../../utils/UtilsCountries";
import { Card, Col, Row, Form, Input, Button, DatePicker, Select, Radio, Collapse, Typography, AutoComplete } from "antd";
import { cleanName } from "../../../utils/UtilsText";
import { apiRequest } from "../../../utils/UtilsApi";
import { UserAddOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import IconTextComponent from "../IconTextComponent";

const { Text } = Typography;

let CreateUserComponent = ({openNotification}) => {
    let router = useRouter()

    // España por defecto, el valor más habitual (pauta 4.6)
    let [formData,setFormData] = useState({
        email: '',
        password : '',
        country: 'Spain',
    })

    // email y password son los únicos obligatorios (los valida el backend), el resto son opcionales
    let validEmail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)
    let validPassword = formData.password.length >= 3
    let requiredFilled = validEmail && validPassword

    let clickCreate = async () => {
        let user = { ...formData, name: formData.name && cleanName(formData.name),
            surname: formData.surname && cleanName(formData.surname),
            address: formData.address?.replace(/\s+/g, " ").trim() }
        let { ok, errors } = await apiRequest("POST", "/users", user)
        if (ok){
            openNotification?.("top", "Your account has been created, you can login now", "success", { message: "Welcome to Wallapep" })
            router.push("/login")
        } else {
            errors.forEach(e => openNotification?.("top", e.msg, "error", { message: "Could not create the account" }))
        }
    }

    // Sugerencias de dominio al escribir el email (pauta 4.9)
    let emailSuggestions = /^[^@\s]+(@[^@\s]*)?$/.test(formData.email) ?
        ["gmail.com", "hotmail.com", "outlook.com", "yahoo.es", "uniovi.es"]
            .map(d => formData.email.split("@")[0] + "@" + d)
            .filter(e => e.startsWith(formData.email) && e != formData.email)
            .map(e => ({ value: e })) : []
    let age = formData.birthday ? dayjs().diff(dayjs(formData.birthday), "year") : null

    // Estado de validación en línea: nada si está vacío, error o válido (pauta 4.13)
    let status = (value, valid) => value == '' ? "" : valid ? "success" : "error"

    // Los datos opcionales se muestran en un formulario desplegable (pauta 4.2)
    let optionalFields = (
        <Row gutter={16}>
            <Col xs={24} sm={12}>
                <Form.Item label="Name">
                    <Input placeholder="e.g. Ana" maxLength={50} allowClear
                           onChange={(i) => modifyStateProperty(formData, setFormData,
                               "name", i.currentTarget.value)}/>
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item label="Surname">
                    <Input placeholder="e.g. García Pérez" maxLength={50} allowClear
                           onChange={(i) => modifyStateProperty(formData, setFormData,
                               "surname", i.currentTarget.value)}/>
                </Form.Item>
            </Col>

            {/* País con búsqueda escribiendo o seleccionando de la lista (pauta 3.19) */}
            <Col xs={24} sm={12}>
                <Form.Item label="Country">
                    <Select placeholder="type to search a country" showSearch allowClear
                            options={countryOptions} optionFilterProp="label" value={formData.country}
                            onChange={(value) => modifyStateProperty(formData, setFormData,
                                "country", value)}/>
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item label="Birthday" extra={age != null ? "You are " + age + " years old" : ""}>
                    <DatePicker placeholder="YYYY/MM/DD" style={{ width: "100%" }}
                                format="YYYY/MM/DD"
                                disabledDate={(date) => date && date.isAfter(dayjs())}
                                onChange={(date) => modifyStateProperty(formData, setFormData,
                                    "birthday", date ? date.valueOf() : undefined)}/>
                </Form.Item>
            </Col>

            <Col xs={24} sm={16}>
                <Form.Item label="Address" extra="Used as shipping address when you buy">
                    <Input placeholder="e.g. Calle Uría 10, 3ºA" maxLength={50} allowClear
                           onChange={(i) => modifyStateProperty(formData, setFormData,
                               "address", i.currentTarget.value)}/>
                </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
                <Form.Item label="Postal code" extra="Numbers only">
                    <Input placeholder="e.g. 33003" maxLength={10} inputMode="numeric"
                           value={formData.postalCode}
                           onChange={(i) => modifyStateProperty(formData, setFormData,
                               "postalCode", i.currentTarget.value.replace(/\D/g, ""))}/>
                </Form.Item>
            </Col>

            {/* Pocas opciones: botones visibles en vez de desplegable (pauta 4.8).
                Ocupan una fila entera y se reparten el ancho para que no salten de línea */}
            <Col xs={24} sm={12}>
                <Form.Item label="Identity document">
                    <Radio.Group optionType="button" buttonStyle="solid" block
                                 style={{ display: "flex", width: "100%" }}
                                 options={[{ label: "DNI", value: "DNI" }, { label: "NIE", value: "NIE" },
                                     { label: "Passport", value: "Passport" }].map(o =>
                                     ({ ...o, style: { flex: 1, textAlign: "center", paddingInline: 8 } }))}
                                 onChange={(e) => modifyStateProperty(formData, setFormData,
                                     "documentIdentity", e.target.value)}/>
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item label="Document number">
                    <Input placeholder="e.g. 71234567Z" maxLength={20} allowClear
                           onChange={(i) => modifyStateProperty(formData, setFormData,
                               "documentNumber", i.currentTarget.value.toUpperCase())}/>
                </Form.Item>
            </Col>
        </Row>
    )

    return (
        <div className="page-narrow">
                <Card title={<IconTextComponent icon={<UserAddOutlined/>}>Create your account</IconTextComponent>}>
                    {/* Texto clave destacado (pauta 1.6) */}
                    <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
                        It's free. <Text strong>Only your email and a password are required.</Text>
                    </Typography.Paragraph>
                    <Form layout="vertical" size="large">
                        <Form.Item label="Email" required hasFeedback
                                   validateStatus={status(formData.email, validEmail)}
                                   help={formData.email != '' && !validEmail ? "Write a valid email, e.g. name@example.com" : ""}>
                            <AutoComplete options={emailSuggestions} value={formData.email}
                                          onChange={(v) => modifyStateProperty(formData, setFormData,
                                              "email", (v ?? "").trim().toLowerCase())}>
                                <Input prefix={<MailOutlined/>} placeholder="name@example.com" type="email" maxLength={50}
                                       autoComplete="email" allowClear/>
                            </AutoComplete>
                        </Form.Item>
                        <Form.Item label="Password" required hasFeedback
                                   validateStatus={status(formData.password, validPassword)}
                                   help={formData.password != '' && !validPassword ? "At least 3 characters" : ""}>
                            <Input.Password prefix={<LockOutlined/>} placeholder="at least 3 characters" maxLength={50} autoComplete="new-password"
                                   onChange={(i) => modifyStateProperty(formData, setFormData,
                                       "password", i.currentTarget.value)}/>
                        </Form.Item>

                        <Collapse ghost className="block form-collapse" items={[{
                            key: "optional",
                            label: <Text strong>Add your personal details (optional)</Text>,
                            children: optionalFields,
                        }]}/>

                        <div className="form-actions">
                            <Button type="primary" block disabled={!requiredFilled} onClick={clickCreate}>
                                Create account
                            </Button>
                            <div>
                                <Text type="secondary">Already have an account? </Text>
                                <Link href="/login" style={{ color: "var(--wallapep-primary-dark)", fontWeight: 600 }}>Login</Link>
                            </div>
                        </div>
                    </Form>
                </Card>
        </div>
    )
}


export default CreateUserComponent;
