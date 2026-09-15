import type { Challenge } from '../../types'

/** Mundo 1 · Fundamentos — Qué resuelve Spring y por qué existe Spring Boot
 *  Cobertura en el curso: 0–5 % del curso. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w01-q1',
    worldId: 'w01',
    kind: 'quiz',
    concepts: ['spring-vs-boot'],
    difficulty: 1,
    xp: 10,
    prompt: 'Un compañero dice: "Spring Boot es un framework distinto de Spring, por eso es más rápido". ¿Qué está mal en esa frase?',
    options: [
      {
        id: 'a',
        text: 'Nada, son dos frameworks independientes y Boot reemplazó a Spring.'
      },
      {
        id: 'b',
        text: 'Spring Boot no reemplaza a Spring: lo empaqueta y le añade auto-configuración, starters y servidor embebido.'
      },
      { id: 'c', text: 'Spring Boot es más lento, pero se configura más fácil.' },
      {
        id: 'd',
        text: 'Spring Boot solo sirve para APIs REST; Spring sirve para todo lo demás.'
      }
    ],
    answer: 'b',
    explain: 'Spring Boot es una capa de conveniencia sobre el mismo Spring Framework. El contenedor IoC, el MVC y la inyección de dependencias son los de siempre. Lo que Boot aporta es que deja de pedirte configuración manual.',
    deeper: 'Práctico: cuando algo falla en Boot, el stack trace apunta a clases de Spring Framework (org.springframework.beans.factory...). Eso te confirma que por debajo es el mismo motor.',
    hint: 'Piensa en qué clases aparecen realmente en el stack trace cuando algo revienta.'
  },
  {
    id: 'w01-q2',
    worldId: 'w01',
    kind: 'quiz',
    concepts: ['autoconfig', 'starters'],
    difficulty: 2,
    xp: 12,
    prompt: 'Agregas spring-boot-starter-data-jpa al pom.xml y de pronto la app intenta conectarse a una base de datos al arrancar, aunque tú no escribiste esa configuración. ¿Por qué?',
    options: [
      {
        id: 'a',
        text: 'El starter incluye un archivo de configuración oculto que sobrescribe el tuyo.'
      },
      {
        id: 'b',
        text: 'La auto-configuración detecta las clases en el classpath y activa la configuración correspondiente si no la definiste tú.'
      },
      {
        id: 'c',
        text: 'Maven ejecuta un script de instalación al descargar la dependencia.'
      },
      {
        id: 'd',
        text: 'Es un bug conocido; hay que excluir la auto-configuración siempre.'
      }
    ],
    answer: 'b',
    explain: 'La auto-configuración funciona por condiciones sobre el classpath: si detecta las clases de JPA y un DataSource, monta la infraestructura de persistencia. Por eso agregar una dependencia cambia el comportamiento del arranque.',
    deeper: 'Si quieres ver exactamente qué se auto-configuró y qué no, arranca con --debug: Boot imprime un informe de condiciones cumplidas y descartadas.'
  },
  {
    id: 'w01-f1',
    worldId: 'w01',
    kind: 'fill',
    concepts: ['spring-vs-boot', 'autoconfig'],
    difficulty: 1,
    xp: 10,
    prompt: 'Falta la anotación que marca la clase de arranque y activa el escaneo de componentes y la auto-configuración.',
    code: '____________\npublic class MiAppApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(MiAppApplication.class, args);\n    }\n}',
    lang: 'java',
    accept: ['springbootapplication'],
    placeholder: '@...',
    explain: '@SpringBootApplication agrupa tres anotaciones: @Configuration, @EnableAutoConfiguration y @ComponentScan. Por eso una sola línea activa el escaneo del paquete actual y sus subpaquetes.',
    hint: 'Es una sola anotación que equivale a tres.'
  },
  {
    id: 'w01-a1',
    worldId: 'w01',
    kind: 'arch',
    concepts: ['capas'],
    difficulty: 2,
    xp: 14,
    prompt: 'Estás revisando el código de un compañero. ¿Cuál de estas organizaciones sigue la separación de capas que usa Spring?',
    options: [
      {
        id: 'a',
        text: 'El Controller inyecta el Repository y arma la lógica de negocio dentro del método del endpoint.'
      },
      {
        id: 'b',
        text: 'El Controller llama al Service, el Service contiene la lógica y llama al Repository, el Repository solo habla con la base de datos.'
      },
      {
        id: 'c',
        text: 'El Repository llama al Service para validar antes de guardar.'
      },
      {
        id: 'd',
        text: 'Una sola clase con todos los métodos, anotada con @Component.'
      }
    ],
    answer: 'b',
    explain: 'La dirección de las dependencias siempre va hacia abajo: Controller → Service → Repository. Si el Repository llama al Service, tienes una dependencia circular esperando a explotar.',
    deeper: 'La opción A funciona en un CRUD de tres endpoints y se vuelve inmantenible en cuanto aparece la primera regla de negocio que dos endpoints comparten.'
  },
  {
    id: 'w01-d1',
    worldId: 'w01',
    kind: 'debug',
    concepts: ['autoconfig', 'servidor-embebido'],
    difficulty: 2,
    xp: 14,
    prompt: 'La app no arranca. Este es el final del log. ¿Cuál es la causa?',
    code: '***************************\nAPPLICATION FAILED TO START\n***************************\n\nDescription:\n\nWeb server failed to start. Port 8080 was already in use.\n\nAction:\n\nIdentify and stop the process that is listening on port 8080 or configure\nthis application to listen on another port.',
    lang: 'log',
    options: [
      { id: 'a', text: 'Falta la dependencia spring-boot-starter-web.' },
      {
        id: 'b',
        text: 'Otro proceso ya ocupa el puerto: hay que liberarlo o cambiar server.port en application.properties.'
      },
      { id: 'c', text: 'La base de datos no responde.' },
      { id: 'd', text: 'Falta @SpringBootApplication en la clase principal.' }
    ],
    answer: 'b',
    explain: 'El servidor embebido intenta abrir el 8080 y encuentra el puerto tomado, casi siempre por otra instancia de la misma app que quedó corriendo. Se arregla matando el proceso o poniendo server.port=8081.',
    deeper: 'En producción esto se resuelve con variables de entorno: SERVER_PORT=8090 sin tocar el código. Lo verás en el mundo de despliegue.'
  },
  {
    id: 'w01-o1',
    worldId: 'w01',
    kind: 'order',
    concepts: ['servidor-embebido', 'autoconfig'],
    difficulty: 2,
    xp: 14,
    prompt: 'Ordena lo que ocurre cuando ejecutas SpringApplication.run(...).',
    steps: [
      'Se crea el contexto de aplicación (el contenedor de Spring)',
      'Se escanean los paquetes buscando componentes anotados',
      'Se aplica la auto-configuración según lo que hay en el classpath',
      'Se instancian los beans y se inyectan sus dependencias',
      'Arranca el servidor embebido y queda escuchando peticiones'
    ],
    explain: 'El contenedor existe primero, luego encuentra qué debe administrar, luego decide qué configurar solo, luego construye los objetos y por último abre el puerto. Si un bean falla, el servidor nunca llega a arrancar.'
  },
  {
    id: 'w01-q3',
    worldId: 'w01',
    kind: 'quiz',
    concepts: ['starters'],
    difficulty: 1,
    xp: 10,
    prompt: '¿Qué es exactamente un starter?',
    options: [
      {
        id: 'a',
        text: 'Una plantilla de proyecto que genera código automáticamente.'
      },
      {
        id: 'b',
        text: 'Un agrupador de dependencias compatibles entre sí que se traen con una sola línea en el pom.'
      },
      { id: 'c', text: 'Un servidor de aplicaciones ligero.' },
      { id: 'd', text: 'Un plugin del IDE.' }
    ],
    answer: 'b',
    explain: 'spring-boot-starter-web trae Spring MVC, Jackson, validación y Tomcat embebido, con versiones ya probadas juntas. Ese trabajo de compatibilidad es la mitad del valor de Boot.'
  },
  {
    id: 'w01-dec1',
    worldId: 'w01',
    kind: 'decision',
    concepts: ['capas', 'spring-vs-boot'],
    difficulty: 3,
    xp: 16,
    prompt: 'Te piden un servicio interno pequeño: tres endpoints, sin base de datos, para consultar un catálogo en memoria. El equipo sugiere montarlo con Spring Boot. ¿Qué decides?',
    options: [
      {
        id: 'a',
        text: 'Rechazarlo: Spring Boot es demasiado pesado para tres endpoints.',
        consequence: 'Terminas escribiendo a mano el manejo de rutas, la serialización JSON y el arranque del servidor. Menos dependencias, mucho más código propio que mantener.'
      },
      {
        id: 'b',
        text: 'Aceptarlo con spring-boot-starter-web y nada más, respetando las capas desde el inicio.',
        consequence: 'Arrancas en minutos y el servicio queda listo para crecer. Si mañana necesita base de datos, agregas un starter en vez de reescribir.'
      },
      {
        id: 'c',
        text: 'Aceptarlo pero meter todo en el Controller, porque es pequeño.',
        consequence: 'Funciona hoy. En seis meses hay siete endpoints, la lógica está duplicada en tres de ellos y nadie se atreve a tocarlos.'
      },
      {
        id: 'd',
        text: 'Aceptarlo y agregar todos los starters por si acaso.',
        consequence: 'El arranque se vuelve lento, la app intenta conectarse a una base de datos que no existe y el JAR pesa cinco veces más.'
      }
    ],
    answer: 'b',
    explain: 'La decisión correcta casi nunca es el extremo. Spring Boot escala hacia abajo bien si eliges solo los starters que necesitas; lo que no escala es saltarse las capas "porque es pequeño".'
  },
]

export default challenges
