import { useRef } from "react";
import { Input, Button, Tooltip, Space, Typography } from 'antd';
import { BoldOutlined, ItalicOutlined, UnorderedListOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Descripción con formato sencillo (pauta 4.15): negrita, cursiva y listas.
// Los botones envuelven el texto seleccionado con las marcas; en el detalle se muestra ya formateado.
let RichTextEditorComponent = ({ value, onChange, maxLength = 500, placeholder }) => {
    let ref = useRef(null)

    let textarea = () => ref.current?.resizableTextArea?.textArea

    let wrapSelection = (before, after = before) => {
        let ta = textarea()
        let text = value ?? ""
        let start = ta?.selectionStart ?? text.length, end = ta?.selectionEnd ?? text.length
        let selected = text.slice(start, end) || "text"
        let next = text.slice(0, start) + before + selected + after + text.slice(end)
        onChange(next.slice(0, maxLength))
        setTimeout(() => { ta?.focus(); ta?.setSelectionRange(start + before.length, start + before.length + selected.length) })
    }

    // Convierte en lista las líneas seleccionadas (o añade un elemento nuevo)
    let toggleList = () => {
        let ta = textarea()
        let text = value ?? ""
        let start = ta?.selectionStart ?? text.length, end = ta?.selectionEnd ?? text.length
        let lineStart = text.lastIndexOf("\n", start - 1) + 1
        let block = text.slice(lineStart, end)
        let lines = (block || "").split("\n").map(l => l.startsWith("- ") ? l : "- " + l)
        let next = text.slice(0, lineStart) + lines.join("\n") + text.slice(end)
        onChange(next.slice(0, maxLength))
        setTimeout(() => ta?.focus())
    }

    return (
        <div className="rich-editor">
            <Space size={4} className="rich-toolbar">
                <Tooltip title="Bold (**text**)">
                    <Button size="small" type="text" icon={<BoldOutlined/>} aria-label="Bold" onClick={() => wrapSelection("**")}/>
                </Tooltip>
                <Tooltip title="Italic (*text*)">
                    <Button size="small" type="text" icon={<ItalicOutlined/>} aria-label="Italic" onClick={() => wrapSelection("*")}/>
                </Tooltip>
                <Tooltip title="List (lines starting with -)">
                    <Button size="small" type="text" icon={<UnorderedListOutlined/>} aria-label="List" onClick={toggleList}/>
                </Tooltip>
                <Text type="secondary" className="rich-hint">Select text and use the buttons to give it format</Text>
            </Space>
            <Input.TextArea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} allowClear
                            autoSize={{ minRows: 4, maxRows: 10 }} maxLength={maxLength} showCount placeholder={placeholder}/>
        </div>
    )
}

export default RichTextEditorComponent;
