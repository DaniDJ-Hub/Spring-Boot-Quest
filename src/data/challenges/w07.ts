import type { Challenge } from '../../types'

/** Mundo 7 · Interceptores HTTP — Lógica transversal antes y después de cada petición
 *  Cobertura en el curso: 21–27 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w07-q1',
    worldId: 'w07',
    kind: 'quiz',
    concepts: ['handlerinterceptor', 'prehandle'],
    difficulty: 2,
    xp: 12,
    prompt: '¿Qué significa que preHandle devuelva false?',
    options: [
      { id: 'a', text: 'Que hubo un error interno en el interceptor.' },
      {
        id: 'b',
        text: 'Que la cadena se detiene: el Controller nunca se ejecuta y la respuesta la escribe el propio interceptor.'
      },
      {
        id: 'c',
        text: 'Que se ejecuta el siguiente interceptor y se salta el actual.'
      },
      { id: 'd', text: 'Que la petición se reintenta automáticamente.' }
    ],
    answer: 'b',
    explain: 'preHandle es el punto donde puedes cortar. Devolver false es lo que usarías para bloquear una petición fuera de horario o sin cabecera obligatoria, sin tocar el Controller.',
    deeper: 'Si cortas con false, es tu responsabilidad escribir algo en la respuesta. Si no lo haces, el cliente recibe un 200 con cuerpo vacío.'
  },
  {
    id: 'w07-d1',
    worldId: 'w07',
    kind: 'debug',
    concepts: ['registro-interceptores'],
    difficulty: 3,
    xp: 16,
    prompt: 'El interceptor está escrito y anotado, pero nunca se ejecuta. ¿Qué falta?',
    code: '@Component\npublic class TiempoInterceptor implements HandlerInterceptor {\n\n    @Override\n    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {\n        req.setAttribute("inicio", System.currentTimeMillis());\n        return true;\n    }\n}\n\n// No hay ninguna otra clase relacionada en el proyecto',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Falta registrarlo: hay que implementar WebMvcConfigurer y añadirlo con addInterceptors, indicando a qué rutas aplica.'
      },
      { id: 'b', text: 'Falta anotar el método con @Override.' },
      { id: 'c', text: 'Hay que cambiar @Component por @Interceptor.' },
      {
        id: 'd',
        text: 'Los interceptores solo funcionan con @Controller, no con @RestController.'
      }
    ],
    answer: 'a',
    explain: 'Ser un bean no basta. A diferencia de un @ControllerAdvice, un interceptor necesita registro explícito porque Spring no puede adivinar sobre qué rutas debe actuar.',
    deeper: 'En el registro decides el alcance con addPathPatterns y excludePathPatterns. Ese detalle es lo que evita que tu interceptor de auditoría se ejecute también sobre los recursos estáticos.'
  },
  {
    id: 'w07-o1',
    worldId: 'w07',
    kind: 'order',
    concepts: ['prehandle', 'posthandle', 'aftercompletion'],
    difficulty: 3,
    xp: 16,
    prompt: 'Ordena la ejecución de una petición que pasa por un interceptor y termina bien.',
    steps: [
      'preHandle del interceptor',
      'Método del Controller',
      'postHandle del interceptor',
      'Renderizado de la vista o serialización de la respuesta',
      'afterCompletion del interceptor'
    ],
    explain: 'postHandle corre antes de renderizar; afterCompletion corre siempre al final, incluso si hubo excepción. Por eso el cierre de recursos y el log de tiempo total van en afterCompletion.'
  },
  {
    id: 'w07-q2',
    worldId: 'w07',
    kind: 'quiz',
    concepts: ['handlerinterceptor', 'aspect'],
    difficulty: 4,
    xp: 18,
    prompt: '¿Cuándo usarías un interceptor y cuándo un aspecto de AOP?',
    options: [
      { id: 'a', text: 'Son intercambiables; se elige por preferencia personal.' },
      {
        id: 'b',
        text: 'El interceptor opera sobre la petición HTTP y conoce request y response. El aspecto opera sobre llamadas a métodos de cualquier bean, aunque no venga de HTTP.'
      },
      {
        id: 'c',
        text: 'El interceptor es para producción y AOP solo para desarrollo.'
      },
      { id: 'd', text: 'AOP reemplazó a los interceptores y estos ya no se usan.' }
    ],
    answer: 'b',
    explain: 'Si necesitas leer una cabecera HTTP, es interceptor. Si necesitas medir cuánto tarda un método del Service al que también llama una tarea programada, es aspecto: ahí no hay petición HTTP alguna.'
  },
  {
    id: 'w07-c1',
    worldId: 'w07',
    kind: 'codefix',
    concepts: ['aftercompletion', 'posthandle'],
    difficulty: 3,
    xp: 16,
    prompt: 'Este interceptor mide tiempos, pero cuando el Controller lanza una excepción no registra nada. Elige la corrección.',
    code: '@Override\npublic void postHandle(HttpServletRequest req, HttpServletResponse res,\n                       Object handler, ModelAndView mav) {\n    long inicio = (Long) req.getAttribute("inicio");\n    log.info("Duración: {} ms", System.currentTimeMillis() - inicio);\n}',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Mover el registro a afterCompletion, que se ejecuta también cuando hubo excepción.',
        code: '@Override\npublic void afterCompletion(HttpServletRequest req, HttpServletResponse res,\n                            Object handler, Exception ex) {\n    long inicio = (Long) req.getAttribute("inicio");\n    log.info("Duración: {} ms, error: {}", System.currentTimeMillis() - inicio, ex);\n}'
      },
      {
        id: 'b',
        text: 'Envolver el cuerpo en un try/catch.',
        code: 'try { ... } catch (Exception e) { }'
      },
      {
        id: 'c',
        text: 'Devolver false en preHandle cuando haya error.',
        code: 'return false;'
      },
      {
        id: 'd',
        text: 'Registrar el interceptor con orden más alto.',
        code: 'registry.addInterceptor(...).order(100);'
      }
    ],
    answer: 'a',
    explain: 'postHandle simplemente no se invoca si el Controller lanzó. afterCompletion sí, y además recibe la excepción como parámetro, que es justo lo que quieres registrar.'
  },
  {
    id: 'w07-dec1',
    worldId: 'w07',
    kind: 'decision',
    concepts: ['handlerinterceptor', 'filterchain'],
    difficulty: 4,
    xp: 18,
    prompt: 'Te piden bloquear las peticiones que no traigan una cabecera de API key. ¿Dónde lo implementas?',
    options: [
      {
        id: 'a',
        text: 'En cada Controller, con un if al inicio de cada método.',
        consequence: 'Funciona y se olvida en el primer endpoint nuevo que alguien agregue con prisa.'
      },
      {
        id: 'b',
        text: 'En un interceptor registrado sobre /api/**, cortando con preHandle.',
        consequence: 'Un solo punto de control, aplicado por patrón de ruta. Es la respuesta correcta mientras no exista Spring Security en el proyecto.'
      },
      {
        id: 'c',
        text: 'En un aspecto @Around sobre todos los métodos de los Controllers.',
        consequence: 'Funciona, pero el aspecto tendría que rescatar la petición HTTP del contexto. Estás usando una herramienta genérica para un problema que es puramente HTTP.'
      },
      {
        id: 'd',
        text: 'En el frontend, validando antes de enviar.',
        consequence: 'No es un control: cualquiera puede llamar la API sin pasar por tu frontend.'
      }
    ],
    answer: 'b',
    explain: 'Cuando el proyecto incorpore Spring Security, esto migra a un filtro de la cadena de seguridad, que corre antes incluso que los interceptores. Lo verás en el mundo 12.'
  },
]

export default challenges
