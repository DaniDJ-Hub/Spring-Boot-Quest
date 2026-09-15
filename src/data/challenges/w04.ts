import type { Challenge } from '../../types'

/** Mundo 4 · Inyección de dependencias — El contenedor IoC: el corazón del framework
 *  Cobertura en el curso: 12–20 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w04-q1',
    worldId: 'w04',
    kind: 'quiz',
    concepts: ['ioc'],
    difficulty: 2,
    xp: 12,
    prompt: '¿Qué se "invierte" exactamente en la inversión de control?',
    options: [
      { id: 'a', text: 'El orden de ejecución de los métodos.' },
      {
        id: 'b',
        text: 'Quién crea los objetos: en vez de que tu clase haga new de sus dependencias, el contenedor las construye y se las entrega.'
      },
      { id: 'c', text: 'La dirección de las peticiones HTTP.' },
      { id: 'd', text: 'El sentido de la herencia entre clases.' }
    ],
    answer: 'b',
    explain: 'Tu clase deja de decidir qué implementación concreta usa y pasa a declarar qué necesita. El contenedor decide qué entregarle. Eso es lo que permite cambiar la implementación sin tocar la clase que la consume.',
    deeper: 'Consecuencia práctica: si el campo es del tipo de la interfaz y no de la clase concreta, puedes sustituir la implementación entera cambiando una anotación.'
  },
  {
    id: 'w04-c1',
    worldId: 'w04',
    kind: 'codefix',
    concepts: ['autowired', 'component'],
    difficulty: 2,
    xp: 14,
    prompt: 'La app falla al arrancar con NoSuchBeanDefinitionException para CalculadoraIva. Elige la corrección.',
    code: '// CalculadoraIva.java\npublic class CalculadoraIva {\n    public double aplicar(double monto) { return monto * 1.16; }\n}\n\n// FacturaService.java\n@Service\npublic class FacturaService {\n    @Autowired\n    private CalculadoraIva calculadora;\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Anotar CalculadoraIva con @Component para que el contenedor la administre.',
        code: '@Component\npublic class CalculadoraIva { ... }'
      },
      {
        id: 'b',
        text: 'Hacer el campo estático.',
        code: '@Autowired\nprivate static CalculadoraIva calculadora;'
      },
      {
        id: 'c',
        text: 'Instanciarla a mano dentro del Service.',
        code: 'private CalculadoraIva calculadora = new CalculadoraIva();'
      },
      {
        id: 'd',
        text: 'Agregar @Autowired también sobre la clase.',
        code: '@Autowired\npublic class CalculadoraIva { ... }'
      }
    ],
    answer: 'a',
    explain: 'Spring solo inyecta lo que administra. Una clase sin estereotipo (@Component, @Service, @Repository, @Controller) es invisible para el contenedor por más @Autowired que pongas del otro lado.',
    deeper: 'La opción C compila y funciona, pero pierdes todo: no puedes sustituirla en pruebas, no puedes inyectarle nada a ella, y si mañana necesita configuración tienes que propagar el new por todos lados.'
  },
  {
    id: 'w04-q2',
    worldId: 'w04',
    kind: 'quiz',
    concepts: ['constructor-injection', 'autowired'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Por qué se recomienda inyectar por constructor en vez de por campo?',
    options: [
      { id: 'a', text: 'Porque es más rápido en tiempo de ejecución.' },
      {
        id: 'b',
        text: 'Porque permite declarar el campo final, hace obligatoria la dependencia y deja la clase construible sin el contenedor.'
      },
      {
        id: 'c',
        text: 'Porque la inyección por campo está descontinuada y ya no compila.'
      },
      {
        id: 'd',
        text: 'Porque el constructor evita las dependencias circulares automáticamente.'
      }
    ],
    answer: 'b',
    explain: 'Un objeto construido por constructor nunca existe a medias. Con inyección por campo puedes tener una instancia con dependencias en null durante un instante, y no puedes marcar el campo como final.',
    deeper: 'Efecto secundario útil: las dependencias circulares explotan en el arranque con inyección por constructor, en vez de esconderse. Un fallo temprano y ruidoso es mejor que uno tardío y silencioso.'
  },
  {
    id: 'w04-d1',
    worldId: 'w04',
    kind: 'debug',
    concepts: ['qualifier', 'primary'],
    difficulty: 4,
    xp: 18,
    prompt: 'La app no arranca. Hay dos implementaciones de la misma interfaz. ¿Cuál es la solución correcta?',
    code: 'Parameter 0 of constructor in com.demo.PagoService required a single bean,\nbut 2 were found:\n	- pagoTarjeta: defined in file [PagoTarjeta.class]\n	- pagoTransferencia: defined in file [PagoTransferencia.class]',
    lang: 'log',
    options: [
      { id: 'a', text: 'Borrar una de las dos implementaciones.' },
      {
        id: 'b',
        text: 'Marcar una con @Primary como opción por defecto, o usar @Qualifier en el punto de inyección para elegir explícitamente.'
      },
      { id: 'c', text: 'Quitar la interfaz y usar la clase concreta.' },
      { id: 'd', text: 'Anotar ambas con @Primary.' }
    ],
    answer: 'b',
    explain: 'Spring inyecta por tipo. Con dos candidatos del mismo tipo necesita un desempate: @Primary define un ganador global, @Qualifier decide caso por caso. Ambas soluciones son válidas y se combinan.',
    deeper: 'Tener dos implementaciones no es el problema, es la gracia del diseño. Anotar ambas con @Primary reproduce el mismo error con otro mensaje.'
  },
  {
    id: 'w04-q3',
    worldId: 'w04',
    kind: 'quiz',
    concepts: ['bean'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Cuándo necesitas @Bean dentro de una clase @Configuration en vez de @Component sobre la clase?',
    options: [
      {
        id: 'a',
        text: 'Cuando la clase es tuya y quieres que Spring la administre.'
      },
      {
        id: 'b',
        text: 'Cuando el objeto viene de una librería externa que no puedes anotar, o cuando su construcción requiere lógica.'
      },
      { id: 'c', text: 'Cuando quieres que el bean sea prototype.' },
      { id: 'd', text: '@Bean y @Component son intercambiables siempre.' }
    ],
    answer: 'b',
    explain: 'No puedes anotar el código fuente de una librería de terceros. @Bean te deja registrar el objeto desde tu propio método de configuración, con la construcción que necesites.',
    deeper: 'Lo verás en Spring Security: el PasswordEncoder se declara con @Bean porque BCryptPasswordEncoder viene de la librería y necesitas elegir su factor de coste.'
  },
  {
    id: 'w04-o1',
    worldId: 'w04',
    kind: 'order',
    concepts: ['ioc', 'autowired', 'component'],
    difficulty: 3,
    xp: 16,
    prompt: 'Ordena cómo el contenedor resuelve una inyección.',
    steps: [
      'Escanea los paquetes buscando clases con estereotipo',
      'Registra la definición de cada bean encontrado',
      'Detecta los puntos de inyección de cada bean',
      'Busca un candidato compatible por tipo para cada punto',
      'Si hay más de un candidato, aplica @Primary o @Qualifier para desempatar',
      'Instancia el bean y le entrega sus dependencias ya resueltas'
    ],
    explain: 'Todo el proceso ocurre durante el arranque, antes de que llegue la primera petición. Por eso un error de inyección tumba la aplicación entera en vez de fallar en un endpoint concreto.'
  },
  {
    id: 'w04-f1',
    worldId: 'w04',
    kind: 'fill',
    concepts: ['qualifier'],
    difficulty: 3,
    xp: 16,
    prompt: 'Hay dos beans del tipo Notificador. Escribe la anotación que selecciona explícitamente el llamado "notificadorSms".',
    code: '@Service\npublic class AlertaService {\n\n    private final Notificador notificador;\n\n    public AlertaService(_________________________ Notificador notificador) {\n        this.notificador = notificador;\n    }\n}',
    lang: 'java',
    accept: ['qualifier("notificadorsms")', 'qualifier(\'notificadorsms\')'],
    placeholder: '@Qualifier("...")',
    explain: '@Qualifier resuelve la ambigüedad en el punto de inyección, sin obligarte a marcar un ganador global con @Primary. El nombre por defecto de un bean es el de la clase con la primera letra en minúscula.'
  },
  {
    id: 'w04-dec1',
    worldId: 'w04',
    kind: 'decision',
    concepts: ['constructor-injection', 'capas'],
    difficulty: 4,
    xp: 18,
    prompt: 'Un Service tuyo ha crecido hasta tener nueve dependencias inyectadas por constructor. El equipo propone volver a inyección por campo "para que el constructor no sea tan feo". ¿Qué respondes?',
    options: [
      {
        id: 'a',
        text: 'Aceptar: es solo estética y el código queda más limpio.',
        consequence: 'Escondes el síntoma. La clase sigue teniendo nueve responsabilidades, solo que ahora no se nota al abrirla.'
      },
      {
        id: 'b',
        text: 'Rechazar y proponer partir el Service, porque nueve dependencias son la señal de que la clase hace demasiado.',
        consequence: 'El constructor incómodo estaba haciendo su trabajo: avisar. Partir la clase reduce el acoplamiento de verdad.'
      },
      {
        id: 'c',
        text: 'Dejarlo así e inyectar el ApplicationContext para pedir beans a demanda.',
        consequence: 'Ocultas todas las dependencias detrás de una sola. Ahora nadie puede saber qué usa esta clase sin leer todos sus métodos.'
      },
      {
        id: 'd',
        text: 'Crear una clase Helper que agrupe las nueve y solo inyectar esa.',
        consequence: 'Mueves el problema una capa más abajo. El Helper ahora tiene nueve dependencias y ninguna razón coherente para existir.'
      }
    ],
    answer: 'b',
    explain: 'La incomodidad del constructor largo es información de diseño, no un defecto de la sintaxis. Silenciarla con otra forma de inyección es apagar la alarma en vez de atender el incendio.'
  },
  {
    id: 'w04-q4',
    worldId: 'w04',
    kind: 'quiz',
    concepts: ['service', 'repository', 'component'],
    difficulty: 2,
    xp: 12,
    prompt: '@Component, @Service y @Repository hacen técnicamente casi lo mismo. ¿Por qué existen los tres?',
    options: [
      { id: 'a', text: 'Cada uno registra el bean en un contenedor distinto.' },
      {
        id: 'b',
        text: 'Comunican la intención de la clase, y @Repository además traduce las excepciones del proveedor de persistencia a la jerarquía de Spring.'
      },
      { id: 'c', text: '@Service es más rápido porque no permite inyección.' },
      { id: 'd', text: '@Repository es obligatorio para que JPA funcione.' }
    ],
    answer: 'b',
    explain: 'Los tres registran un bean, y quien lee el código sabe de inmediato qué capa está mirando. La traducción de excepciones de @Repository es la única diferencia funcional real de las tres.',
    deeper: 'Con Spring Data ni siquiera necesitas anotar el repositorio: extender JpaRepository basta. La anotación se vuelve útil cuando escribes una implementación propia de acceso a datos.'
  },
  {
    id: 'w04-a1',
    worldId: 'w04',
    kind: 'arch',
    concepts: ['ioc', 'constructor-injection', 'capas'],
    difficulty: 3,
    xp: 16,
    prompt: 'Necesitas que el Service pueda trabajar contra MySQL hoy y contra una API externa mañana, sin cambiar el Service. ¿Qué diseño lo permite?',
    options: [
      {
        id: 'a',
        text: 'El Service inyecta la clase concreta del repositorio y se cambia cuando llegue el momento.'
      },
      {
        id: 'b',
        text: 'El Service depende de una interfaz de repositorio; hay dos implementaciones y el contenedor decide cuál inyecta con @Primary o @Qualifier.'
      },
      {
        id: 'c',
        text: 'El Service tiene un if que revisa una propiedad y decide qué implementación instanciar.'
      },
      { id: 'd', text: 'Duplicar el Service, uno por cada origen de datos.' }
    ],
    answer: 'b',
    explain: 'Depender de la abstracción es lo que hace la sustitución posible. La decisión de qué implementación se usa sale del Service y pasa a la configuración, que es exactamente el punto de la inversión de control.',
    deeper: 'La opción C es la trampa: parece flexible y mete conocimiento de ambas implementaciones dentro del Service, que ahora depende de las dos.'
  },
]

export default challenges
