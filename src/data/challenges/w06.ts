import type { Challenge } from '../../types'

/** Mundo 6 · Manejo de excepciones — Errores que el cliente entiende, no stack traces crudos
 *  Cobertura en el curso: 18–27 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w06-q1',
    worldId: 'w06',
    kind: 'quiz',
    concepts: ['controlleradvice', 'exceptionhandler'],
    difficulty: 2,
    xp: 12,
    prompt: '¿Qué diferencia hay entre poner @ExceptionHandler dentro de un Controller y ponerlo en una clase @ControllerAdvice?',
    options: [
      { id: 'a', text: 'Ninguna, son sinónimos.' },
      {
        id: 'b',
        text: 'Dentro del Controller aplica solo a ese Controller; en @ControllerAdvice aplica a todos, de forma centralizada.'
      },
      {
        id: 'c',
        text: '@ControllerAdvice solo funciona con excepciones de Spring, no con las tuyas.'
      },
      {
        id: 'd',
        text: '@ExceptionHandler dentro del Controller está descontinuado.'
      }
    ],
    answer: 'b',
    explain: 'El manejo local es útil cuando un Controller tiene un error propio suyo. El @ControllerAdvice es donde defines cómo responde toda la API ante cada tipo de error, en un solo lugar.',
    deeper: 'Si ambos existen para la misma excepción, gana el del Controller. Sirve para hacer excepciones a la regla general sin romperla.'
  },
  {
    id: 'w06-d1',
    worldId: 'w06',
    kind: 'debug',
    concepts: ['codigos-http', 'controlleradvice'],
    difficulty: 3,
    xp: 16,
    prompt: 'Un cliente pide /api/productos/9999, que no existe. La API responde 500 con un stack trace completo en el JSON. ¿Cuál es el problema de fondo?',
    code: '@GetMapping("/api/productos/{id}")\npublic Producto ver(@PathVariable Long id) {\n    return repo.findById(id).orElseThrow();\n}\n\n// Respuesta: 500 Internal Server Error\n// {"timestamp":"...","status":500,"error":"Internal Server Error",\n//  "trace":"java.util.NoSuchElementException: No value present\\n\\tat ..."}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'El endpoint debería devolver null cuando no encuentra nada.'
      },
      {
        id: 'b',
        text: 'Un recurso inexistente es un 404, no un 500: hace falta una excepción propia mapeada en @ControllerAdvice, y no exponer el trace.'
      },
      { id: 'c', text: 'El id debería ser String para aceptar valores grandes.' },
      {
        id: 'd',
        text: 'Hay que capturar la excepción con try/catch dentro del método.'
      }
    ],
    answer: 'b',
    explain: 'El 500 le dice al cliente "mi servidor está roto", cuando en realidad su petición fue la del error. Además, el trace revela paquetes, versiones y estructura interna a cualquiera que llame la API.',
    deeper: 'Devolver null (opción A) es peor: el cliente recibe 200 con cuerpo vacío y cree que la operación fue exitosa.'
  },
  {
    id: 'w06-c1',
    worldId: 'w06',
    kind: 'codefix',
    concepts: ['controlleradvice', 'responsestatus'],
    difficulty: 3,
    xp: 16,
    prompt: 'El @ControllerAdvice está escrito pero la API sigue respondiendo 500. Elige la corrección.',
    code: '@ControllerAdvice\npublic class ManejadorErrores {\n\n    @ExceptionHandler(ProductoNoEncontrado.class)\n    public ErrorDto manejar(ProductoNoEncontrado ex) {\n        return new ErrorDto(ex.getMessage());\n    }\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Usar @RestControllerAdvice (o agregar @ResponseBody) y declarar el estado con @ResponseStatus o ResponseEntity.',
        code: '@RestControllerAdvice\npublic class ManejadorErrores {\n\n    @ExceptionHandler(ProductoNoEncontrado.class)\n    @ResponseStatus(HttpStatus.NOT_FOUND)\n    public ErrorDto manejar(ProductoNoEncontrado ex) {\n        return new ErrorDto(ex.getMessage());\n    }\n}'
      },
      {
        id: 'b',
        text: 'Registrar la clase en application.properties.',
        code: 'spring.mvc.advice=ManejadorErrores'
      },
      {
        id: 'c',
        text: 'Extender de RuntimeException en el manejador.',
        code: 'public class ManejadorErrores extends RuntimeException { ... }'
      },
      {
        id: 'd',
        text: 'Cambiar @ExceptionHandler por @ErrorHandler.',
        code: '@ErrorHandler(ProductoNoEncontrado.class)'
      }
    ],
    answer: 'a',
    explain: 'Faltaban dos cosas. Sin @ResponseBody el ErrorDto se interpreta como nombre de vista, y sin declarar el estado la respuesta sale con el código por defecto en vez de 404.'
  },
  {
    id: 'w06-q2',
    worldId: 'w06',
    kind: 'quiz',
    concepts: ['excepciones-custom'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Por qué conviene crear excepciones propias en vez de lanzar RuntimeException con un mensaje?',
    options: [
      {
        id: 'a',
        text: 'Porque RuntimeException no se puede lanzar dentro de un Service.'
      },
      {
        id: 'b',
        text: 'Porque el tipo de la excepción es lo que te permite mapearla a un código HTTP concreto en el @ControllerAdvice.'
      },
      { id: 'c', text: 'Porque las excepciones propias son más rápidas.' },
      { id: 'd', text: 'Porque Spring ignora las excepciones genéricas.' }
    ],
    answer: 'b',
    explain: 'No puedes distinguir un "no encontrado" de un "sin permisos" si ambos son RuntimeException con distinto texto. El tipo es la información que el manejador necesita para decidir el estado de la respuesta.'
  },
  {
    id: 'w06-o1',
    worldId: 'w06',
    kind: 'order',
    concepts: ['controlleradvice', 'exceptionhandler'],
    difficulty: 3,
    xp: 16,
    prompt: 'Ordena lo que ocurre cuando un Service lanza una excepción propia.',
    steps: [
      'El Service lanza ProductoNoEncontrado',
      'La excepción sube por la pila sin ser capturada en el Controller',
      'El DispatcherServlet la intercepta antes de escribir la respuesta',
      'Busca un @ExceptionHandler que declare ese tipo de excepción',
      'Ejecuta el manejador y construye la respuesta con su código de estado',
      'El cliente recibe un 404 con un cuerpo de error legible'
    ],
    explain: 'La clave es que no capturas la excepción: la dejas subir. El Controller queda limpio de try/catch y toda la política de errores vive en un solo lugar.'
  },
  {
    id: 'w06-f1',
    worldId: 'w06',
    kind: 'fill',
    concepts: ['responsestatus'],
    difficulty: 2,
    xp: 12,
    prompt: 'Escribe la anotación que hace que esta excepción produzca automáticamente un 404 cuando no hay manejador específico.',
    code: '_________________________________\npublic class ProductoNoEncontrado extends RuntimeException {\n    public ProductoNoEncontrado(Long id) {\n        super("No existe el producto " + id);\n    }\n}',
    lang: 'java',
    accept: [
      'responsestatus(httpstatus.not_found)',
      'responsestatus(value=httpstatus.not_found)',
      'responsestatus(code=httpstatus.not_found)',
      'responsestatus(httpstatus.notfound)'
    ],
    placeholder: '@ResponseStatus(...)',
    explain: '@ResponseStatus sobre la clase de excepción es la vía rápida. Para respuestas con cuerpo estructurado necesitas un @ExceptionHandler; ambas conviven.'
  },
  {
    id: 'w06-dec1',
    worldId: 'w06',
    kind: 'decision',
    concepts: ['codigos-http', 'excepciones-custom'],
    difficulty: 4,
    xp: 18,
    prompt: 'El equipo de frontend pide que la API devuelva siempre 200 y que el error viaje en un campo del JSON, "para simplificar el manejo en el cliente". ¿Qué respondes?',
    options: [
      {
        id: 'a',
        text: 'Aceptar: el cliente es quien consume la API y sabe qué necesita.',
        consequence: 'Los proxies, cachés y monitoreos ven todo como éxito. Un fallo total de la API pasa desapercibido en las métricas.'
      },
      {
        id: 'b',
        text: 'Rechazar y explicar que el código de estado es parte del contrato HTTP, ofreciendo a cambio un cuerpo de error consistente y documentado.',
        consequence: 'El frontend hace un poco más de trabajo inicial y gana manejo uniforme de errores, reintentos correctos y observabilidad real.'
      },
      {
        id: 'c',
        text: 'Devolver 200 solo en los errores de validación y códigos correctos en el resto.',
        consequence: 'Un contrato inconsistente es peor que uno incómodo: nadie recuerda cuáles son las excepciones a la regla.'
      },
      {
        id: 'd',
        text: 'Devolver ambos: el código correcto y también un campo de error en el JSON de éxito.',
        consequence: 'Dos fuentes de verdad sobre lo mismo. Tarde o temprano se contradicen.'
      }
    ],
    answer: 'b',
    explain: 'El motivo real detrás de la petición suele ser que el manejo de errores del cliente es inconsistente. La solución es un formato de error uniforme, no romper la semántica de HTTP.'
  },
]

export default challenges
