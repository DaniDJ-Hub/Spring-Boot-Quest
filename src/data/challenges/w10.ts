import type { Challenge } from '../../types'

/** Mundo 10 · Relaciones JPA — El módulo donde más gente se traba, y por qué
 *  Cobertura en el curso: 38–52 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w10-q1',
    worldId: 'w10',
    kind: 'quiz',
    concepts: ['manytoone', 'joincolumn'],
    difficulty: 2,
    xp: 14,
    prompt: 'Muchas facturas pertenecen a un cliente. ¿En qué lado va la clave foránea y qué anotación la declara?',
    options: [
      { id: 'a', text: 'En Cliente, con @OneToMany y @JoinColumn.' },
      {
        id: 'b',
        text: 'En Factura, el lado "muchos": lleva @ManyToOne y @JoinColumn con el nombre de la columna.'
      },
      { id: 'c', text: 'En una tabla intermedia, siempre.' },
      { id: 'd', text: 'En ambos lados, duplicada.' }
    ],
    answer: 'b',
    explain: 'La clave foránea vive en el lado "muchos", igual que en el modelo relacional: la tabla factura tiene una columna cliente_id. El lado @OneToMany es el inverso y se declara con mappedBy.'
  },
  {
    id: 'w10-c1',
    worldId: 'w10',
    kind: 'codefix',
    concepts: ['onetomany', 'mappedby'],
    difficulty: 4,
    xp: 18,
    prompt: 'Hibernate está creando una tabla intermedia cliente_facturas además de la columna cliente_id. Elige la corrección.',
    code: '@Entity\npublic class Cliente {\n    @OneToMany\n    private List<Factura> facturas;\n}\n\n@Entity\npublic class Factura {\n    @ManyToOne\n    @JoinColumn(name = "cliente_id")\n    private Cliente cliente;\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Indicar con mappedBy que el dueño de la relación es el campo cliente de Factura.',
        code: '@OneToMany(mappedBy = "cliente")\nprivate List<Factura> facturas;'
      },
      {
        id: 'b',
        text: 'Quitar el @ManyToOne de Factura.',
        code: '@Entity\npublic class Factura { }'
      },
      {
        id: 'c',
        text: 'Agregar @JoinColumn también en Cliente.',
        code: '@OneToMany\n@JoinColumn(name = "cliente_id")\nprivate List<Factura> facturas;'
      },
      { id: 'd', text: 'Cambiar List por Set.', code: 'private Set<Factura> facturas;' }
    ],
    answer: 'a',
    explain: 'Sin mappedBy, JPA cree que son dos relaciones distintas y para la unidireccional @OneToMany usa tabla intermedia. mappedBy dice "esta relación ya está mapeada del otro lado, no crees nada".',
    deeper: 'Regla mnemotécnica: mappedBy siempre va en el lado que NO tiene la clave foránea, y su valor es el nombre del campo Java del otro lado, no el de la columna.'
  },
  {
    id: 'w10-d1',
    worldId: 'w10',
    kind: 'debug',
    concepts: ['fetch-lazy'],
    difficulty: 4,
    xp: 20,
    prompt: 'El endpoint funciona en las pruebas del Service pero falla al serializar la respuesta. ¿Qué está pasando?',
    code: 'org.hibernate.LazyInitializationException: could not initialize proxy\n[com.demo.Cliente#7] - no Session\n	at com.fasterxml.jackson.databind.ser.BeanSerializer.serialize(...)',
    lang: 'log',
    options: [
      { id: 'a', text: 'La base de datos se desconectó a mitad de la petición.' },
      {
        id: 'b',
        text: 'Se intenta acceder a una relación LAZY fuera de la transacción, cuando la sesión de Hibernate ya se cerró. Se resuelve devolviendo un DTO armado dentro de la transacción, o cargando la relación con un join explícito.'
      },
      { id: 'c', text: 'Falta @Transactional en el repositorio.' },
      { id: 'd', text: 'Hay que cambiar todas las relaciones a EAGER.' }
    ],
    answer: 'b',
    explain: 'LAZY significa que Hibernate deja un proxy en lugar de los datos y los carga al acceder. Si el acceso ocurre cuando la sesión ya cerró, no hay a quién preguntarle.',
    deeper: 'Poner todo en EAGER (opción D) hace desaparecer la excepción y trae media base de datos en cada consulta. Es el intercambio equivocado: cambias un error visible por un problema de rendimiento invisible.'
  },
  {
    id: 'w10-q2',
    worldId: 'w10',
    kind: 'quiz',
    concepts: ['n-mas-uno'],
    difficulty: 5,
    xp: 22,
    prompt: 'Listas 100 facturas y en el log aparecen 101 consultas SQL. ¿Cómo se llama esto y cómo se corrige?',
    options: [
      { id: 'a', text: 'Es normal en JPA, no tiene solución.' },
      {
        id: 'b',
        text: 'Es el problema N+1: una consulta para la lista y una por cada elemento al acceder a su relación LAZY. Se corrige con un join fetch en la consulta o con EntityGraph.'
      },
      { id: 'c', text: 'Es un deadlock de la base de datos.' },
      { id: 'd', text: 'Se corrige aumentando el pool de conexiones.' }
    ],
    answer: 'b',
    explain: 'La consulta inicial trae las 100 facturas con proxies en la relación cliente. Al recorrer la lista y leer el cliente de cada una, Hibernate dispara una consulta por factura.',
    deeper: 'Aumentar el pool de conexiones (opción D) alivia el síntoma y multiplica la carga sobre la base de datos. El problema es el número de consultas, no la capacidad de emitirlas.'
  },
  {
    id: 'w10-q3',
    worldId: 'w10',
    kind: 'quiz',
    concepts: ['cascade'],
    difficulty: 4,
    xp: 18,
    prompt: 'Tienes Factura con @OneToMany hacia LineaFactura. Borras una factura y las líneas quedan huérfanas en la base de datos. ¿Qué falta?',
    options: [
      { id: 'a', text: 'Un trigger en la base de datos.' },
      {
        id: 'b',
        text: 'Configurar cascade con REMOVE (o ALL) y orphanRemoval, para que el borrado se propague a las líneas.'
      },
      { id: 'c', text: 'Cambiar la relación a @ManyToMany.' },
      { id: 'd', text: 'Borrar las líneas manualmente antes en el Service.' }
    ],
    answer: 'b',
    explain: 'Cascade propaga la operación desde el padre hacia los hijos. orphanRemoval además borra los hijos que se sacan de la colección, aunque no borres el padre.',
    deeper: 'Cuidado con cascade = ALL hacia la dirección equivocada: borrar una factura no debería borrar al cliente. La cascada va del agregado hacia sus partes, nunca al revés.'
  },
  {
    id: 'w10-f1',
    worldId: 'w10',
    kind: 'fill',
    concepts: ['manytomany'],
    difficulty: 3,
    xp: 16,
    prompt: 'Escribe la anotación de relación que corresponde: un alumno cursa muchas materias y una materia tiene muchos alumnos.',
    code: '@Entity\npublic class Alumno {\n\n    _______________\n    @JoinTable(name = "alumno_materia",\n        joinColumns = @JoinColumn(name = "alumno_id"),\n        inverseJoinColumns = @JoinColumn(name = "materia_id"))\n    private List<Materia> materias;\n}',
    lang: 'java',
    accept: ['manytomany'],
    placeholder: '@...',
    explain: '@ManyToMany requiere una tabla intermedia, que @JoinTable describe. Si esa tabla necesita columnas propias, como la fecha de inscripción, la solución es convertirla en una entidad con dos @ManyToOne.'
  },
  {
    id: 'w10-o1',
    worldId: 'w10',
    kind: 'order',
    concepts: ['fetch-lazy', 'n-mas-uno'],
    difficulty: 4,
    xp: 20,
    prompt: 'Ordena los pasos para diagnosticar un problema de rendimiento en una consulta con relaciones.',
    steps: [
      'Activar el log de SQL de Hibernate para ver las consultas reales',
      'Contar cuántas consultas se emiten por una sola llamada al endpoint',
      'Identificar qué relación LAZY se está accediendo dentro del bucle',
      'Reescribir la consulta con join fetch para traer la relación de una vez',
      'Verificar en el log que el número de consultas bajó a una'
    ],
    explain: 'El paso uno no es opcional: sin ver el SQL emitido estás adivinando. La mayoría de los problemas de rendimiento con JPA se diagnostican contando consultas, no midiendo tiempos.'
  },
  {
    id: 'w10-dec1',
    worldId: 'w10',
    kind: 'decision',
    concepts: ['fetch-eager', 'fetch-lazy', 'dto'],
    difficulty: 5,
    xp: 22,
    prompt: 'Una entidad Pedido tiene relaciones hacia Cliente, Direccion, Lineas y Pagos. Distintos endpoints necesitan combinaciones distintas. ¿Cómo lo resuelves?',
    options: [
      {
        id: 'a',
        text: 'Poner todo EAGER para que siempre esté disponible.',
        consequence: 'Cada consulta trae el grafo completo aunque el endpoint solo necesite el folio. El coste se paga en todos lados para beneficiar a unos pocos.'
      },
      {
        id: 'b',
        text: 'Dejar todo LAZY y escribir consultas con join fetch específicas para cada caso de uso, devolviendo DTOs.',
        consequence: 'Más consultas escritas a mano, y cada endpoint trae exactamente lo que necesita. Es la respuesta profesional.'
      },
      {
        id: 'c',
        text: 'Dejar todo LAZY y forzar la carga accediendo a las relaciones dentro del Service.',
        consequence: 'Evitas la excepción y reintroduces el N+1 por la puerta de atrás. Funciona y es lento.'
      },
      {
        id: 'd',
        text: 'Usar EAGER en las relaciones pequeñas y LAZY en las grandes.',
        consequence: 'Parece razonable y ata la decisión al mapeo en vez de al caso de uso. El endpoint que no necesita Cliente lo trae igual.'
      }
    ],
    answer: 'b',
    explain: 'La regla práctica es: LAZY por defecto en el mapeo, y la decisión de qué cargar se toma por consulta. El mapeo describe el modelo; la consulta describe la necesidad.'
  },
  {
    id: 'w10-q4',
    worldId: 'w10',
    kind: 'quiz',
    concepts: ['onetoone', 'joincolumn'],
    difficulty: 3,
    xp: 16,
    prompt: 'Usuario tiene un Perfil y cada Perfil pertenece a un solo Usuario. ¿Cómo se mapea?',
    options: [
      {
        id: 'a',
        text: '@OneToOne con @JoinColumn en el lado dueño, y @OneToOne(mappedBy = "...") en el inverso.'
      },
      { id: 'b', text: '@ManyToOne en ambos lados.' },
      { id: 'c', text: '@OneToMany con una lista de un solo elemento.' },
      { id: 'd', text: 'No hace falta anotar nada: JPA lo deduce del nombre.' }
    ],
    answer: 'a',
    explain: 'La lógica es la misma que en @ManyToOne: un lado tiene la clave foránea y es el dueño; el otro se declara inverso con mappedBy. La diferencia es que la columna suele llevar restricción única.',
    deeper: 'Cuidado con el fetch: @OneToOne es EAGER por defecto, al revés que @OneToMany. Es una fuente silenciosa de consultas extra en cada carga de la entidad.'
  },
]

export default challenges
