# Un jardín solo para ti

Experiencia romántica con flores 3D, seis fotografías completas, dedicatorias diferentes y una carta final de amor. Three.js, Vite, JavaScript, HTML y CSS.

## Ejecutar

Desde la carpeta principal:

```sh
npm install
npm run dev
```

Abre la dirección que imprime Vite. Las dependencias ya están instaladas. El navegador necesita WebGL y aceleración gráfica; no abras el HTML con doble clic.

## Secuencia e interacciones

La flor principal crece durante los primeros diez segundos. Después, seis flores se abren en secuencia: cada una revela una fotografía sin deformaciones en una galería con bordes suaves, un título exclusivo y una dedicatoria distinta. Cada recuerdo dura unos 13 segundos; al terminar, aparece una carta de amor. Los botones 01–06 permiten volver a cualquier recuerdo.

Las fotografías se muestran completas y con su proporción original, sin texturas sobre pétalos ni iluminación 3D aplicada a las imágenes. Toca una foto para ampliarla y recorrer las seis dedicatorias. El visor admite flechas de teclado y Escape.

- «Pide un deseo» muestra una dedicatoria y activa cinco estrellas fugaces durante cinco segundos. La historia se pausa para disfrutarlo.
- «Volver a florecer» reinicia las flores, fotografías y carta final.
- «Música» activa o silencia una composición ambiental sintetizada con Web Audio.
- «Más magia» alterna destellos y resplandor adicionales.
- Arrastra la escena para girar y usa la rueda o dos dedos para acercarte.

Las estrellas fugaces incluyen una cabeza luminosa y una estela continua. Se mantienen frente a la cámara para verse en distintos encuadres. Se respeta el movimiento reducido: los cometas ambientales y el balanceo se desactivan, pero la lluvia solicitada con el botón de deseo sigue disponible.

La historia se pausa con la pestaña oculta, al ampliar una foto y durante un deseo. Los originales quedan intactos; las copias están en `public/photos/` y no se envían a servicios externos. Las frases están en `lovePhrases`, en `flor-encantada/main.js`. Las fuentes web son opcionales y tienen respaldo local.

## Producción

```sh
npm run build
npm run preview
```

La salida se genera en `dist/`. La entrada principal es `index.html`; la escena y los estilos están en `flor-encantada/`.

La flor principal tiene 67 pétalos curvos distribuidos en siete capas. Las flores de recuerdos usan 38 pétalos en cuatro capas. Los seis capítulos muestran su número, un título diferente, una dedicatoria junto a la foto y una barra de tiempo de lectura. La carta final aparece al terminar los seis recuerdos (aproximadamente en el segundo 88 de animación activa).

