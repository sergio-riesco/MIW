// Las series están en una sola lista.
// Para añadir una: copia un objeto, cambia id, title, genre y description.
// Las portadas se guardan en public/covers/series.
// Usa current: true para la que estés viendo ahora y favorite: true para la favorita.

export const series = [
   {
    id: "breaking-bad",
    title: "Breaking Bad",
    cover: "/covers/series/breaking-bad.png",
    genre: "Thriller",
    season: "2008",
    description:
      "Es probablemente la serie más perfecta que han hecho jamás.",
    favorite: true,
  },
  {
    id: "the-boys",
    title: "The Boys",
    cover: "/covers/series/the-boys.png",
    genre: "Súperhéroes",
    season: "2019",
    description:
      "Vigilantes con poderes que no respetan la moral. Lo que empieza como una crítica de superheroes acaba siendo una crítica de la sociedad.",
  },
  {
    id: "invincible",
    title: "Invincible",
    cover: "/covers/series/invincible.png",
    genre: "Súperhéroes",
    season: "2021",
    description:
      "Brutal, merece la pena verla sin saber nada antes.",
  },
  {
    id: "better-call-saul",
    title: "Better Call Saul",
    cover: "/covers/series/better-call-saul.png",
    genre: "Thriller",
    season: "2015",
    description:
      "Precuela de Breaking Bad. Llega más lejos de lo que esperabas y funciona muy bien.",
  },
  {
    id: "lanterns",
    title: "Lanterns",
    cover: "/covers/series/lanterns.png",
    genre: "Misterio - Super Héroes",
    season: "2026",
    description: "La que estoy viendo ahora mismo.",
    current: true,
  },
];
