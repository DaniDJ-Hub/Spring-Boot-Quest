import type { Challenge } from '../../types'

/** Mundo 3 · Parámetros y configuración — Cómo entran los datos y cómo se configura la app
 *  Cobertura en el curso: 3–20 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w03-q1',
    worldId: 'w03',
    kind: 'quiz',
    concepts: ['pathvariable', 'requestparam'],
    difficulty: 1,
    xp: 10,
    prompt: 'Para la URL /productos/42?detalle=true, ¿qué anotación captura cada parte?',
    options: [
      {
        id: 'a',
        text: '@RequestParam captura el 42 y @PathVariable captura detalle=true.'
      },
      {
        id: 'b',
        text: '@PathVariable captura el 42 (va en la ruta) y @RequestParam captura detalle (va en la query string).'
      },
      { id: 'c', text: 'Ambos se capturan con @RequestBody.' },
      { id: 'd', text: 'Solo se puede capturar uno de los dos por método.' }
    ],
    answer: 'b',
    explain: 'La regla es geográfica: lo que forma parte del camino es @PathVariable, lo que va después del signo de interrogación es @RequestParam.',
    deeper: 'Convención de diseño: la ruta identifica el recurso (/productos/42), la query lo modifica o filtra (?detalle=true&orden=precio).'
  },
  {
    id: 'w03-c1',
    worldId: 'w03',
    kind: 'codefix',
    concepts: ['pathvariable'],
    difficulty: 2,
    xp: 14,
    prompt: 'Este endpoint compila pero lanza una excepción al recibir una petición. Elige la corrección.',
    code: '@GetMapping("/productos/{id}")\npublic Producto ver(@PathVariable Long codigo) {\n    return servicio.porId(codigo);\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Nombrar explícitamente la variable de ruta o renombrar el parámetro para que coincidan.',
        code: '@GetMapping("/productos/{id}")\npublic Producto ver(@PathVariable("id") Long codigo) { ... }'
      },
      {
        id: 'b',
        text: 'Cambiar Long por String.',
        code: 'public Producto ver(@PathVariable String codigo) { ... }'
      },
      { id: 'c', text: 'Quitar las llaves de la ruta.', code: '@GetMapping("/productos/id")' },
      {
        id: 'd',
        text: 'Agregar @RequestParam además de @PathVariable.',
        code: '@PathVariable @RequestParam Long codigo'
      }
    ],
    answer: 'a',
    explain: 'Spring empareja por nombre. La ruta declara {id} y el parámetro se llama codigo, así que no encuentra correspondencia. O los llamas igual, o indicas el nombre dentro de la anotación.',
    deeper: 'El emparejamiento automático por nombre depende de que el compilador conserve los nombres de parámetros (-parameters). Los starters de Boot ya lo activan; en un proyecto Maven manual no siempre.'
  },
  {
    id: 'w03-q2',
    worldId: 'w03',
    kind: 'quiz',
    concepts: ['requestbody', 'modelattribute'],
    difficulty: 2,
    xp: 12,
    prompt: 'Recibes un formulario HTML clásico en un @Controller con Thymeleaf. ¿Qué anotación usas para poblar el objeto?',
    options: [
      {
        id: 'a',
        text: '@RequestBody, porque los datos vienen en el cuerpo de la petición.'
      },
      {
        id: 'b',
        text: '@ModelAttribute, que arma el objeto desde los campos del formulario enviados como form-data.'
      },
      { id: 'c', text: '@PathVariable con un objeto complejo.' },
      { id: 'd', text: 'Ninguna: hay que leer el HttpServletRequest a mano.' }
    ],
    answer: 'b',
    explain: '@RequestBody deserializa JSON; @ModelAttribute enlaza campos de formulario. Confundirlos produce un objeto con todos los campos en null y ningún error visible.'
  },
  {
    id: 'w03-d1',
    worldId: 'w03',
    kind: 'debug',
    concepts: ['value', 'properties'],
    difficulty: 3,
    xp: 16,
    prompt: 'La app arranca y el campo aparece como el texto literal, no como el valor configurado. ¿Qué falla?',
    code: '@Service\npublic class ReporteService {\n\n    @Value("app.titulo")\n    private String titulo;\n}\n\n// application.properties\n// app.titulo=Reporte mensual\n\n// Al imprimir: "app.titulo"',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Falta la sintaxis de placeholder: debe ser @Value("${app.titulo}").'
      },
      { id: 'b', text: 'La propiedad debe empezar con spring.' },
      { id: 'c', text: '@Value no funciona en clases @Service.' },
      { id: 'd', text: 'El archivo debe llamarse config.properties.' }
    ],
    answer: 'a',
    explain: 'Sin ${...}, @Value inyecta la cadena tal cual. Es un error silencioso: no hay excepción, simplemente el campo contiene el nombre de la propiedad en vez de su valor.',
    deeper: 'La sintaxis #{...} es distinta: eso es SpEL, para expresiones. ${...} lee propiedades; #{...} evalúa expresiones.'
  },
  {
    id: 'w03-q3',
    worldId: 'w03',
    kind: 'quiz',
    concepts: ['profiles'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Para qué sirven los profiles y cómo se seleccionan?',
    options: [
      {
        id: 'a',
        text: 'Para separar configuración por entorno. Se activan con spring.profiles.active y cargan application-{perfil}.properties además del base.'
      },
      { id: 'b', text: 'Para separar usuarios de la aplicación por roles.' },
      { id: 'c', text: 'Para dividir el proyecto en módulos de Maven.' },
      { id: 'd', text: 'Para cambiar el idioma de los mensajes.' }
    ],
    answer: 'a',
    explain: 'application.properties se carga siempre; application-prod.properties se suma encima cuando el perfil prod está activo. Así la URL de la base de datos de producción nunca vive junto a la de desarrollo.',
    deeper: 'También puedes anotar beans con @Profile("dev") para que solo existan en cierto entorno: útil para cargar datos de prueba sin ensuciar producción.'
  },
  {
    id: 'w03-o1',
    worldId: 'w03',
    kind: 'order',
    concepts: ['properties', 'environment', 'variables-entorno'],
    difficulty: 3,
    xp: 16,
    prompt: 'Ordena las fuentes de configuración de MENOR a MAYOR prioridad (la última gana).',
    steps: [
      'Valores por defecto de la auto-configuración',
      'application.properties del proyecto',
      'application-{perfil}.properties del perfil activo',
      'Variables de entorno del sistema',
      'Argumentos de línea de comandos al ejecutar el JAR'
    ],
    explain: 'Esta jerarquía es la razón por la que puedes desplegar el mismo JAR en cualquier entorno: la configuración de fuera siempre pisa a la de dentro, sin recompilar.',
    deeper: 'Cuando alguien dice "cambié el properties y no toma el valor", casi siempre hay una variable de entorno o un argumento pisándolo más arriba en la cadena.'
  },
  {
    id: 'w03-f1',
    worldId: 'w03',
    kind: 'fill',
    concepts: ['requestbody'],
    difficulty: 2,
    xp: 12,
    prompt: 'Falta la anotación para que Spring deserialice el JSON del cuerpo de la petición en el objeto Producto.',
    code: '@PostMapping("/api/productos")\npublic Producto crear(______________ Producto producto) {\n    return servicio.guardar(producto);\n}',
    lang: 'java',
    accept: ['requestbody'],
    placeholder: '@...',
    explain: '@RequestBody le indica a Spring que use Jackson para convertir el JSON entrante en una instancia de Producto. Sin ella, Spring intentaría enlazar por parámetros de formulario y el objeto llegaría vacío.'
  },
  {
    id: 'w03-dec1',
    worldId: 'w03',
    kind: 'decision',
    concepts: ['properties', 'variables-entorno', 'profiles'],
    difficulty: 4,
    xp: 18,
    prompt: 'Vas a subir el proyecto a un repositorio compartido. La contraseña de la base de datos está en application.properties. ¿Qué haces?',
    options: [
      {
        id: 'a',
        text: 'Dejarla ahí: el repositorio es privado.',
        consequence: 'La credencial queda en el historial de Git para siempre. Cambiar el repo a público más adelante, o un fork, la expone. Rotar la contraseña no borra el historial.'
      },
      {
        id: 'b',
        text: 'Reemplazarla por un placeholder que lea una variable de entorno y documentar cuál hay que definir.',
        consequence: 'El repositorio queda limpio, cada entorno define su propia credencial y el mismo artefacto sirve para todos.'
      },
      {
        id: 'c',
        text: 'Moverla a application-prod.properties y no subir ese archivo.',
        consequence: 'Mejor que A, pero el archivo se pierde entre máquinas y alguien acabará subiéndolo por accidente en un commit apurado.'
      },
      {
        id: 'd',
        text: 'Cifrar el archivo properties con una clave que también está en el repo.',
        consequence: 'La clave está junto al candado. No aporta seguridad real y añade un paso de descifrado a cada arranque.'
      }
    ],
    answer: 'b',
    explain: 'Spring resuelve ${DB_PASSWORD} contra las variables de entorno automáticamente, sin código extra. Es el mismo mecanismo que usarás en el mundo de despliegue con AWS.'
  },
]

export default challenges
