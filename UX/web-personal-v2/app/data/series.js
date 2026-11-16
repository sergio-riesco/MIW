// Series. Portadas en public/covers/series y tráileres (opcionales) en
// public/media/videos/series.
// current: la que estoy viendo (su tráiler sale en la página).
// favorite: la favorita.
// Los textos que cambian con el idioma van como { es, en }.

export const series = [
  {
    id: "breaking-bad",
    title: "Breaking Bad",
    cover: "/covers/series/breaking-bad.png",
    trailer: "/media/videos/series/breaking-bad.mp4",
    genre: "Thriller",
    season: "2008",
    description: {
      es: "Es probablemente la serie más perfecta que han hecho jamás.",
      en: "It is probably the most perfect series ever made.",
    },
    favorite: true,
  },
  {
    id: "the-boys",
    title: "The Boys",
    cover: "/covers/series/the-boys.png",
    trailer: "/media/videos/series/the-boys.mp4",
    genre: { es: "Superhéroes", en: "Superheroes" },
    season: "2019",
    description: {
      es: "Vigilantes con poderes que no respetan la moral. Lo que empieza como una crítica de los superhéroes acaba siendo una crítica de la sociedad.",
      en: "Superpowered vigilantes with no morals. What starts as a critique of superheroes ends up being a critique of society.",
    },
  },
  {
    id: "invincible",
    title: "Invincible",
    cover: "/covers/series/invincible.png",
    trailer: "/media/videos/series/invincible.mp4",
    genre: { es: "Superhéroes", en: "Superheroes" },
    season: "2021",
    description: {
      es: "Brutal, merece la pena verla sin saber nada antes.",
      en: "Brutal. It's worth watching without knowing anything beforehand.",
    },
  },
  {
    id: "better-call-saul",
    title: "Better Call Saul",
    cover: "/covers/series/better-call-saul.png",
    trailer: "/media/videos/series/better-call-saul.mp4",
    genre: "Thriller",
    season: "2015",
    description: {
      es: "Precuela de Breaking Bad. Llega más lejos de lo que esperabas y funciona muy bien.",
      en: "A Breaking Bad prequel. It goes further than you'd expect and works really well.",
    },
  },
  {
    id: "lanterns",
    title: "Lanterns",
    cover: "/covers/series/lanterns.png",
    trailer: "/media/videos/series/lanterns.mp4",
    genre: { es: "Misterio, superhéroes", en: "Mystery, superheroes" },
    season: "2026",
    description: {
      es: "La que estoy viendo ahora mismo.",
      en: "The one I'm watching right now.",
    },
    current: true,
  },
];
