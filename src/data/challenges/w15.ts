import type { Challenge } from '../../types'

/** Mundo 15 · App MVC completa — El proyecto integrador: login, MySQL, i18n, paginación y archivos
 *  Cobertura en el curso: 70–100 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w15-q1',
    worldId: 'w15',
    kind: 'quiz',
    concepts: ['paginacion'],
    difficulty: 3,
    xp: 16,
    prompt: 'Un listado con 50 000 registros tarda 12 segundos. ¿Qué corrige el problema de raíz?',
    options: [
      { id: 'a', text: 'Aumentar la memoria de la JVM.' },
      {
        id: 'b',
        text: 'Paginar: recibir Pageable en el Controller y devolver un Page, para que la base de datos limite las filas en el propio SELECT.'
      },
      { id: 'c', text: 'Cargar todo y paginar en el navegador con JavaScript.' },
      { id: 'd', text: 'Añadir caché a la consulta.' }
    ],
    answer: 'b',
    explain: 'La paginación tiene que llegar hasta el SQL. Si traes las 50 000 filas y cortas después, ya pagaste el coste completo en la base de datos, en la red y en memoria.',
    deeper: 'Page además te devuelve el total de elementos y de páginas, que es lo que la vista necesita para dibujar los controles de navegación.'
  },
  {
    id: 'w15-q2',
    worldId: 'w15',
    kind: 'quiz',
    concepts: ['flash-attributes', 'redirect'],
    difficulty: 3,
    xp: 16,
    prompt: 'Después de guardar un formulario haces redirect a la lista y el mensaje "Guardado con éxito" desaparece. ¿Por qué y cómo se resuelve?',
    options: [
      {
        id: 'a',
        text: 'El redirect inicia una petición nueva y el Model anterior se pierde. Se resuelve con flash attributes, que sobreviven exactamente un redirect.'
      },
      { id: 'b', text: 'Hay que guardar el mensaje en la base de datos.' },
      {
        id: 'c',
        text: 'Hay que devolver la vista directamente en vez de redirigir.'
      },
      { id: 'd', text: 'El mensaje debe ir en la URL.' }
    ],
    answer: 'a',
    explain: 'El patrón POST-Redirect-GET evita que recargar la página reenvíe el formulario. El precio es que el Model no cruza el redirect, y los flash attributes existen precisamente para eso.',
    deeper: 'La opción C reintroduce el problema del doble envío: el usuario recarga, el navegador repite el POST y se guarda dos veces.'
  },
  {
    id: 'w15-d1',
    worldId: 'w15',
    kind: 'debug',
    concepts: ['upload-archivos'],
    difficulty: 3,
    xp: 16,
    prompt: 'La subida de un archivo de 4 MB falla con este error. ¿Qué se ajusta?',
    code: 'org.springframework.web.multipart.MaxUploadSizeExceededException:\nMaximum upload size exceeded; nested exception is\njava.lang.IllegalStateException: The field archivo exceeds its maximum permitted size of 1048576 bytes.',
    lang: 'log',
    options: [
      {
        id: 'a',
        text: 'Las propiedades de tamaño máximo de archivo y de petición en application.properties.'
      },
      { id: 'b', text: 'La memoria de la JVM.' },
      { id: 'c', text: 'El tipo del parámetro, que debe ser byte[].' },
      { id: 'd', text: 'El Content-Type del formulario.' }
    ],
    answer: 'a',
    explain: 'El límite por defecto es 1 MB por archivo. Son dos propiedades distintas: la del archivo individual y la de la petición completa, que debe ser mayor si se suben varios a la vez.',
    deeper: 'Subir el límite no es gratis: cada archivo en vuelo consume memoria o disco temporal. Un límite alto sin control de concurrencia es una vía de denegación de servicio.'
  },
  {
    id: 'w15-q3',
    worldId: 'w15',
    kind: 'quiz',
    concepts: ['i18n'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Cómo decide Spring qué idioma mostrar cuando la app está internacionalizada?',
    options: [
      { id: 'a', text: 'Por la ubicación geográfica de la IP.' },
      {
        id: 'b',
        text: 'Mediante un LocaleResolver, que puede leer la cabecera Accept-Language, una cookie, la sesión o un parámetro de la URL según cómo lo configures.'
      },
      { id: 'c', text: 'Siempre por el idioma del sistema operativo del servidor.' },
      { id: 'd', text: 'Por el dominio desde el que se accede.' }
    ],
    answer: 'b',
    explain: 'Los textos viven en archivos messages_es.properties, messages_en.properties, y la vista los referencia por clave. El LocaleResolver es quien decide qué archivo se usa en cada petición.',
    deeper: 'El detalle que rompe la funcionalidad: cambiar de idioma con un parámetro requiere además registrar un interceptor que detecte ese parámetro y actualice el locale.'
  },
  {
    id: 'w15-o1',
    worldId: 'w15',
    kind: 'order',
    concepts: ['sesion-mvc', 'redirect', 'flash-attributes'],
    difficulty: 4,
    xp: 18,
    prompt: 'Ordena el flujo completo de un alta desde formulario en una app MVC.',
    steps: [
      'GET del formulario vacío, con el objeto añadido al Model',
      'El usuario envía el formulario por POST',
      '@ModelAttribute enlaza los campos y @Valid ejecuta las restricciones',
      'Si hay errores, se retorna la misma vista con los mensajes',
      'Si todo es válido, el Service guarda y se añade un flash attribute',
      'Se redirige a la lista, que muestra el mensaje de éxito una sola vez'
    ],
    explain: 'Los pasos 4 y 5 son la bifurcación completa: el error vuelve a la vista sin redirect, para conservar los datos escritos; el éxito redirige, para que recargar no duplique.'
  },
  {
    id: 'w15-dec1',
    worldId: 'w15',
    kind: 'decision',
    concepts: ['capas', 'dto', 'paginacion'],
    difficulty: 5,
    xp: 22,
    prompt: 'Última decisión del curso. Te heredan una app con toda la lógica en los Controllers, sin DTOs, con relaciones EAGER y listados sin paginar. Funciona y está en producción. ¿Por dónde empiezas?',
    options: [
      {
        id: 'a',
        text: 'Reescribir todo con la arquitectura correcta antes de tocar nada más.',
        consequence: 'Meses sin entregar valor y un riesgo enorme de romper comportamiento que nadie documentó. Casi siempre se abandona a la mitad.'
      },
      {
        id: 'b',
        text: 'Medir primero: identificar los endpoints más lentos o más usados y refactorizar esos, uno a uno, con la app funcionando.',
        consequence: 'Mejoras verificables desde la primera semana y riesgo acotado en cada paso. Es más lento de sentir y es lo que sobrevive al contacto con la realidad.'
      },
      {
        id: 'c',
        text: 'Dejarlo como está: funciona.',
        consequence: 'Funciona hasta que el volumen crece o entra un requisito que la estructura no soporta. Entonces el coste es el mismo de A, pero con una fecha encima.'
      },
      {
        id: 'd',
        text: 'Cambiar todas las relaciones a LAZY de golpe, que es el arreglo más rápido.',
        consequence: 'Provocas LazyInitializationException en cualquier endpoint que serializara esas relaciones. Un cambio global sin DTOs rompe la app entera.'
      }
    ],
    answer: 'b',
    explain: 'La respuesta profesional casi nunca es el rediseño total ni la resignación. Es acotar el alcance, medir antes de decidir y dejar cada paso en un estado desplegable.'
  },
  {
    id: 'w15-c1',
    worldId: 'w15',
    kind: 'codefix',
    concepts: ['paginacion'],
    difficulty: 3,
    xp: 16,
    prompt: 'Este endpoint pagina, pero el log muestra que trae los 50 000 registros en cada llamada. Elige la corrección.',
    code: '@GetMapping("/clientes")\npublic String listar(Model model, @RequestParam(defaultValue = "0") int page) {\n    List<Cliente> todos = repo.findAll();\n    model.addAttribute("clientes", todos.subList(page * 20, page * 20 + 20));\n    return "lista";\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Recibir un Pageable y devolver un Page, para que el límite llegue al SQL.',
        code: '@GetMapping("/clientes")\npublic String listar(Model model, @PageableDefault(size = 20) Pageable pageable) {\n    model.addAttribute("clientes", repo.findAll(pageable));\n    return "lista";\n}'
      },
      {
        id: 'b',
        text: 'Añadir caché sobre findAll().',
        code: '@Cacheable("clientes")\nList<Cliente> findAll();'
      },
      {
        id: 'c',
        text: 'Aumentar el tamaño del pool de conexiones.',
        code: 'spring.datasource.hikari.maximum-pool-size=50'
      },
      {
        id: 'd',
        text: 'Cambiar subList por un stream con limit.',
        code: 'todos.stream().skip(page * 20).limit(20).toList()'
      }
    ],
    answer: 'a',
    explain: 'Cortar en Java ocurre después de haber traído todo. Pageable se traduce a LIMIT y OFFSET en la consulta, así que la base de datos solo devuelve las veinte filas.',
    deeper: 'La opción D es el mismo error con sintaxis más moderna: sigue cargando los 50 000 registros en memoria antes de descartarlos.'
  },
  {
    id: 'w15-f1',
    worldId: 'w15',
    kind: 'fill',
    concepts: ['flash-attributes', 'redirect'],
    difficulty: 3,
    xp: 16,
    prompt: 'Escribe el nombre del parámetro que hay que recibir para poder enviar un mensaje que sobreviva al redirect.',
    code: '@PostMapping("/clientes")\npublic String guardar(@Valid Cliente cliente, BindingResult result,\n                     ______________________ flash) {\n\n    servicio.guardar(cliente);\n    flash.addFlashAttribute("mensaje", "Cliente guardado");\n    return "redirect:/clientes";\n}',
    lang: 'java',
    accept: ['redirectattributes'],
    placeholder: 'Tipo del parámetro',
    explain: 'RedirectAttributes guarda el valor temporalmente para la siguiente petición y lo descarta después. Un atributo normal del Model se pierde en cuanto el navegador hace la petición nueva.'
  },
]

export default challenges
