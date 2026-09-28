# Sergio Riesco Collar

Sitio web personal creado con Next.js, HTML semántico y CSS puro.

## Páginas

- `/`: sobre mí.
- `/musica`: rock de los años 70.
- `/videojuegos`: juegos favoritos.
- `/series`: series favoritas.
- `/hobbies`: aficiones.

## Modo claro y oscuro

El botón de la cabecera alterna entre modo claro y oscuro. La preferencia se
guarda en `localStorage` y, si no hay ninguna guardada, se respeta la
preferencia del sistema.

- `app/components/ThemeToggle.js`: componente de cliente con el botón.
- `app/globals.css`: variables de color para cada modo.

Las páginas siguen funcionando sin JavaScript; el botón solo cambia los colores.

## Añadir un videojuego

La lista está generada desde `app/data/games.js`. Para añadir uno:

1. Copia un objeto del array `games`.
2. Cambia el `id`, el `title`, el `genre` y la `description`.
3. Añade la imagen en `public/covers` y actualiza `cover`.
4. Usa `current: true` para el juego actual y `favorite: true` para el favorito.

Si se omite `cover`, se muestra automáticamente `public/covers/placeholder.svg`.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Comprobaciones

```bash
npm run lint
npm run build
```

## Estándares y accesibilidad

- HTML semántico y encabezados ordenados.
- Navegación por teclado, enlace de salto y foco visible.
- Diseño adaptable a móviles.
- Contenido renderizado en servidor y sin recursos de terceros; el único
  JavaScript es el selector de tema.
- Modo claro y oscuro con contraste adecuado y `color-scheme` correcto.
- Metadatos en español en cada página.
