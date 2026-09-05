# Spring Boot Quest

Juego educativo para aprender Spring Boot practicando: retos de código, debugging con stack traces reales,
decisiones de arquitectura y batallas finales por módulo. React + TypeScript + Vite + Tailwind, sin backend.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ localmente
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

**Proyectos.** Siete briefs para construir en tu IDE, con requisitos y criterios de aceptación. No son
simulaciones: el checklist se guarda, el código lo escribes tú.

**Examen final.** Treinta retos, dos por mundo, entre los más difíciles. Genera un Skill Report con
resultado por mundo, fortalezas, temas a repasar y conceptos sin practicar.

## Estructura

```
src/
  data/          worlds.ts (mundos y conceptos) + challenges-01..06.ts (114 retos)
  engine/        core.ts (XP, dominio, selección adaptativa) + useGame.tsx (estado y logros)
  components/    ChallengeRunner (los 7 tipos), WorldMap, WorldView, Dashboard, Session, Extras, ui
```

## Persistencia

Todo el progreso vive en `localStorage` bajo la clave `sbq:v1`: XP, dominio por concepto, boss superadas,
logros, checklists de proyecto, racha y examen. El estado está tipado en `GameState` y tiene campo
`version`, así que migrar a una base de datos con autenticación es sustituir `loadState` y `saveState`
en `src/engine/core.ts` por llamadas a una API, sin tocar el resto.

Para borrar el progreso: pestaña **Logros → Borrar progreso**.

## Añadir contenido

Un reto nuevo es un objeto en cualquier `challenges-0N.ts`, tipado según su `kind`. Requiere `id` único,
`worldId` existente y conceptos que estén en `CONCEPT_LABEL`. La build valida los tipos; el resto es
contenido.
# Spring-Boot-Quest
