import type { Challenge } from '../../types'

/** Mundo 11 · API REST y validación — Una API que un cliente real puede consumir sin llorar
 *  Cobertura en el curso: 47–52 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w11-q1',
    worldId: 'w11',
    kind: 'quiz',
    concepts: ['responseentity', 'status-codes'],
    difficulty: 2,
    xp: 14,
    prompt: '¿Qué te permite ResponseEntity que no puedes hacer retornando el objeto directamente?',
    options: [
      { id: 'a', text: 'Serializar a JSON.' },
      {
        id: 'b',
        text: 'Controlar el código de estado y las cabeceras de la respuesta desde el propio método.'
      },
      { id: 'c', text: 'Validar la entrada.' },
      { id: 'd', text: 'Acceder a la base de datos.' }
    ],
    answer: 'b',
    explain: 'Retornar el objeto siempre produce 200. ResponseEntity te deja devolver 201 con la cabecera Location al crear, o 204 sin cuerpo al borrar, que es lo que un cliente REST espera.'
  },
  {
    id: 'w11-c1',
    worldId: 'w11',
    kind: 'codefix',
    concepts: ['valid', 'bindingresult'],
    difficulty: 3,
    xp: 16,
    prompt: 'El DTO tiene @NotBlank en el nombre, pero la API acepta un nombre vacío y responde 200. Elige la corrección.',
    code: '@PostMapping("/api/clientes")\npublic Cliente crear(@RequestBody ClienteDto dto) {\n    return servicio.guardar(dto);\n}\n\n// ClienteDto\npublic class ClienteDto {\n    @NotBlank\n    private String nombre;\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Agregar @Valid al parámetro para que se disparen las restricciones.',
        code: 'public Cliente crear(@Valid @RequestBody ClienteDto dto) { ... }'
      },
      {
        id: 'b',
        text: 'Validar con un if dentro del método.',
        code: 'if (dto.getNombre() == null || dto.getNombre().isBlank()) { ... }'
      },
      {
        id: 'c',
        text: 'Cambiar @NotBlank por @NotNull.',
        code: '@NotNull\nprivate String nombre;'
      },
      {
        id: 'd',
        text: 'Anotar la clase DTO con @Validated.',
        code: '@Validated\npublic class ClienteDto { ... }'
      }
    ],
    answer: 'a',
    explain: 'Las restricciones son declaraciones inertes hasta que alguien las evalúa. @Valid en el parámetro es lo que le pide a Spring que ejecute la validación antes de entrar al método.',
    deeper: 'La opción C empeora las cosas: @NotNull acepta la cadena vacía. @NotBlank es la que exige contenido real.'
  },
  {
    id: 'w11-q2',
    worldId: 'w11',
    kind: 'quiz',
    concepts: ['bindingresult'],
    difficulty: 3,
    xp: 16,
    prompt: 'Agregas un parámetro BindingResult después del objeto anotado con @Valid. ¿Qué cambia?',
    options: [
      { id: 'a', text: 'Nada, es decorativo.' },
      {
        id: 'b',
        text: 'Spring deja de lanzar la excepción automática y te entrega los errores para que tú decidas la respuesta.'
      },
      { id: 'c', text: 'La validación se ejecuta dos veces.' },
      { id: 'd', text: 'Se desactiva la validación.' }
    ],
    answer: 'b',
    explain: 'Es un cambio de responsabilidad. Sin BindingResult, Spring lanza la excepción y tu @ControllerAdvice arma la respuesta. Con BindingResult, el control vuelve a tu método.',
    deeper: 'En una API REST suele preferirse la primera vía: una respuesta de error uniforme para toda la API. BindingResult es más natural en MVC con formularios, donde quieres volver a mostrar la vista con los errores.'
  },
  {
    id: 'w11-d1',
    worldId: 'w11',
    kind: 'debug',
    concepts: ['status-codes', 'verbos-http'],
    difficulty: 3,
    xp: 16,
    prompt: 'Un cliente reporta que al enviar un JSON mal formado recibe un 500. ¿Cuál es la respuesta correcta y por qué?',
    code: 'POST /api/clientes\nContent-Type: application/json\n\n{ "nombre": "Ana", }\n\n// Respuesta actual: 500 Internal Server Error\n// HttpMessageNotReadableException: JSON parse error',
    lang: 'log',
    options: [
      { id: 'a', text: '500 está bien: el servidor no pudo procesar la petición.' },
      {
        id: 'b',
        text: 'Debería ser 400: el error está en la petición del cliente, no en el servidor. Se mapea HttpMessageNotReadableException en el @ControllerAdvice.'
      },
      { id: 'c', text: 'Debería ser 404, porque no se creó el recurso.' },
      {
        id: 'd',
        text: 'Debería ser 422 siempre, para cualquier problema con el cuerpo.'
      }
    ],
    answer: 'b',
    explain: 'La familia 4xx significa "el problema está en lo que enviaste" y la 5xx significa "el problema está en mí". Un JSON con una coma de más es responsabilidad de quien lo envió.',
    deeper: 'La distinción entre 400 y 422 es de matiz: 400 para JSON que no se puede ni parsear, 422 para JSON válido que no pasa las reglas de negocio. Muchos equipos usan 400 para ambos y lo documentan.'
  },
  {
    id: 'w11-o1',
    worldId: 'w11',
    kind: 'order',
    concepts: ['valid', 'verbos-http', 'responseentity'],
    difficulty: 3,
    xp: 16,
    prompt: 'Ordena el recorrido de un POST válido que crea un recurso.',
    steps: [
      'Jackson deserializa el JSON del cuerpo en el DTO',
      'Se ejecutan las restricciones de validación por el @Valid',
      'El Controller llama al Service',
      'El Service aplica reglas de negocio y persiste mediante el Repository',
      'El Controller construye un ResponseEntity con estado 201 y la cabecera Location'
    ],
    explain: 'La validación de formato ocurre antes de tu código; la validación de negocio ocurre en el Service. Confundir las dos lleva a poner reglas de negocio en anotaciones del DTO, donde no pertenecen.'
  },
  {
    id: 'w11-f1',
    worldId: 'w11',
    kind: 'fill',
    concepts: ['verbos-http'],
    difficulty: 2,
    xp: 14,
    prompt: 'Escribe la anotación de mapeo correcta para un endpoint que actualiza por completo un recurso existente identificado por id.',
    code: '@RestController\n@RequestMapping("/api/clientes")\npublic class ClienteController {\n\n    ______________________\n    public ResponseEntity<ClienteDto> actualizar(@PathVariable Long id,\n                                                 @Valid @RequestBody ClienteDto dto) { ... }\n}',
    lang: 'java',
    accept: ['putmapping("/{id}")', 'putmapping(\'/{id}\')', 'putmapping("{id}")'],
    placeholder: '@PutMapping("...")',
    explain: 'PUT reemplaza el recurso completo; PATCH modifica solo los campos enviados. Usar POST para actualizar funciona técnicamente y rompe la expectativa de cualquiera que consuma la API.'
  },
  {
    id: 'w11-dec1',
    worldId: 'w11',
    kind: 'decision',
    concepts: ['restriccion-custom', 'valid', 'capas'],
    difficulty: 4,
    xp: 18,
    prompt: '¿Dónde validas que el RFC de un cliente no esté ya registrado en la base de datos?',
    options: [
      {
        id: 'a',
        text: 'Con una restricción de Bean Validation propia en el DTO, que consulte el repositorio.',
        consequence: 'Metes acceso a base de datos en la capa de validación de entrada. Funciona y mezcla responsabilidades que después cuesta separar.'
      },
      {
        id: 'b',
        text: 'En el Service, lanzando una excepción propia que el @ControllerAdvice traduce a 409.',
        consequence: 'La regla de negocio vive donde vive el negocio. La validación del DTO se queda con lo que es: formato y obligatoriedad.'
      },
      {
        id: 'c',
        text: 'Con una restricción UNIQUE en la base de datos y ya.',
        consequence: 'Necesaria como red de seguridad, insuficiente como única defensa: el error que sube es de infraestructura y traducirlo a un mensaje útil es incómodo.'
      },
      {
        id: 'd',
        text: 'En el frontend, antes de enviar.',
        consequence: 'Mejora la experiencia y no es un control: la API sigue aceptando duplicados de cualquier otro cliente.'
      }
    ],
    answer: 'b',
    explain: 'La línea divisoria útil es: el DTO valida lo que se puede verificar mirando solo la petición; el Service valida lo que requiere consultar el estado del sistema. La restricción UNIQUE de C se suma como red de seguridad, no compite.'
  },
  {
    id: 'w11-f2',
    worldId: 'w11',
    kind: 'fill',
    concepts: ['notblank', 'valid'],
    difficulty: 2,
    xp: 14,
    prompt: 'Escribe la restricción que exige que este campo llegue con texto real, no null ni cadena vacía ni solo espacios.',
    code: 'public class ClienteDto {\n\n    ____________\n    private String nombre;\n\n    @Email\n    private String correo;\n}',
    lang: 'java',
    accept: ['notblank'],
    placeholder: '@...',
    explain: '@NotNull acepta la cadena vacía y @NotEmpty acepta espacios en blanco. @NotBlank es la única que rechaza las tres formas de "vacío" que llegan en la práctica desde un formulario.',
    hint: 'Hay tres candidatas parecidas; solo una rechaza una cadena de puros espacios.'
  },
]

export default challenges
