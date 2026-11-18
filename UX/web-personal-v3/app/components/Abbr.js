// v3 (WCAG AAA 3.1.4 Abreviaturas y 3.1.3 Palabras inusuales): las siglas
// técnicas se marcan con <abbr title="…"> para dar su forma completa y una
// explicación corta. withAbbr() recibe un texto ya traducido y devuelve los
// trozos con cada sigla conocida envuelta en su <abbr>.

const glossary = {
  LIDAR: {
    es: "Light Detection and Ranging: sensor que mide distancias con un láser",
    en: "Light Detection and Ranging: a sensor that measures distances with a laser",
  },
  AMR: {
    es: "Autonomous Mobile Robot: robot móvil autónomo",
    en: "Autonomous Mobile Robot",
  },
  ROS2: {
    es: "Robot Operating System 2: conjunto de herramientas para programar robots",
    en: "Robot Operating System 2: a set of tools for programming robots",
  },
  Nav2: {
    es: "Navigation 2: sistema de navegación de ROS2",
    en: "Navigation 2: the navigation system of ROS2",
  },
  RViz: {
    es: "ROS Visualization: programa para ver en 3D lo que detecta el robot",
    en: "ROS Visualization: a tool to see in 3D what the robot detects",
  },
  FPS: {
    es: "First-Person Shooter: juego de disparos en primera persona",
    en: "First-Person Shooter",
  },
  RPG: {
    es: "Role-Playing Game: juego de rol",
    en: "Role-Playing Game",
  },
  TPS: {
    es: "Third-Person Shooter: juego de disparos en tercera persona",
    en: "Third-Person Shooter",
  },
  HTML: {
    es: "HyperText Markup Language: lenguaje de marcado de las páginas web",
    en: "HyperText Markup Language",
  },
  CSS: {
    es: "Cascading Style Sheets: hojas de estilo de las páginas web",
    en: "Cascading Style Sheets",
  },
};

const pattern = new RegExp(`\\b(${Object.keys(glossary).join("|")})\\b`, "g");

export function withAbbr(text, lang) {
  if (typeof text !== "string") return text;
  const parts = text.split(pattern);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <abbr key={index} title={glossary[part][lang] || glossary[part].es}>
        {part}
      </abbr>
    ) : (
      part
    ),
  );
}
