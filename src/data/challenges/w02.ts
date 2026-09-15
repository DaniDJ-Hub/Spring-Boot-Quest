import type { Challenge } from '../../types'

/** Mundo 2 · Web MVC y vistas — Controller, Model, Thymeleaf y el retorno de datos
 *  Cobertura en el curso: 5–12 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w02-q1',
    worldId: 'w02',
    kind: 'quiz',
    concepts: ['controller', 'restcontroller'],
    difficulty: 1,
    xp: 10,
    prompt: '¿Cuál es la diferencia real entre @Controller y @RestController?',
    options: [
      {
        id: 'a',
        text: '@RestController equivale a @Controller + @ResponseBody: lo que retorna el método se serializa al cuerpo de la respuesta en vez de interpretarse como nombre de vista.'
      },
      {
        id: 'b',
        text: '@RestController es más rápido porque no usa el contenedor de Spring.'
      },
      {
        id: 'c',
        text: '@Controller solo funciona con Thymeleaf y @RestController solo con Angular.'
      },
      { id: 'd', text: 'Son sinónimos; el nombre cambió entre versiones.' }
    ],
    answer: 'a',
    explain: 'Con @Controller, retornar "usuarios" significa "busca la vista usuarios.html". Con @RestController, ese mismo return manda la cadena "usuarios" como cuerpo de la respuesta.',
    deeper: 'Por eso el error más común al empezar es ver el nombre de la vista impreso como texto plano en el navegador: pusiste @RestController donde querías @Controller.'
  },
  {
    id: 'w02-d1',
    worldId: 'w02',
    kind: 'debug',
    concepts: ['restcontroller', 'thymeleaf'],
    difficulty: 2,
    xp: 14,
    prompt: 'Abres el navegador en /clientes y en vez de la página ves la palabra "lista" en texto plano. El archivo lista.html existe en templates/. ¿Qué pasó?',
    code: '@RestController\npublic class ClienteController {\n\n    @GetMapping("/clientes")\n    public String listar(Model model) {\n        model.addAttribute("clientes", servicio.buscarTodos());\n        return "lista";\n    }\n}',
    lang: 'java',
    options: [
      { id: 'a', text: 'Falta la dependencia de Thymeleaf.' },
      {
        id: 'b',
        text: 'La clase está anotada con @RestController, así que el return se escribe en el cuerpo de la respuesta. Debe ser @Controller.'
      },
      { id: 'c', text: 'El archivo debería llamarse lista.thymeleaf.' },
      { id: 'd', text: 'Model no se puede usar con @GetMapping.' }
    ],
    answer: 'b',
    explain: 'El síntoma es inconfundible: el nombre de la vista aparece como texto. Con @Controller, el resolver busca templates/lista.html y renderiza; con @RestController, nadie resuelve nada.'
  },
  {
    id: 'w02-q2',
    worldId: 'w02',
    kind: 'quiz',
    concepts: ['dto'],
    difficulty: 3,
    xp: 16,
    prompt: 'Tu endpoint devuelve directamente la entidad Usuario, que tiene el campo password. ¿Cuál es el argumento más fuerte para introducir un DTO?',
    options: [
      { id: 'a', text: 'Los DTO son más rápidos de serializar.' },
      {
        id: 'b',
        text: 'La entidad modela la tabla; el DTO modela el contrato de la API. Al exponer la entidad filtras datos internos y atas tu API al esquema de la base de datos.'
      },
      { id: 'c', text: 'Sin DTO no se puede usar Jackson.' },
      { id: 'd', text: 'Es una convención sin efecto práctico.' }
    ],
    answer: 'b',
    explain: 'Son dos modelos con vidas distintas. Renombrar una columna no debería romper a los clientes de tu API, y agregar un campo a la respuesta no debería obligarte a alterar la tabla.',
    deeper: 'La fuga de password es el caso obvio. El caso silencioso es peor: expones una relación LAZY, Jackson intenta serializarla y arrastras media base de datos en un JSON.'
  },
  {
    id: 'w02-f1',
    worldId: 'w02',
    kind: 'fill',
    concepts: ['controller'],
    difficulty: 1,
    xp: 10,
    prompt: 'Falta la anotación que mapea este método a una petición GET sobre /api/productos.',
    code: '@RestController\npublic class ProductoController {\n\n    ______________________\n    public List<Producto> listar() {\n        return servicio.findAll();\n    }\n}',
    lang: 'java',
    accept: [
      'getmapping("/api/productos")',
      'getmapping(\'/api/productos\')',
      'getmapping("/api/productos" )',
      'requestmapping(value="/api/productos",method=requestmethod.get)'
    ],
    placeholder: '@GetMapping("...")',
    explain: '@GetMapping("/api/productos") es la forma corta de @RequestMapping(value = "/api/productos", method = RequestMethod.GET). Ambas son válidas; la corta es la que verás en código moderno.'
  },
  {
    id: 'w02-o1',
    worldId: 'w02',
    kind: 'order',
    concepts: ['controller', 'model', 'thymeleaf'],
    difficulty: 2,
    xp: 14,
    prompt: 'Ordena el recorrido de una petición en Spring MVC con vista server-side.',
    steps: [
      'El navegador envía GET /clientes',
      'El DispatcherServlet recibe la petición y busca qué método la atiende',
      'Se ejecuta el método del Controller y llena el Model',
      'El Controller retorna el nombre lógico de la vista',
      'El view resolver localiza la plantilla y la renderiza con los datos del Model',
      'El HTML resultante viaja de vuelta al navegador'
    ],
    explain: 'El DispatcherServlet es la pieza central de MVC: nada llega al Controller sin pasar por él. Entender este recorrido es lo que te permite ubicar dónde meter un interceptor más adelante.'
  },
  {
    id: 'w02-c1',
    worldId: 'w02',
    kind: 'codefix',
    concepts: ['restcontroller', 'controller'],
    difficulty: 2,
    xp: 14,
    prompt: 'Este controlador devuelve 404 en /api/saludo aunque la app arranca sin errores. Elige la corrección.',
    code: 'public class SaludoController {\n\n    @GetMapping("/api/saludo")\n    public String saludar() {\n        return "hola";\n    }\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Anotar la clase con @RestController para que Spring la registre como controlador.',
        code: '@RestController\npublic class SaludoController { ... }'
      },
      {
        id: 'b',
        text: 'Cambiar el tipo de retorno a ResponseEntity<String>.',
        code: 'public ResponseEntity<String> saludar() { ... }'
      },
      {
        id: 'c',
        text: 'Agregar el método a application.properties.',
        code: 'app.endpoints=/api/saludo'
      },
      {
        id: 'd',
        text: 'Hacer el método estático.',
        code: 'public static String saludar() { ... }'
      }
    ],
    answer: 'a',
    explain: 'Sin anotación de estereotipo, la clase no es un bean: Spring nunca la escanea y el mapping no se registra. El 404 no es un error de ruta, es una clase que para el contenedor no existe.'
  },
  {
    id: 'w02-dec1',
    worldId: 'w02',
    kind: 'decision',
    concepts: ['thymeleaf', 'dto', 'restcontroller'],
    difficulty: 3,
    xp: 16,
    prompt: 'El cliente quiere una app web y, en seis meses, una app móvil. ¿Cómo planteas el backend hoy?',
    options: [
      {
        id: 'a',
        text: 'Todo con Thymeleaf ahora, y en seis meses agrego una API REST aparte.',
        consequence: 'Terminas con dos capas de presentación y lógica duplicada, o refactorizando bajo presión con la fecha de la app móvil encima.'
      },
      {
        id: 'b',
        text: 'Una API REST con DTOs desde el inicio, y la web consume esa misma API.',
        consequence: 'La app móvil no requiere backend nuevo. A cambio, la web es más trabajo al principio que un Thymeleaf directo.'
      },
      {
        id: 'c',
        text: 'Thymeleaf y REST conviviendo, cada uno con sus propios Services.',
        consequence: 'Dos caminos hacia los mismos datos que se desincronizan a la primera regla de negocio que cambia.'
      },
      {
        id: 'd',
        text: 'Esperar a que llegue el requerimiento móvil para decidir.',
        consequence: 'La decisión se toma igual, solo que más tarde y con más código que mover.'
      }
    ],
    answer: 'b',
    explain: 'La opción B tiene un costo inicial real y lo paga una sola vez. La clave es que el Service es el mismo en ambos casos: lo que cambia es quién lo consume.'
  },
]

export default challenges
