// Series. Portadas en public/covers/series y tráileres (opcionales) en
// public/media/videos/series.
// current: la que estoy viendo (su tráiler sale en la página).
// favorite: la favorita.

export const series = [
   {
    id: "breaking-bad",
    title: "Breaking Bad",
    cover: "/covers/series/breaking-bad.png",
    trailer: "/media/videos/series/breaking-bad.mp4",
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
    trailer: "/media/videos/series/the-boys.mp4",
    genre: "Súperhéroes",
    season: "2019",
    description:
      "Vigilantes con poderes que no respetan la moral. Lo que empieza como una crítica de superheroes acaba siendo una crítica de la sociedad.",
  },
  {
    id: "invincible",
    title: "Invincible",
    cover: "/covers/series/invincible.png",
    trailer: "/media/videos/series/invincible.mp4",
    genre: "Súperhéroes",
    season: "2021",
    description:
      "Brutal, merece la pena verla sin saber nada antes.",
  },
  {
    id: "better-call-saul",
    title: "Better Call Saul",
    cover: "/covers/series/better-call-saul.png",
    trailer: "/media/videos/series/better-call-saul.mp4",
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
    trailer: "/media/videos/series/lanterns.mp4",
    current: true,
  },
];
