// Aficiones. Imágenes en public/covers/hobbies (si no hay cover, se usa
// public/covers/placeholder.svg).
// tone: color de la tarjeta (skate, pizza o juegos, ver hobbies.module.css).
// details: datos cortos que salen debajo del texto. Los de videojuegos se
// sacan de data/videogames.js en la página.

export const hobbies = [
  {
    id: "videojuegos",
    title: "Videojuegos",
    tone: "juegos",
    cover: "/covers/hobbies/videojuegos.png",
    text: "Es una de mis aficiones. Si quieres, puedes ver mi lista completa en la página de videojuegos.",
    link: { href: "/videojuegos", label: "Ver mi lista de videojuegos" },
  },
  {
    id: "skate",
    title: "Skate",
    tone: "skate",
    cover: "/covers/hobbies/skate.png",
    text: "Me gusta hacer skate sobre todo para dar paseos, no para hacer trucos.",
    details: [
      { label: "Mi ruta", value: "De casa, en El Natahoyo, hasta La Lloca del Rinconín (Gijón)" },
      { label: "Patino desde", value: "Los 10 años, más o menos" },
      { label: "Cómo aprendí", value: "Solo, después de muchas caídas" },
    ],
  },
  {
    id: "pizzas",
    title: "Pizzas",
    tone: "pizza",
    cover: "/covers/hobbies/pizzas.png",
    text: "Hacer pizzas es otra de las cosas que más me gustan.",
    details: [{ label: "Mi pizza estrella", value: "La carbonara" }],
  },
];
