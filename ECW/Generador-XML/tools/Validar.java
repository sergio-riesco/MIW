import java.io.File;
import java.util.ArrayList;
import java.util.List;

import javax.xml.XMLConstants;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;

import org.xml.sax.ErrorHandler;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

/**
 * Valida documentos del lenguaje contra el DTD y contra el XML Schema.
 *
 * Solo usa la biblioteca estándar de Java (JAXP), sin dependencias:
 *   - DTD: analizador SAX con validación activada; usa el DOCTYPE del documento.
 *   - XSD: SchemaFactory con esquema/sitio.xsd.
 *
 * Uso (Java 11 o superior ejecuta el .java directamente, sin compilar):
 *   java tools/Validar.java                 valida todos los ejemplos/*.xml
 *   java tools/Validar.java a.xml b.xml     valida esos documentos
 *
 * Termina con código 1 si algún documento no es válido.
 */
public class Validar {

    /** Guarda los errores en vez de detener la validación en el primero. */
    static class Errores implements ErrorHandler {
        final List<String> lista = new ArrayList<>();

        private void anotar(SAXParseException e) {
            lista.add("línea " + e.getLineNumber() + ", columna " + e.getColumnNumber() + ": " + e.getMessage());
        }

        public void warning(SAXParseException e) { }
        public void error(SAXParseException e) { anotar(e); }
        public void fatalError(SAXParseException e) { anotar(e); }
    }

    static List<String> contraDtd(File xml) {
        Errores errores = new Errores();
        try {
            SAXParserFactory f = SAXParserFactory.newInstance();
            f.setValidating(true);
            f.setNamespaceAware(true);
            var lector = f.newSAXParser().getXMLReader();
            lector.setContentHandler(new DefaultHandler());
            lector.setErrorHandler(errores);
            lector.parse(xml.toURI().toString());
        } catch (Exception e) {
            if (errores.lista.isEmpty()) errores.lista.add(e.getMessage());
        }
        return errores.lista;
    }

    static List<String> contraXsd(File xml, Schema esquema) {
        Errores errores = new Errores();
        try {
            var validador = esquema.newValidator();
            validador.setErrorHandler(errores);
            validador.validate(new StreamSource(xml));
        } catch (Exception e) {
            if (errores.lista.isEmpty()) errores.lista.add(e.getMessage());
        }
        return errores.lista;
    }

    public static void main(String[] args) throws Exception {
        File raiz = new File(".");
        File xsd = new File(raiz, "esquema/sitio.xsd");

        List<File> documentos = new ArrayList<>();
        if (args.length == 0) {
            File[] ejemplos = new File(raiz, "ejemplos").listFiles((d, n) -> n.endsWith(".xml"));
            if (ejemplos != null) {
                java.util.Arrays.sort(ejemplos);
                documentos.addAll(List.of(ejemplos));
            }
        } else {
            for (String a : args) documentos.add(new File(a));
        }

        Schema esquema = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI).newSchema(xsd);

        boolean todoBien = true;
        for (File doc : documentos) {
            List<String> dtd = contraDtd(doc);
            List<String> esq = contraXsd(doc, esquema);
            System.out.printf("%-24s DTD: %-9s XSD: %s%n", doc.getName(),
                    dtd.isEmpty() ? "válido" : "NO VÁLIDO", esq.isEmpty() ? "válido" : "NO VÁLIDO");
            for (String e : dtd) System.out.println("    [DTD] " + e);
            for (String e : esq) System.out.println("    [XSD] " + e);
            todoBien &= dtd.isEmpty() && esq.isEmpty();
        }

        if (!todoBien) System.exit(1);
    }
}
