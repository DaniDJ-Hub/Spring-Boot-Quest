# Spring Boot Quest

Juego educativo para aprender Spring Boot practicando: retos de código, debugging con stack traces reales,
decisiones de arquitectura y batallas finales por módulo. React + TypeScript + Vite + Tailwind, sin backend.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # regenera el índice, comprueba tipos y compila a dist/
npm run preview  # sirve dist/ localmente

npm run check    # índice + tipos + lint + pruebas, todo de una vez
npm test         # solo las pruebas
npm run lint     # solo ESLint
```

## Desplegar en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel, **New Project → Import** el repo.
3. Vercel detecta Vite solo. Si te pide los valores: build `npm run build`, output `dist`.
4. Deploy.

El `vercel.json` incluido reescribe todas las rutas a `/`, así que recargar la página nunca da 404.
No hay variables de entorno ni servicios externos que configurar.

## De dónde sale el contenido

Los quince mundos salen del temario del curso de Spring Framework 6 + Spring Boot 3, reconstruido por
análisis de densidad de términos sobre la transcripción completa (2.87 MB, 48 388 líneas, sin marcadores
de estructura). El campo `courseRange` de cada mundo indica en qué tramo del curso se concentra el tema.

**Lo que no está, y por qué.** El curso no cubre pruebas unitarias, microservicios, Docker, Kafka,
resiliencia ni patrones distribuidos: JUnit, Mockito, Kafka, RabbitMQ y Circuit Breaker tienen cero
menciones en la transcripción, y el propio instructor dice al inicio que testing y microservicios los trata
en cursos aparte. Ninguno de esos temas se inventó aquí. El reporte final los menciona como siguiente paso.

## Cómo funciona el juego

**Siete tipos de reto**, no solo opción múltiple: conceptual, corregir código, debugging sobre logs
reales, arquitectura, decisión profesional con consecuencias, ordenar un flujo y completar código
escribiendo la anotación.

**Dominio por concepto.** Cada uno de los 85 conceptos tiene un nivel que exige aciertos sostenidos:
no dominado → básico → en progreso → dominado → experto. Un fallo rompe la racha, así que un concepto
puede bajar de nivel.

**Práctica adaptativa.** Dentro de un mundo, los retos se ordenan solos: primero lo que fallaste, luego
lo que toca tus conceptos flojos, después lo nuevo por dificultad, y al final el repaso. La sesión de
refuerzo del panel se arma solo con conceptos por debajo del 60 % de aciertos.

**Boss battles.** Cada mundo tiene una, con un reto de cada tipo disponible priorizando los más difíciles.
Sin pistas y sin explicaciones hasta el final. Se abre al resolver el 70 % del mundo y hay que superar
entre el 75 % y el 85 % según el mundo. Superarla desbloquea los mundos que dependen de él.
3
**Proyectos.** Siete briefs para construir en tu IDE, con requisitos y criterios de aceptación. No son
simulaciones: el checklist se guarda, el código lo escribes tú.

**Examen final.** Treinta retos, dos por mundo, entre los más difíciles. Genera un Skill Report con
resultado por mundo, fortalezas, temas a repasar y conceptos sin practicar.

## Estructura

```
src/
  app/         App.tsx (shell y navegación) + router propio, sin dependencias
  features/    una carpeta por pantalla: dashboard, map, world, session,
               projects, achievements, challenge
  components/  primitivas compartidas: ui, ErrorBoundary, Loading
  engine/      core.ts (XP, dominio, selección adaptativa, persistencia),
               achievements.ts (reglas), GameProvider + game-context
  data/        worlds.ts, challenges/w01..w15.ts, challenge-meta.generated.ts, loader.ts
  hooks/       useChallengeSet (carga diferida del contenido)
```

## Cómo se carga el contenido

Los 114 retos pesan unos 120 KB. Cargarlos todos al abrir el panel era desperdicio, así que están
separados en dos capas:

- **`challenge-meta.generated.ts`** es el índice: id, mundo, tipo, dificultad, XP y conceptos. Es lo
  único que el motor necesita de forma sincrónica para calcular progreso, dominio, logros y el orden
  adaptativo. Va en el bundle principal y es pequeño.
- **`data/challenges/wNN.ts`** contiene el enunciado, las opciones y las explicaciones. Vite genera un
  chunk por mundo y `data/loader.ts` lo descarga la primera vez que entras, con caché en memoria.

El índice lo genera `scripts/generate-meta.mjs`, que corre solo en `prebuild`, así que nunca puede
quedar desfasado. Una prueba compara índice y contenido campo a campo y falla si divergen.

## Persistencia

Todo el progreso vive en `localStorage` bajo la clave `sbq:v1`: XP, dominio por concepto, boss superadas,
logros, checklists de proyecto, racha y examen. Se escribe con retardo de 400 ms para no bloquear el hilo
principal en cada respuesta, y se fuerza la escritura al cerrar la pestaña.

El estado tiene campo `version` y migraciones acumulativas en `engine/core.ts`. Una partida que no se
pueda migrar no se borra: se aparta bajo `sbq:rescue` y la aplicación lo avisa en pantalla. Migrar a una
base de datos con autenticación es sustituir `loadState` y `saveState` por llamadas a una API.

Para borrar el progreso: pestaña **Logros → Borrar progreso**.

## Añadir contenido

Un reto nuevo es un objeto en `src/data/challenges/wNN.ts`, tipado según su `kind`. Requiere `id` único,
`worldId` existente y conceptos que estén en `CONCEPT_LABEL`. Después:

```bash
npm run check
```

Regenera el índice y pasa las 94 pruebas, que comprueban entre otras cosas que la respuesta correcta
existe entre las opciones, que los retos de ordenar no repiten pasos y que ningún concepto declarado en
un mundo se queda sin reto.

## Design system

Los tokens están en `tailwind.config.js` y son semánticos, no por tinte: `surface`, `edge`, `fg`,
`accent`, `warning`, `danger`, `info`, más una escala propia para el dominio de conceptos. Si el verde
cambia mañana, se cambia en un sitio y nada llamado `accent` deja de tener sentido.

- **Tipografía**: siete pasos (`micro` 11 → `h1` 32) y ninguno más. `npm run tokens` falla si aparece
  un `text-[13px]` suelto o un `text-sm` fuera de la escala.
- **Radio**: `sm` 4px para chips, `md` 8px para controles, `lg` 12px para paneles. El radio crece con
  el tamaño del elemento.
- **Elevación**: no hay sombras. La jerarquía la dan el fondo y el borde, que es coherente con la
  estética de herramienta de desarrollo.
- **Movimiento**: `duration-instant` 90ms para pulsaciones, `quick` 160ms para cambios de estado,
  `smooth` 260ms para entradas, con una sola curva.

`scripts/check-tokens.mjs` recorre el código y falla si alguna clase apunta a un token inexistente.
Es la red que el resto de la cadena no da: una clase mal escrita compila, pasa las pruebas y
simplemente no aplica estilo.

## Animación

Las animaciones viven en `src/animations/motion.ts`, con una sola escala de
duraciones —90 / 160 / 260 ms— y una sola curva, alineadas con los tokens de Tailwind. Una prueba
falla si una variante introduce una duración fuera de esa escala.

La regla para añadir una: tiene que comunicar un cambio, dar respuesta a una acción, establecer
jerarquía o hacer más natural una interacción. Si no cumple ninguna, no entra. En la práctica eso
significa que Motion se usa sobre todo para **salidas**, que es lo que CSS no puede hacer porque el
nodo ya se desmontó: retos que se van al pasar al siguiente, avisos que desaparecen, el diálogo al
cerrarse, pasos que saltan de una columna a otra. Los colores al pasar el ratón y las barras que
crecen siguen siendo CSS, porque ahí CSS basta.

El muelle está reservado a lo que interrumpe —los avisos de logro y el diálogo— y el escalonado solo
al mapa, donde el orden de aparición refuerza que cada mundo depende del anterior. Aplicarlo a todas
las secciones de todas las pantallas es el tic más reconocible de una interfaz generada.

Se usa `LazyMotion` con `domAnimation` y `strict`, no el import completo: `strict` obliga a escribir
`m` en vez de `motion`, que es lo que impide volver a meter el paquete entero sin darse cuenta. Se
descartó `domMax` porque la proyección de layout cuesta 12.4 kB comprimidos y solo se habría usado en
una transición.

## Accesibilidad

Toda la paleta cumple WCAG AA sobre los tres fondos: el texto terciario está a 4.52:1 y los bordes de
controles a 3.01:1, verificado por pruebas que calculan el contraste sobre los valores reales del
config. El estado de una respuesta nunca depende solo del color, los objetivos táctiles llegan a 44 px,
hay navegación por teclado con flechas en las opciones, el diálogo de borrado atrapa el foco y lo
devuelve al cerrarse, el veredicto se anuncia en una región viva y el foco se mueve al contenido al
cambiar de ruta.

El movimiento reducido se respeta por partida doble: el bloque `prefers-reduced-motion` de
`index.css` para las animaciones de CSS, y `MotionConfig reducedMotion="user"` para las de Motion,
que el CSS no alcanza porque se ejecutan en JavaScript.

## Copia de seguridad

El progreso vive solo en este navegador y no hay cuenta que lo recupere, así que la pestaña **Logros**
permite descargarlo como JSON y restaurarlo en otro equipo. La importación valida el fichero antes de
aceptarlo, reutiliza las mismas migraciones que la carga normal —un respaldo antiguo sigue sirviendo—
y siempre pide confirmación, porque sustituir la partida es destructivo.

## Tipografía

Las fuentes van autoalojadas con Fontsource, solo en los subconjuntos latin y latin-ext. Antes venían
de Google Fonts: dos preconnect y una hoja bloqueante en el camino crítico, que además falla sin
conexión. Los respaldos llevan `size-adjust` y métricas ajustadas para que no haya salto de
maquetación mientras cargan.
