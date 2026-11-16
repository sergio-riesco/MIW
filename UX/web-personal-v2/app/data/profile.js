// Formación, experiencia, contacto y personas que me avalan.
// Las fechas van en formato ISO (AAAA-MM-DD o AAAA) para usarlas en <time>.
// Los textos que cambian con el idioma van como { es, en }.

export const education = [
  {
    id: "master",
    title: {
      es: "Máster Universitario en Ingeniería Web",
      en: "Master's Degree in Web Engineering",
    },
    center: { es: "Universidad de Oviedo", en: "University of Oviedo" },
    start: "2026",
    end: null,
    status: { es: "En curso", en: "In progress" },
    text: {
      es: "Asignaturas como Estándares y Computación Web o Experiencia de Usuario.",
      en: "Courses such as Web Standards and Computing or User Experience.",
    },
  },
  {
    id: "grado",
    title: {
      es: "Grado en Ingeniería Informática del Software",
      en: "Bachelor's Degree in Software Engineering",
    },
    center: { es: "Universidad de Oviedo", en: "University of Oviedo" },
    start: "2022",
    end: null,
    status: {
      es: "Pendiente del Trabajo Fin de Grado",
      en: "Final degree project pending",
    },
    text: {
      es: "Todas las asignaturas aprobadas; solo me queda el Trabajo Fin de Grado.",
      en: "All courses passed; only the final degree project is left.",
    },
  },
];

export const experience = [
  {
    id: "mecalux",
    role: {
      es: "Prácticas en el área de robótica",
      en: "Robotics intern",
    },
    company: "Mecalux Software Solutions S.A.",
    start: "2026-03-02",
    end: "2026-04-04",
    summary: {
      es: "Detección de una figura con un LIDAR y creación de un dock personalizado en Nav2 para guiar a un robot AMR, con ROS2 Humble y C++.",
      en: "Detecting a target shape with LIDAR and building a custom Nav2 dock to guide an AMR robot, using ROS2 Humble and C++.",
    },
    tasks: [
      {
        es: "Aprendí ROS2 y el código que había hecho antes un compañero, y ayudé en la simulación con RViz a que el robot se orientase hacia la figura detectada.",
        en: "Learnt ROS2 and the code a colleague had written before, and helped in the RViz simulation so the robot faced the detected shape.",
      },
      {
        es: "Desarrollé el dock personalizado adaptando el código a una versión más reciente de la empresa, ajustando parámetros de Nav2 y resolviendo problemas de compatibilidad.",
        en: "Built the custom dock by porting the code to a newer version provided by the company, tuning Nav2 parameters and fixing compatibility issues.",
      },
      {
        es: "Probé todo en simulación y después con un LIDAR físico (SICK nanoScan3), filtrando los puntos «fantasma» que aparecían en la detección real.",
        en: "Tested everything in simulation and then with a real LIDAR (SICK nanoScan3), filtering out the “ghost” points that showed up in real detection.",
      },
      {
        es: "Por iniciativa propia añadí que el robot gire solo antes de hacer el dock si está de espaldas a la figura, una mejora que la empresa valoró positivamente.",
        en: "On my own initiative I added automatic rotation before docking when the robot faces away from the shape, an improvement the company valued positively.",
      },
    ],
    skills: ["ROS2 Humble", "Nav2", "LIDAR", { es: "Odometría", en: "Odometry" }, "C++", "RViz"],
  },
];

export const contact = [
  {
    id: "email",
    label: { es: "Correo", en: "Email" },
    text: "sergioriescocollar@gmail.com",
    href: "mailto:sergioriescocollar@gmail.com",
  },
  {
    id: "github",
    label: "GitHub",
    text: "github.com/sergio-riesco",
    href: "https://github.com/sergio-riesco",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    text: "linkedin.com/in/sergio-riesco-collar-154251359",
    href: "https://www.linkedin.com/in/sergio-riesco-collar-154251359",
  },
  {
    id: "instagram",
    label: "Instagram",
    text: "@sergi3310",
    href: "https://www.instagram.com/sergi3310/",
  },
];

export const references = [
  {
    id: "cristina-pelayo",
    name: "Cristina Pelayo",
    role: {
      es: "Profesora de la Universidad de Oviedo",
      en: "Lecturer at the University of Oviedo",
    },
    relation: {
      es: "Mi profesora en el Máster de Estándares y Computación Web y de Experiencia de Usuario, y en el Grado de Software y Estándares para la Web.",
      en: "My lecturer in the Master's courses Web Standards and Computing and User Experience, and in the Bachelor's course Software and Web Standards.",
    },
    link: {
      text: "LinkedIn",
      href: "https://www.linkedin.com/in/crispelayo/",
    },
  },
];
