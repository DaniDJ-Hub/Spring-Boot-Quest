import type { Challenge } from '../../types'

/** Mundo 5 · Ciclo de vida y scopes — Cuándo nace, cuánto vive y cuándo muere un bean
 *  Cobertura en el curso: 12–20 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w05-q1',
    worldId: 'w05',
    kind: 'quiz',
    concepts: ['singleton'],
    difficulty: 2,
    xp: 12,
    prompt: '¿Cuál es el scope por defecto de un bean en Spring y qué implica?',
    options: [
      { id: 'a', text: 'Prototype: se crea una instancia nueva en cada inyección.' },
      {
        id: 'b',
        text: 'Singleton: existe una sola instancia compartida por toda la aplicación, así que no debe guardar estado mutable por usuario.'
      },
      { id: 'c', text: 'Request: una instancia por petición HTTP.' },
      { id: 'd', text: 'Depende de si la clase es @Service o @Component.' }
    ],
    answer: 'b',
    explain: 'Singleton en Spring significa una instancia por contenedor, no el patrón Singleton clásico de Java. Como todas las peticiones comparten el mismo objeto, cualquier campo mutable es un dato compartido entre usuarios.',
    deeper: 'Por eso los Services suelen ser sin estado: reciben lo que necesitan por parámetro y no lo guardan en campos.'
  },
  {
    id: 'w05-d1',
    worldId: 'w05',
    kind: 'debug',
    concepts: ['singleton', 'request-scope'],
    difficulty: 4,
    xp: 18,
    prompt: 'En producción, dos usuarios simultáneos reportan que ven el carrito del otro. Este es el código. ¿Cuál es la causa?',
    code: '@Service\npublic class CarritoService {\n\n    private List<Item> items = new ArrayList<>();\n\n    public void agregar(Item item) { items.add(item); }\n    public List<Item> ver() { return items; }\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'ArrayList no es thread-safe: hay que cambiarlo por CopyOnWriteArrayList.'
      },
      {
        id: 'b',
        text: 'El bean es singleton, así que la lista es una sola compartida por todos. El estado por usuario no debe vivir en un campo de un singleton.'
      },
      { id: 'c', text: 'Falta @Transactional en los métodos.' },
      { id: 'd', text: 'El Service debería ser @Component en lugar de @Service.' }
    ],
    answer: 'b',
    explain: 'Cambiar a una colección thread-safe eliminaría las excepciones de concurrencia pero no el problema: seguiría siendo una sola lista para todos. El estado por usuario va en la sesión, en la base de datos o en un bean con scope adecuado.',
    deeper: 'Es el bug más caro de este módulo porque no aparece en desarrollo: con un solo usuario probando, todo funciona perfecto.'
  },
  {
    id: 'w05-q2',
    worldId: 'w05',
    kind: 'quiz',
    concepts: ['prototype'],
    difficulty: 3,
    xp: 16,
    prompt: 'Inyectas un bean prototype dentro de un singleton. ¿Cuántas instancias del prototype se crean?',
    options: [
      { id: 'a', text: 'Una por cada llamada a un método del singleton.' },
      {
        id: 'b',
        text: 'Una sola, en el momento de construir el singleton: el prototype queda congelado ahí dentro.'
      },
      { id: 'c', text: 'Ninguna: Spring lo prohíbe y falla al arrancar.' },
      { id: 'd', text: 'Una por petición HTTP.' }
    ],
    answer: 'b',
    explain: 'La inyección ocurre una sola vez, al construir el singleton. El prototype se comporta como prototype al ser solicitado, no al ser usado. Es una trampa clásica.',
    deeper: 'Si de verdad necesitas una instancia nueva por uso, tienes que pedirla al contenedor en cada llamada mediante un proveedor, no inyectarla como campo.'
  },
  {
    id: 'w05-o1',
    worldId: 'w05',
    kind: 'order',
    concepts: ['postconstruct', 'predestroy'],
    difficulty: 2,
    xp: 14,
    prompt: 'Ordena el ciclo de vida de un bean singleton.',
    steps: [
      'El contenedor instancia el bean llamando a su constructor',
      'Se inyectan las dependencias',
      'Se ejecuta el método anotado con @PostConstruct',
      'El bean atiende peticiones durante toda la vida de la aplicación',
      'Al cerrar el contexto se ejecuta el método anotado con @PreDestroy'
    ],
    explain: '@PostConstruct existe porque en el constructor las dependencias todavía no están inyectadas. Si tu inicialización necesita una dependencia, va en @PostConstruct, no en el constructor.'
  },
  {
    id: 'w05-c1',
    worldId: 'w05',
    kind: 'codefix',
    concepts: ['postconstruct', 'constructor-injection'],
    difficulty: 3,
    xp: 16,
    prompt: 'Este bean lanza NullPointerException al arrancar. Elige la corrección.',
    code: '@Service\npublic class CacheService {\n\n    @Autowired\n    private CatalogoRepository repo;\n\n    private List<Producto> cache;\n\n    public CacheService() {\n        this.cache = repo.findAll();  // NPE aquí\n    }\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Mover la carga a un método @PostConstruct, que se ejecuta después de la inyección.',
        code: '@PostConstruct\npublic void cargar() {\n    this.cache = repo.findAll();\n}'
      },
      {
        id: 'b',
        text: 'Inicializar cache como lista vacía y ya.',
        code: 'private List<Producto> cache = new ArrayList<>();'
      },
      {
        id: 'c',
        text: 'Anotar el constructor con @Autowired.',
        code: '@Autowired\npublic CacheService() { ... }'
      },
      {
        id: 'd',
        text: 'Hacer el repositorio estático.',
        code: 'private static CatalogoRepository repo;'
      }
    ],
    answer: 'a',
    explain: 'La inyección por campo ocurre después de que el constructor termina. Dentro del constructor, repo todavía es null. @PostConstruct corre justo después, con todo ya inyectado.',
    deeper: 'La alternativa elegante es inyectar por constructor: entonces repo llega como parámetro y sí puedes usarlo dentro del constructor sin problema.'
  },
  {
    id: 'w05-f1',
    worldId: 'w05',
    kind: 'fill',
    concepts: ['prototype'],
    difficulty: 2,
    xp: 12,
    prompt: 'Escribe la anotación que hace que se cree una instancia nueva cada vez que se solicite este bean.',
    code: '@Component\n___________________\npublic class GeneradorFolio {\n    private final String folio = UUID.randomUUID().toString();\n}',
    lang: 'java',
    accept: [
      'scope("prototype")',
      'scope(\'prototype\')',
      'scope(configurablebeanfactory.scope_prototype)'
    ],
    placeholder: '@Scope("...")',
    explain: '@Scope("prototype") le dice al contenedor que no reutilice la instancia. Ojo: Spring no destruye los prototypes, así que @PreDestroy nunca se ejecuta en ellos.'
  },
  {
    id: 'w05-dec1',
    worldId: 'w05',
    kind: 'decision',
    concepts: ['session-scope', 'singleton'],
    difficulty: 4,
    xp: 18,
    prompt: 'Necesitas guardar el carrito de compras de cada usuario en una app con Thymeleaf y sesión. ¿Dónde lo pones?',
    options: [
      {
        id: 'a',
        text: 'En un campo de un @Service singleton.',
        consequence: 'Todos los usuarios comparten un carrito. El bug aparece solo en producción, cuando hay más de una persona conectada.'
      },
      {
        id: 'b',
        text: 'En un bean con scope de sesión, o directamente en la sesión HTTP.',
        consequence: 'Cada usuario tiene el suyo. A cambio, el estado vive en el servidor: si escalas a varias instancias necesitas sesiones compartidas o pegajosas.'
      },
      {
        id: 'c',
        text: 'En una variable estática de la clase.',
        consequence: 'Peor que A: además de compartido, queda fuera del contenedor y no lo puedes sustituir ni limpiar.'
      },
      {
        id: 'd',
        text: 'En la base de datos, con una tabla carrito por usuario.',
        consequence: 'Sobrevive al reinicio del servidor y escala horizontalmente, pero agrega escrituras a la BD en cada clic. Es la opción correcta cuando el carrito debe persistir entre visitas.'
      }
    ],
    answer: 'b',
    explain: 'B es la respuesta para el caso planteado, una app MVC con sesión. D no es incorrecta, es una decisión distinta: se justifica cuando el requisito incluye persistencia entre sesiones o escalado horizontal.'
  },
]

export default challenges
