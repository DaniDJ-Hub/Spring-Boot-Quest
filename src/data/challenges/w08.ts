import type { Challenge } from '../../types'

/** Mundo 8 · AOP — Programación orientada a aspectos: lo que hay detrás de Spring
 *  Cobertura en el curso: 24–30 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w08-q1',
    worldId: 'w08',
    kind: 'quiz',
    concepts: ['aspect', 'around'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Qué puede hacer un @Around que no pueden hacer @Before ni @After?',
    options: [
      { id: 'a', text: 'Leer los argumentos del método.' },
      {
        id: 'b',
        text: 'Decidir si el método original se ejecuta o no, y modificar su valor de retorno.'
      },
      { id: 'c', text: 'Escribir en el log.' },
      { id: 'd', text: 'Aplicarse a varios métodos a la vez.' }
    ],
    answer: 'b',
    explain: '@Around recibe un ProceedingJoinPoint y controla la llamada a proceed(). Si no llamas a proceed(), el método nunca se ejecuta. Ese control es la base de las transacciones y del caché.',
    deeper: 'Es también la razón de que un @Around mal escrito rompa toda la aplicación en silencio: si olvidas retornar el resultado de proceed(), todos los métodos interceptados devuelven null.'
  },
  {
    id: 'w08-c1',
    worldId: 'w08',
    kind: 'codefix',
    concepts: ['around', 'joinpoint'],
    difficulty: 4,
    xp: 18,
    prompt: 'Desde que se agregó este aspecto, todos los métodos interceptados devuelven null. Elige la corrección.',
    code: '@Around("execution(* com.demo.service.*.*(..))")\npublic Object medir(ProceedingJoinPoint pjp) throws Throwable {\n    long t = System.currentTimeMillis();\n    pjp.proceed();\n    log.info("{} ms", System.currentTimeMillis() - t);\n    return null;\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Capturar el resultado de proceed() y retornarlo.',
        code: 'Object resultado = pjp.proceed();\nlog.info("{} ms", System.currentTimeMillis() - t);\nreturn resultado;'
      },
      {
        id: 'b',
        text: 'Cambiar el tipo de retorno a void.',
        code: 'public void medir(ProceedingJoinPoint pjp)'
      },
      {
        id: 'c',
        text: 'Usar @Before en lugar de @Around.',
        code: '@Before("execution(* com.demo.service.*.*(..))")'
      },
      {
        id: 'd',
        text: 'Llamar a proceed() dos veces.',
        code: 'pjp.proceed();\nreturn pjp.proceed();'
      }
    ],
    answer: 'a',
    explain: 'El aspecto sustituye a la llamada original: lo que él retorna es lo que recibe quien llamó. Devolver null descarta el resultado real del método.',
    deeper: 'La opción D es peor de lo que parece: ejecutaría el método dos veces. Si ese método guarda en base de datos, duplicas registros.'
  },
  {
    id: 'w08-d1',
    worldId: 'w08',
    kind: 'debug',
    concepts: ['proxy', 'aspect'],
    difficulty: 5,
    xp: 22,
    prompt: 'El aspecto funciona cuando el método se llama desde un Controller, pero no cuando se llama desde otro método de la misma clase. ¿Por qué?',
    code: '@Service\npublic class PedidoService {\n\n    public void procesar(Pedido p) {\n        validar(p);       // el aspecto NO se dispara aquí\n        guardar(p);\n    }\n\n    @Auditado\n    public void validar(Pedido p) { ... }\n}',
    lang: 'java',
    options: [
      { id: 'a', text: 'Los aspectos no funcionan con métodos public.' },
      {
        id: 'b',
        text: 'Spring intercepta a través de un proxy que envuelve al bean. Una llamada interna con this no pasa por el proxy, así que el aspecto no se aplica.'
      },
      { id: 'c', text: 'Falta anotar la clase con @Aspect.' },
      { id: 'd', text: 'El pointcut está mal escrito.' }
    ],
    answer: 'b',
    explain: 'Lo que se inyecta en el Controller no es tu objeto, es un proxy que lo envuelve. Las llamadas que entran desde fuera pasan por el proxy; las que salen de this van directo al objeto real y saltan toda la lógica del aspecto.',
    deeper: 'Este mismo mecanismo explica por qué @Transactional tampoco funciona en llamadas internas. La solución habitual es mover el método a otro bean, o inyectarse a sí mismo, aunque lo primero suele ser mejor diseño.'
  },
  {
    id: 'w08-f1',
    worldId: 'w08',
    kind: 'fill',
    concepts: ['aspect'],
    difficulty: 2,
    xp: 12,
    prompt: 'Faltan las dos anotaciones que convierten esta clase en un aspecto administrado por Spring.',
    code: '_________\n_________\npublic class AuditoriaAspect {\n\n    @Before("execution(* com.demo.service.*.*(..))")\n    public void registrar(JoinPoint jp) {\n        log.info("Llamada a {}", jp.getSignature().getName());\n    }\n}',
    lang: 'java',
    accept: ['aspect component', 'component aspect', '@aspect @component', '@component @aspect'],
    placeholder: '@Aspect @Component',
    explain: '@Aspect define el comportamiento pero no lo registra: sin @Component (o una declaración @Bean) la clase no es un bean y Spring nunca la aplica. Es el fallo más común del módulo.',
    hint: 'Una anotación describe qué es; la otra hace que Spring lo vea.'
  },
  {
    id: 'w08-q2',
    worldId: 'w08',
    kind: 'quiz',
    concepts: ['pointcut'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Para qué sirve declarar un @Pointcut con nombre en vez de escribir la expresión en cada advice?',
    options: [
      { id: 'a', text: 'Para que la expresión se ejecute más rápido.' },
      {
        id: 'b',
        text: 'Para reutilizar la misma expresión en varios advices y cambiarla en un solo lugar.'
      },
      { id: 'c', text: 'Es obligatorio desde Spring 6.' },
      {
        id: 'd',
        text: 'Para que el aspecto se aplique también a clases sin anotar.'
      }
    ],
    answer: 'b',
    explain: 'Es la misma lógica que extraer una constante. Una expresión de pointcut repetida en cinco advices se desincroniza en cuanto alguien cambia el paquete de un Service.'
  },
  {
    id: 'w08-o1',
    worldId: 'w08',
    kind: 'order',
    concepts: ['around', 'before', 'after'],
    difficulty: 4,
    xp: 18,
    prompt: 'Un método tiene un @Around y un @Before aplicados. Ordena la ejecución.',
    steps: [
      'Entra el @Around, antes de llamar a proceed()',
      'Se ejecuta el @Before',
      'Se ejecuta el método original',
      'Vuelve el control al @Around, después de proceed()',
      'Quien llamó recibe el valor que retornó el @Around'
    ],
    explain: '@Around envuelve todo lo demás, incluidos los otros advices. Por eso es el más poderoso y también el más fácil de romper: cualquier error dentro afecta a todo lo que envuelve.'
  },
  {
    id: 'w08-dec1',
    worldId: 'w08',
    kind: 'decision',
    concepts: ['aspect', 'capas'],
    difficulty: 4,
    xp: 18,
    prompt: 'Te piden registrar en auditoría todas las operaciones que modifican datos. Son 40 métodos repartidos en 12 Services. ¿Cómo lo haces?',
    options: [
      {
        id: 'a',
        text: 'Agregar una llamada al servicio de auditoría al inicio de cada uno de los 40 métodos.',
        consequence: 'Cuarenta lugares donde el requisito puede olvidarse. El método 41 que alguien escriba el mes que viene no tendrá auditoría.'
      },
      {
        id: 'b',
        text: 'Un aspecto con una anotación propia @Auditado que se coloca sobre los métodos que aplican.',
        consequence: 'Una sola implementación, y marcar un método nuevo cuesta una línea. La intención queda visible en el código.'
      },
      {
        id: 'c',
        text: 'Un aspecto sobre todos los métodos de todos los Services, sin anotación.',
        consequence: 'Auditas también las lecturas y llenas la tabla de ruido. Además, nadie que lea un Service sabe que está siendo auditado.'
      },
      {
        id: 'd',
        text: 'Un interceptor HTTP que registre todas las peticiones POST, PUT y DELETE.',
        consequence: 'Pierdes lo que ocurre fuera de HTTP y registras intentos que fallaron antes de llegar a modificar nada.'
      }
    ],
    answer: 'b',
    explain: 'La anotación propia es lo que separa B de C: mantienes la ventaja de la implementación única y conservas la intención explícita en cada método. Es exactamente el patrón con el que Spring implementa @Transactional.'
  },
]

export default challenges
