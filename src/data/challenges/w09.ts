import type { Challenge } from '../../types'

/** Mundo 9 · JPA e Hibernate — Persistencia real: entidades, repositorios y consultas
 *  Cobertura en el curso: 27–40 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w09-q1',
    worldId: 'w09',
    kind: 'quiz',
    concepts: ['crudrepository', 'jparepository'],
    difficulty: 2,
    xp: 12,
    prompt: 'Declaras una interfaz que extiende JpaRepository y no escribes ninguna implementación. ¿Cómo funciona?',
    options: [
      {
        id: 'a',
        text: 'Spring Data genera la implementación en tiempo de ejecución a partir de la interfaz.'
      },
      {
        id: 'b',
        text: 'Hay que escribir la clase implementadora, el IDE la genera vacía.'
      },
      { id: 'c', text: 'Funciona solo para findAll(); el resto hay que escribirlo.' },
      {
        id: 'd',
        text: 'Hibernate copia la interfaz a una clase durante la compilación.'
      }
    ],
    answer: 'a',
    explain: 'Spring Data crea un proxy que implementa la interfaz. Los métodos heredados ya tienen comportamiento y los que declaras tú se traducen a consultas según su nombre.',
    deeper: 'JpaRepository extiende CrudRepository y añade paginación, ordenamiento y operaciones por lote. Si no necesitas eso, CrudRepository expone una superficie más pequeña.'
  },
  {
    id: 'w09-f1',
    worldId: 'w09',
    kind: 'fill',
    concepts: ['query-methods'],
    difficulty: 2,
    xp: 14,
    prompt: 'Escribe el nombre del método que Spring Data traduce a "buscar los productos cuyo precio es mayor que el valor dado".',
    code: 'public interface ProductoRepository extends JpaRepository<Producto, Long> {\n\n    List<Producto> ____________________(double precio);\n}',
    lang: 'java',
    accept: [
      'findbypreciogreaterthan',
      'findbypreciogreaterthan(double precio)',
      'findbyprecioisgreaterthan'
    ],
    placeholder: 'findBy...',
    explain: 'Spring Data parsea el nombre del método: findBy indica consulta, Precio es la propiedad de la entidad y GreaterThan el operador. Si escribes mal el nombre de la propiedad, la app falla al arrancar, no al llamar el método.',
    hint: 'findBy + propiedad + operador, todo en camelCase.'
  },
  {
    id: 'w09-d1',
    worldId: 'w09',
    kind: 'debug',
    concepts: ['query-methods', 'entity'],
    difficulty: 3,
    xp: 16,
    prompt: 'La aplicación no arranca. ¿Qué hay que revisar?',
    code: 'org.springframework.data.mapping.PropertyReferenceException:\nNo property \'nombreCompleto\' found for type \'Cliente\'.\nDid you mean \'nombre\'?\n	at ...QueryMethod.<init>(QueryMethod.java:81)',
    lang: 'log',
    options: [
      {
        id: 'a',
        text: 'Falta una columna nombreCompleto en la tabla de la base de datos.'
      },
      {
        id: 'b',
        text: 'El nombre del método del repositorio referencia una propiedad que la entidad Cliente no tiene. Hay que corregir el nombre del método o el de la propiedad.'
      },
      { id: 'c', text: 'Falta la anotación @Query sobre el método.' },
      {
        id: 'd',
        text: 'El repositorio debe extender CrudRepository en vez de JpaRepository.'
      }
    ],
    answer: 'b',
    explain: 'Spring Data valida los nombres de método contra las propiedades de la entidad Java, no contra las columnas de la tabla. El error ocurre al construir los repositorios, durante el arranque.',
    deeper: 'Que falle al arrancar es una ventaja: un error de nombre nunca llega a producción escondido en un endpoint poco usado.'
  },
  {
    id: 'w09-q2',
    worldId: 'w09',
    kind: 'quiz',
    concepts: ['jpql', 'query-nativa'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Cuál es la diferencia entre JPQL y una consulta nativa?',
    options: [
      { id: 'a', text: 'JPQL es más rápido porque no pasa por la base de datos.' },
      {
        id: 'b',
        text: 'JPQL consulta sobre entidades y propiedades Java, y es portable entre motores. La nativa es SQL del motor concreto y te ata a él.'
      },
      { id: 'c', text: 'La nativa no permite parámetros.' },
      { id: 'd', text: 'JPQL solo sirve para lecturas.' }
    ],
    answer: 'b',
    explain: 'En JPQL escribes from Cliente c where c.nombre = :n, con el nombre de la clase y la propiedad. Hibernate lo traduce al SQL del motor activo, así que cambiar de MySQL a otro motor no rompe la consulta.',
    deeper: 'La nativa es la salida cuando necesitas algo específico del motor. El precio es que dejas de ser portable y pierdes la validación que JPQL hace sobre el modelo.'
  },
  {
    id: 'w09-c1',
    worldId: 'w09',
    kind: 'codefix',
    concepts: ['id-generatedvalue', 'entity'],
    difficulty: 2,
    xp: 14,
    prompt: 'Al guardar una entidad nueva, la base de datos rechaza el insert porque el id llega en null. Elige la corrección.',
    code: '@Entity\npublic class Cliente {\n\n    @Id\n    private Long id;\n\n    private String nombre;\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Declarar la estrategia de generación del identificador.',
        code: '@Id\n@GeneratedValue(strategy = GenerationType.IDENTITY)\nprivate Long id;'
      },
      { id: 'b', text: 'Cambiar Long por long.', code: '@Id\nprivate long id;' },
      { id: 'c', text: 'Quitar @Id.', code: 'private Long id;' },
      {
        id: 'd',
        text: 'Asignar el id a mano antes de guardar.',
        code: 'cliente.setId(System.currentTimeMillis());'
      }
    ],
    answer: 'a',
    explain: 'Sin @GeneratedValue, JPA asume que tú provees el identificador. IDENTITY delega en la columna autoincremental de la base de datos, que es lo habitual con MySQL.',
    deeper: 'La opción D funciona hasta que dos inserciones ocurren en el mismo milisegundo, o hasta que corres dos instancias de la app.'
  },
  {
    id: 'w09-q3',
    worldId: 'w09',
    kind: 'quiz',
    concepts: ['transactional'],
    difficulty: 4,
    xp: 18,
    prompt: '¿Qué garantiza @Transactional sobre un método de Service que hace tres escrituras?',
    options: [
      { id: 'a', text: 'Que las tres se ejecuten más rápido al agruparse.' },
      {
        id: 'b',
        text: 'Que las tres se confirmen juntas o ninguna: si la tercera falla, se revierten las dos anteriores.'
      },
      {
        id: 'c',
        text: 'Que ningún otro usuario pueda leer la tabla mientras tanto.'
      },
      {
        id: 'd',
        text: 'Que las escrituras se reintenten automáticamente si fallan.'
      }
    ],
    answer: 'b',
    explain: 'Es atomicidad: la unidad de trabajo es el método completo, no cada escritura. Sin transacción, un fallo a mitad deja la base de datos en un estado inconsistente que nadie limpia.',
    deeper: 'Por defecto, Spring solo revierte ante excepciones no comprobadas. Si capturas la excepción dentro del método y no la relanzas, el commit ocurre igual: es el error silencioso más caro de este módulo.'
  },
  {
    id: 'w09-o1',
    worldId: 'w09',
    kind: 'order',
    concepts: ['entity', 'crudrepository', 'transactional'],
    difficulty: 3,
    xp: 16,
    prompt: 'Ordena lo que ocurre al llamar repo.save(cliente) dentro de un método @Transactional.',
    steps: [
      'Se abre la transacción al entrar al método',
      'save() pasa la entidad al contexto de persistencia',
      'Hibernate marca la entidad como pendiente de escritura',
      'Al terminar el método sin excepción se hace commit',
      'Hibernate emite el INSERT contra la base de datos'
    ],
    explain: 'Hibernate no escribe en cuanto llamas a save: acumula los cambios y los vuelca al confirmar. Por eso a veces ves el INSERT en el log mucho después de la línea que lo provocó.'
  },
  {
    id: 'w09-dec1',
    worldId: 'w09',
    kind: 'decision',
    concepts: ['jpql', 'query-nativa', 'query-methods'],
    difficulty: 4,
    xp: 18,
    prompt: 'Necesitas una consulta con tres joins, un subselect y una función de agregación por rangos de fecha. ¿Qué usas?',
    options: [
      {
        id: 'a',
        text: 'Un Query Method con nombre largo del estilo findByClienteEstadoAndFechaBetweenAnd...',
        consequence: 'El nombre se vuelve ilegible antes del segundo join y hay cosas que simplemente no se pueden expresar así.'
      },
      {
        id: 'b',
        text: 'JPQL con @Query, si la consulta se puede expresar sobre las entidades.',
        consequence: 'Mantienes portabilidad y validación contra el modelo. Es la primera opción a intentar.'
      },
      {
        id: 'c',
        text: 'SQL nativo directamente, porque es más potente.',
        consequence: 'Resuelve cualquier cosa y te ata al motor. Justificado cuando JPQL se queda corto, no como primera opción.'
      },
      {
        id: 'd',
        text: 'Traer todos los registros y procesarlos en Java.',
        consequence: 'Funciona con mil filas y colapsa con un millón. Estás reemplazando el motor de base de datos por un bucle.'
      }
    ],
    answer: 'b',
    explain: 'El orden de preferencia es Query Method, luego JPQL, y nativo solo cuando hace falta algo del motor. La opción D es el antipatrón más caro: mueve el trabajo al lugar equivocado.'
  },
]

export default challenges
