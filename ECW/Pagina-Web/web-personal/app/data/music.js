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
      {
        id: "queen",
        name: "Queen",
        cover: "/covers/music/queen.png",
        album: "A Night at the Opera (1975)",
        snippet: { src: "/media/audios/queen.mp3", track: "Bohemian Rhapsody" },
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
      {
        id: "steely-dan",
        name: "Steely Dan",
        cover: "/covers/music/steely-dan.png",
        album: "Can't Buy a Thrill (1972)",
        snippet: { src: "/media/audios/steely-dan.mp3", track: "Do It Again" },
      },
    ],
  },
  {
    id: "alternative-metal",
    name: "Alternative Metal",
    bands: [
      {
        id: "system-of-a-down",
        name: "System of a Down",
        cover: "/covers/music/system-of-a-down.png",
        album: "Toxicity (2001)",
        snippet: { src: "/media/audios/system-of-a-down.mp3", track: "Chop Suey!" },
      },
      {
        id: "rage-against-the-machine",
        name: "Rage Against the Machine",
        cover: "/covers/music/rage-against-the-machine.png",
        album: "Rage Against the Machine (1992)",
        snippet: { src: "/media/audios/rage-against-the-machine.mp3", track: "Killing in the Name" },
      },
    ],
  },
  {
    id: "hip-hop",
    name: "Hip Hop",
    bands: [
      {
        id: "joey-valence-and-brae",
        name: "Joey Valence & Brae",
        cover: "/covers/music/joey-valence-and-brae.png",
        album: "No Hands (2024)",
        snippet: { src: "/media/audios/joey-valence-and-brae.mp3", track: "No Hands" },
      },
      {
        id: "kendrick-lamar",
        name: "Kendrick Lamar",
        cover: "/covers/music/kendrick-lamar.png",
        album: "Alright (2015)",
        snippet: { src: "/media/audios/kendrick-lamar.mp3", track: "Alright" },
      },
    ],
  },
  {
    id: "indie-pop",
    name: "Indie Pop",
    bands: [
      {
        id: "the-marias",
        name: "The Marias",
        cover: "/covers/music/the-marias.png",
        album: "Submarine (2024)",
        snippet: { src: "/media/audios/the-marias.mp3", track: "Sienna" },
      },
      {
        id: "crumb",
        name: "Crumb",
        cover: "/covers/music/crumb.png",
        album: "Jinx (2019)",
        snippet: { src: "/media/audios/crumb.mp3", track: "Ghostride" },
      },
    ],
  },
];
