// Videojuegos. Portadas en public/covers/videogames y tráileres
// (opcionales) en public/media/videos/videojuegos.
// Los textos que cambian con el idioma van como { es, en }.

export const videogames = [
  {
    id: "big-walk",
    title: "Big Walk",
    cover: "/covers/videogames/big-walk.png",
    trailer: "/media/videos/videojuegos/big-walk.mp4",
    genre: { es: "Cooperativo | Puzles", en: "Co-op | Puzzles" },
    description: {
      es: "Está siendo mi videojuego favorito del año.",
      en: "It's turning out to be my favourite game of the year.",
    },
    current: true,
  },
  {
    id: "breath-of-the-wild",
    title: "The Legend of Zelda: Breath of the Wild",
    cover: "/covers/videogames/botw.png",
    trailer: "/media/videos/videojuegos/breath-of-the-wild.mp4",
    genre: { es: "Aventura", en: "Adventure" },
    description: {
      es: "Mi videojuego favorito, tiene la mejor exploración de cualquier mundo abierto.",
      en: "My favourite game. It has the best exploration of any open world.",
    },
    favorite: true,
  },
  {
    id: "outer-wilds",
    title: "Outer Wilds",
    cover: "/covers/videogames/outer-wilds.png",
    trailer: "/media/videos/videojuegos/outer-wilds.mp4",
    genre: { es: "Exploración", en: "Exploration" },
    description: {
      es: "Me gustan sus secretos y su universo.",
      en: "I love its secrets and its universe.",
    },
  },
  {
    id: "doom",
    title: "DOOM Eternal",
    cover: "/covers/videogames/doom-eternal.png",
    trailer: "/media/videos/videojuegos/doom-eternal.mp4",
    genre: "FPS",
    description: { es: "Me flipa.", en: "I absolutely love it." },
  },
  {
    id: "dark-souls",
    title: "Dark Souls",
    cover: "/covers/videogames/dark-souls.png",
    trailer: "/media/videos/videojuegos/dark-souls.mp4",
    genre: "RPG",
    description: {
      es: "La primera vez que lo jugué lo odié, pero después me enamoré.",
      en: "I hated it the first time I played it, but then I fell in love with it.",
    },
  },
  {
    id: "helldivers-II",
    title: "Helldivers II",
    cover: "/covers/videogames/helldivers-ii.jpg",
    trailer: "/media/videos/videojuegos/helldivers-ii.mp4",
    genre: "TPS",
    description: {
      es: "Te hace sentir como que estás en una película de acción.",
      en: "It makes you feel like you're in an action movie.",
    },
  },
];
