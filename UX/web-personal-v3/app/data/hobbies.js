// Aficiones. Imágenes en public/covers/hobbies (si no hay cover, se usa
// public/covers/placeholder.svg).
// tone: color de la tarjeta (skate, pizza o juegos, ver hobbies.module.css).
// details: datos cortos que salen debajo del texto. Los de videojuegos se
// sacan de data/videogames.js en la página.
// link.to: clave de la página enlazada (ver app/i18n/config.js).
// Los textos que cambian con el idioma van como { es, en }.

export const hobbies = [
  {
    id: "videojuegos",
    title: { es: "Videojuegos", en: "Video games" },
    tone: "juegos",
    cover: "/covers/hobbies/videojuegos.png",
    text: {
      es: "Es una de mis aficiones. Si quieres, puedes ver mi lista completa en la página de videojuegos.",
      en: "One of my hobbies. If you like, you can see my full list on the video games page.",
    },
    link: {
      to: "videogames",
      label: { es: "Ver mi lista de videojuegos", en: "See my list of video games" },
    },
  },
  {
    id: "skate",
    title: "Skate",
    tone: "skate",
    cover: "/covers/hobbies/skate.png",
    text: {
      es: "Me gusta hacer skate sobre todo para dar paseos, no para hacer trucos.",
      en: "I like skating mostly to cruise around, not to do tricks.",
    },
    details: [
      {
        label: { es: "Mi ruta", en: "My route" },
        value: {
          es: "De casa, en El Natahoyo, hasta La Lloca del Rinconín (Gijón)",
          en: "From home, in El Natahoyo, to La Lloca del Rinconín (Gijón)",
        },
      },
      {
        label: { es: "Patino desde", en: "Skating since" },
        value: { es: "Los 10 años, más o menos", en: "I was about 10" },
      },
      {
        label: { es: "Cómo aprendí", en: "How I learnt" },
        value: { es: "Solo, después de muchas caídas", en: "On my own, after many falls" },
      },
    ],
  },
  {
    id: "pizzas",
    title: "Pizzas",
    tone: "pizza",
    cover: "/covers/hobbies/pizzas.png",
    text: {
      es: "Hacer pizzas es otra de las cosas que más me gustan.",
      en: "Making pizzas is another of my favourite things.",
    },
    details: [
      {
        label: { es: "Mi pizza estrella", en: "My signature pizza" },
        value: "Carbonara",
      },
    ],
  },
];
