// Para añadir un videojuego, copia un objeto y cambia sus datos.
// Las imágenes se guardan en public/covers/videogames.
// trailer es opcional: ruta a un vídeo MP4 en public/media/videos/videojuegos.
// Si está, al pulsar la portada se abre el vídeo en una ventana.

export const videogames = [
  {
    id: "big-walk",
    title: "Big Walk",
    cover: "/covers/videogames/big-walk.png",
    trailer: "/media/videos/videojuegos/big-walk.mp4",
    genre: "Cooperativo | Puzles",
    description: "Está siendo mi videojuego favorito del año.",
    current: true,
  },
  {
    id: "breath-of-the-wild",
    title: "The Legend of Zelda: Breath of the Wild",
    cover: "/covers/videogames/botw.png",
    trailer: "/media/videos/videojuegos/breath-of-the-wild.mp4",
    genre: "Aventura",
    description: "Mi videojuego favorito, tiene la mejor exploración de cualquier mundo abierto.",
    favorite: true,
  },
  {
    id: "outer-wilds",
    title: "Outer Wilds",
    cover: "/covers/videogames/outer-wilds.png",
    trailer: "/media/videos/videojuegos/outer-wilds.mp4",
    genre: "Exploración",
    description: "Me gustan sus secretos y su universo.",
  },
  {
    id: "doom",
    title: "DOOM Eternal",
    cover: "/covers/videogames/doom-eternal.png",
    trailer: "/media/videos/videojuegos/doom-eternal.mp4",
    genre: "FPS",
    description: "Me flipa.",
  },
  {
    id: "dark-souls",
    title: "Dark Souls",
    cover: "/covers/videogames/dark-souls.png",
    trailer: "/media/videos/videojuegos/dark-souls.mp4",
    genre: "RPG",
    description: "La primera vez que lo jugué lo odie, pero después me enamoré.",
  },
  {
    id: "helldivers-II",
    title: "Helldivers II",
    cover: "/covers/videogames/helldivers-ii.jpg",
    trailer: "/media/videos/videojuegos/helldivers-ii.mp4",
    genre: "TPS",
    description: "Te hace sentir como que estás en una película de acción.",
  },
];
