import type { Challenge } from '../../types'

/** Mundo 14 · Cableado con el frontend — Cómo consume React o Angular tu backend
 *  Cobertura en el curso: 58–68 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w14-d1',
    worldId: 'w14',
    kind: 'debug',
    concepts: ['cors-frontend', 'preflight'],
    difficulty: 3,
    xp: 16,
    prompt: 'El frontend en localhost:5173 llama a la API en localhost:8080 y el navegador muestra este error. ¿Qué significa?',
    code: 'Access to fetch at \'http://localhost:8080/api/pedidos\' from origin\n\'http://localhost:5173\' has been blocked by CORS policy: No \'Access-Control-Allow-Origin\'\nheader is present on the requested resource.',
    lang: 'log',
    options: [
      { id: 'a', text: 'La API está caída.' },
      {
        id: 'b',
        text: 'La API respondió, pero sin la cabecera que autoriza el origen del frontend. Es el navegador quien bloquea, no el servidor. Hay que configurar CORS en el backend.'
      },
      { id: 'c', text: 'El token es inválido.' },
      {
        id: 'd',
        text: 'Hay que llamar la API desde el servidor, no desde el navegador.'
      }
    ],
    answer: 'b',
    explain: 'Es la confusión número uno con CORS: el servidor sí recibió y procesó la petición. El navegador recibe la respuesta, no encuentra la autorización explícita del origen y se niega a entregársela al JavaScript.',
    deeper: 'Por eso la misma llamada funciona desde Postman o curl: esas herramientas no aplican la política de origen, que es una regla del navegador.'
  },
  {
    id: 'w14-q1',
    worldId: 'w14',
    kind: 'quiz',
    concepts: ['preflight'],
    difficulty: 4,
    xp: 18,
    prompt: 'En la pestaña de red ves un OPTIONS antes de tu POST. ¿Qué es y por qué aparece?',
    options: [
      { id: 'a', text: 'Un error del cliente HTTP.' },
      {
        id: 'b',
        text: 'Es la petición preflight: el navegador pregunta al servidor si permite ese método y esas cabeceras antes de enviar la petición real.'
      },
      { id: 'c', text: 'Es un reintento automático del POST.' },
      { id: 'd', text: 'Es una petición de keep-alive.' }
    ],
    answer: 'b',
    explain: 'El preflight se dispara cuando la petición no es simple, por ejemplo al enviar Content-Type: application/json o una cabecera Authorization. Si el OPTIONS falla, tu POST nunca sale.',
    deeper: 'Consecuencia práctica: la configuración de CORS debe permitir el método OPTIONS y las cabeceras que envías, no solo el origen. Y ese OPTIONS no debe exigir autenticación.'
  },
  {
    id: 'w14-c1',
    worldId: 'w14',
    kind: 'codefix',
    concepts: ['cors', 'filterchain'],
    difficulty: 4,
    xp: 18,
    prompt: 'Configuraste CORS con @CrossOrigin pero desde que agregaste Spring Security el navegador sigue bloqueando. Elige la corrección.',
    code: '@CrossOrigin(origins = "http://localhost:5173")\n@RestController\n@RequestMapping("/api/pedidos")\npublic class PedidoController { ... }',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Registrar CORS en la configuración de seguridad, porque la cadena de filtros actúa antes de llegar al Controller.',
        code: 'http.cors(Customizer.withDefaults())\n    // más un bean CorsConfigurationSource con orígenes,\n    // métodos y cabeceras permitidos'
      },
      {
        id: 'b',
        text: 'Poner origins = "*" en @CrossOrigin.',
        code: '@CrossOrigin(origins = "*")'
      },
      {
        id: 'c',
        text: 'Desactivar Spring Security.',
        code: 'http.authorizeHttpRequests(a -> a.anyRequest().permitAll());'
      },
      {
        id: 'd',
        text: 'Mover la anotación a cada método.',
        code: '@CrossOrigin\n@GetMapping ...'
      }
    ],
    answer: 'a',
    explain: 'El preflight OPTIONS no lleva credenciales, así que la cadena de seguridad lo rechaza antes de que el Controller y su @CrossOrigin lleguen a intervenir. CORS tiene que resolverse a nivel de filtro.',
    deeper: 'Con origins = "*" además pierdes la posibilidad de enviar credenciales: el navegador rechaza la combinación de comodín y allowCredentials.'
  },
  {
    id: 'w14-o1',
    worldId: 'w14',
    kind: 'order',
    concepts: ['fetch-token', 'header-authorization', 'manejo-401'],
    difficulty: 3,
    xp: 16,
    prompt: 'Ordena lo que hace el frontend en un flujo de login con JWT.',
    steps: [
      'Envía credenciales al endpoint de login',
      'Recibe el token y lo guarda',
      'Adjunta el token en la cabecera Authorization de cada petición siguiente',
      'Detecta una respuesta 401 en una petición posterior',
      'Descarta el token guardado y redirige al login'
    ],
    explain: 'El último paso es el que más se olvida. Sin él, el usuario ve errores sueltos sin entender que su sesión caducó, y el frontend sigue enviando un token muerto en cada llamada.'
  },
  {
    id: 'w14-dec1',
    worldId: 'w14',
    kind: 'decision',
    concepts: ['fetch-token', 'cors-frontend'],
    difficulty: 4,
    xp: 18,
    prompt: '¿Dónde guarda el frontend el JWT?',
    options: [
      {
        id: 'a',
        text: 'En localStorage, porque es simple y persiste entre pestañas.',
        consequence: 'Cualquier script inyectado en tu página puede leerlo. Un XSS pasa de ser un defecto de la interfaz a un robo de sesión completo.'
      },
      {
        id: 'b',
        text: 'En una cookie httpOnly emitida por el servidor.',
        consequence: 'El JavaScript no puede leerla, así que un XSS no la roba. A cambio vuelve el riesgo de CSRF y hay que protegerse contra él.'
      },
      {
        id: 'c',
        text: 'En memoria, en una variable de la aplicación.',
        consequence: 'La superficie de ataque más pequeña, y se pierde al recargar la página. Requiere un refresh token para ser usable.'
      },
      {
        id: 'd',
        text: 'En la URL como parámetro.',
        consequence: 'Queda en el historial, en los logs del servidor y en la cabecera Referer al salir del sitio. Nunca.'
      }
    ],
    answer: 'b',
    explain: 'No hay una respuesta única y sí una descartable: D. Entre A, B y C eliges qué riesgo prefieres administrar. B con protección CSRF es la recomendación más común hoy; C combinada con refresh token es la más estricta.'
  },
  {
    id: 'w14-q2',
    worldId: 'w14',
    kind: 'quiz',
    concepts: ['manejo-401', 'header-authorization'],
    difficulty: 3,
    xp: 16,
    prompt: 'El frontend recibe 401 en una llamada intermedia con un token que ayer funcionaba. ¿Cuál es la causa más probable y qué debe hacer el cliente?',
    options: [
      {
        id: 'a',
        text: 'El token expiró. El cliente debe descartarlo, y renovarlo con el refresh token o mandar al usuario al login.'
      },
      {
        id: 'b',
        text: 'El servidor está caído; hay que reintentar la misma llamada.'
      },
      { id: 'c', text: 'Falta configurar CORS.' },
      {
        id: 'd',
        text: 'El usuario perdió permisos; hay que mostrar un mensaje de acceso denegado.'
      }
    ],
    answer: 'a',
    explain: '401 es "no sé quién eres", y con un token que antes servía la explicación casi siempre es la expiración. La pérdida de permisos daría 403, que es un caso distinto.',
    deeper: 'Reintentar con el mismo token (opción B) genera un bucle. El cliente necesita distinguir 401 de 403 y reaccionar distinto a cada uno.'
  },
]

export default challenges
