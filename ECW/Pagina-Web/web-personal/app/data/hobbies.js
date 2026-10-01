// Para añadir una afición: copia un objeto y cambia sus datos.
// Las imágenes se guardan en public/covers/hobbies y pueden ser .jpg o .png
// (las definitivas) o .svg (portadas provisionales mientras buscas las fotos).

export const hobbies = [
  {
    id: "videojuegos",
    title: "Videojuegos",
    cover: "/covers/hobbies/videojuegos.png",
    text: "Es una de mis aficiones. Si quieres, puedes ver mi lista completa en la página de videojuegos.",
    link: { href: "/videojuegos", label: "Ver mi lista de videojuegos" },
  },
  {
    id: "skate",
    title: "Skate",
    cover: "/covers/hobbies/skate.png",
    text: "Me gusta hacer skate sobre todo para dar paseos, no para hacer trucos.",
  },
  {
    id: "pizzas",
    title: "Pizzas",
    cover: "/covers/hobbies/pizzas.png",
    text: "Hacer pizzas es otra de las cosas que más me gustan.",
  },
];
