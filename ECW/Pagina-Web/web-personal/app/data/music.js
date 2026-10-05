// Grupos por género. Carátulas en public/covers/music.
// snippet (opcional): trozo de una canción del álbum en public/media/audios;
// track es el nombre de la canción.

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
        snippet: { src: "/media/audios/pink-floyd.mp3", track: "Money" },
      },
      {
        id: "king-crimson",
        name: "King Crimson",
        cover: "/covers/music/king-crimson.png",
        album: "In the Court of the Crimson King (1969)",
        snippet: { src: "/media/audios/king-crimson.mp3", track: "21st Century Schizoid Man" },
      },
      {
        id: "alan-parsons-project",
        name: "The Alan Parsons Project",
        cover: "/covers/music/alan-parsons-project.png",
        album: "Eye in the Sky (1982)",
        snippet: { src: "/media/audios/alan-parsons-project.mp3", track: "Eye in the Sky" },
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
        snippet: { src: "/media/audios/electric-light-orchestra.mp3", track: "Mr. Blue Sky" },
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
        snippet: { src: "/media/audios/blue-oyster-cult.mp3", track: "(Don't Fear) The Reaper" },
      },
    ],
  },
];
