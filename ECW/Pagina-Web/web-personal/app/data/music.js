// La música está organizada por categorías.
// Para añadir un grupo: cópialo dentro del array "bands" de su categoría.
// Para añadir una categoría nueva: copia un bloque completo del array "categories".
// Las imágenes se guardan en public/covers/music.
// Pon favorite: true en el grupo que más te guste y se marcará como favorito.

export const categories = [
  {
    id: "rock-progresivo",
    name: "Rock progresivo",
    bands: [
      {
        id: "pink-floyd",
        name: "Pink Floyd",
        cover: "/covers/music/pink-floyd.png",
        album: "The Dark Side of the Moon (1973)",
      },
      {
        id: "king-crimson",
        name: "King Crimson",
        cover: "/covers/music/king-crimson.svg",
        album: "In the Court of the Crimson King (1969)",
      },
      {
        id: "alan-parsons-project",
        name: "The Alan Parsons Project",
        cover: "/covers/music/alan-parsons-project.png",
        album: "Tales of Mystery and Imagination (1976)",
      },
    ],
  },
  {
    id: "pop-rock",
    name: "Pop Rock",
    bands: [
      {
        id: "electric-light-orchestra",
        name: "Electric Light Orchestra",
        cover: "/covers/music/electric-light-orchestra.png",
        album: "Out of the Blue (1977)",
      },
    ],
  },
  {
    id: "yacht-rock",
    name: "Yacht Rock",
    bands: [
      {
        id: "blue-oyster-cult",
        name: "Blue Öyster Cult",
        cover: "/covers/music/blue-oyster-cult.png",
        album: "Agents of Fortune (1976)",
      },
    ],
  },
];
