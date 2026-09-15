import java.io.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;

public class HolaServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(true);
        Integer contador = (Integer) session.getAttribute("contador");

        if (contador == null) {
            contador = 0;
        }
        contador++;
        session.setAttribute("contador", contador);

        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<html><body>");
        out.println("<h1>Hola Tomcat v1 - Contador: " + contador + "</h1>");
        out.println("</body></html>");
    }
}
