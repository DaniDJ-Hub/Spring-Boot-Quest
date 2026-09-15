import type { Challenge } from '../../types'

/** Mundo 12 · Spring Security y JWT — Autenticación, autorización y el token que lo une todo
 *  Cobertura en el curso: 50–60 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w12-q1',
    worldId: 'w12',
    kind: 'quiz',
    concepts: ['authentication', 'authorization'],
    difficulty: 2,
    xp: 14,
    prompt: '¿Cuál es la diferencia entre autenticación y autorización?',
    options: [
      { id: 'a', text: 'Son lo mismo con distinto nombre.' },
      {
        id: 'b',
        text: 'La autenticación establece quién eres; la autorización decide qué puedes hacer una vez identificado.'
      },
      {
        id: 'c',
        text: 'La autenticación es del frontend y la autorización del backend.'
      },
      { id: 'd', text: 'La autorización ocurre primero.' }
    ],
    answer: 'b',
    explain: 'Un 401 dice "no sé quién eres"; un 403 dice "sé quién eres y no te alcanza". Distinguirlos es lo primero al depurar un problema de seguridad, porque apuntan a partes distintas de la cadena.'
  },
  {
    id: 'w12-o1',
    worldId: 'w12',
    kind: 'order',
    concepts: ['jwt', 'authentication', 'stateless'],
    difficulty: 4,
    xp: 20,
    prompt: 'Ordena el flujo completo de autenticación con JWT.',
    steps: [
      'El cliente envía usuario y contraseña al endpoint de login',
      'UserDetailsService carga el usuario y BCrypt verifica la contraseña',
      'El servidor firma un token con los datos del usuario y sus roles',
      'El cliente guarda el token y lo envía en la cabecera Authorization en cada petición',
      'Un filtro valida la firma y la expiración del token',
      'El filtro coloca la autenticación en el contexto de seguridad y la petición continúa'
    ],
    explain: 'El paso 6 es el que casi nadie recuerda y el que rompe todo: validar el token no basta, hay que poblar el SecurityContext. Si no lo haces, la petición sigue siendo anónima y recibes 403 con un token perfectamente válido.'
  },
  {
    id: 'w12-d1',
    worldId: 'w12',
    kind: 'debug',
    concepts: ['roles', 'authorization'],
    difficulty: 4,
    xp: 20,
    prompt: 'El usuario tiene el rol ADMIN en la base de datos y el endpoint sigue devolviendo 403. La configuración es esta. ¿Cuál es la causa?',
    code: '// En la base de datos el rol se guarda como: "ADMIN"\n\n// En la configuración de seguridad:\n.requestMatchers("/api/admin/**").hasRole("ADMIN")\n\n// Al construir el UserDetails:\nnew SimpleGrantedAuthority(usuario.getRol())   // -> "ADMIN"',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'hasRole("ADMIN") busca la authority "ROLE_ADMIN" con el prefijo. Hay que añadir el prefijo al construir la authority, o usar hasAuthority("ADMIN").'
      },
      { id: 'b', text: 'El rol debe estar en minúsculas.' },
      { id: 'c', text: 'Falta @EnableWebSecurity.' },
      { id: 'd', text: 'Los roles no funcionan con JWT, solo con sesión.' }
    ],
    answer: 'a',
    explain: 'hasRole añade el prefijo ROLE_ automáticamente; hasAuthority compara literal. Mezclar los dos estilos produce un 403 que parece imposible porque el rol "está bien" en la base de datos.',
    deeper: 'La convención más segura es decidir uno de los dos estilos para todo el proyecto y documentarlo. El bug reaparece cada vez que alguien nuevo agrega un endpoint protegido.'
  },
  {
    id: 'w12-q2',
    worldId: 'w12',
    kind: 'quiz',
    concepts: ['bcrypt'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Por qué se guardan las contraseñas con BCrypt y no cifradas o en texto plano?',
    options: [
      { id: 'a', text: 'Porque BCrypt ocupa menos espacio.' },
      {
        id: 'b',
        text: 'Porque es un hash de un solo sentido con salt: no se puede revertir, y dos usuarios con la misma contraseña producen hashes distintos.'
      },
      {
        id: 'c',
        text: 'Porque permite recuperar la contraseña original si el usuario la olvida.'
      },
      {
        id: 'd',
        text: 'Porque es el único algoritmo compatible con Spring Security.'
      }
    ],
    answer: 'b',
    explain: 'El cifrado es reversible y eso es exactamente lo que no quieres: si alguien obtiene la base de datos y la clave, tiene todas las contraseñas. Con un hash, ni siquiera tú puedes recuperarlas.',
    deeper: 'El salt automático es la parte que evita las rainbow tables. Y el factor de coste configurable permite encarecer el hash conforme el hardware mejora.'
  },
  {
    id: 'w12-q3',
    worldId: 'w12',
    kind: 'quiz',
    concepts: ['stateless', 'csrf'],
    difficulty: 4,
    xp: 18,
    prompt: 'En una API REST con JWT es habitual desactivar CSRF. ¿Por qué es aceptable ahí y no en una app MVC con sesión?',
    options: [
      { id: 'a', text: 'Porque las APIs REST son más seguras por naturaleza.' },
      {
        id: 'b',
        text: 'Porque el ataque CSRF se apoya en credenciales que el navegador envía solas, como las cookies de sesión. Un token en la cabecera Authorization no se envía automáticamente.'
      },
      { id: 'c', text: 'Porque CSRF solo afecta a peticiones GET.' },
      { id: 'd', text: 'Porque JWT incluye protección CSRF interna.' }
    ],
    answer: 'b',
    explain: 'La clave es quién adjunta la credencial. Si la adjunta el navegador por su cuenta, un sitio malicioso puede provocar peticiones autenticadas. Si la adjunta tu código JavaScript leyendo el token, no.',
    deeper: 'El matiz importa: si guardas el JWT en una cookie en vez de en la cabecera, el razonamiento se cae y CSRF vuelve a ser un riesgo real.'
  },
  {
    id: 'w12-c1',
    worldId: 'w12',
    kind: 'codefix',
    concepts: ['stateless', 'filterchain'],
    difficulty: 4,
    xp: 20,
    prompt: 'La API con JWT funciona, pero el servidor va acumulando sesiones en memoria. Elige la corrección.',
    code: 'http\n    .csrf(csrf -> csrf.disable())\n    .authorizeHttpRequests(auth -> auth\n        .requestMatchers("/api/auth/**").permitAll()\n        .anyRequest().authenticated())\n    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);',
    lang: 'java',
    options: [
      {
        id: 'a',
        text: 'Declarar explícitamente la política de sesión como STATELESS.',
        code: '.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))'
      },
      {
        id: 'b',
        text: 'Aumentar el tiempo de expiración del token.',
        code: 'jwt.expiration=86400000'
      },
      { id: 'c', text: 'Quitar el filtro JWT.', code: '// eliminar addFilterBefore' },
      {
        id: 'd',
        text: 'Reiniciar el servidor periódicamente.',
        code: '// tarea programada de reinicio'
      }
    ],
    answer: 'a',
    explain: 'Sin declararlo, Spring Security crea sesión igual aunque no la uses. Con STATELESS le dices que no cree ni consulte sesión: cada petición se autentica solo con el token.',
    deeper: 'Esto además es lo que permite escalar horizontalmente: sin estado en el servidor, cualquier instancia puede atender cualquier petición sin sesiones compartidas.'
  },
  {
    id: 'w12-f1',
    worldId: 'w12',
    kind: 'fill',
    concepts: ['header-authorization', 'jwt'],
    difficulty: 2,
    xp: 14,
    prompt: 'Escribe el nombre de la cabecera HTTP donde viaja el token en cada petición.',
    code: 'GET /api/pedidos HTTP/1.1\nHost: api.demo.com\n_______________: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    lang: 'log',
    accept: ['authorization'],
    placeholder: 'Nombre de la cabecera',
    explain: 'Authorization con el esquema Bearer es la convención. El filtro lee esa cabecera, quita el prefijo "Bearer " y valida lo que queda.'
  },
  {
    id: 'w12-dec1',
    worldId: 'w12',
    kind: 'decision',
    concepts: ['jwt', 'stateless'],
    difficulty: 5,
    xp: 22,
    prompt: 'Un usuario es despedido y hay que revocar su acceso de inmediato. Su JWT expira en 24 horas. ¿Qué haces?',
    options: [
      {
        id: 'a',
        text: 'Nada: esperar a que el token expire.',
        consequence: 'El ex empleado conserva acceso completo durante 24 horas. Inaceptable en cualquier auditoría.'
      },
      {
        id: 'b',
        text: 'Acortar la vida del token de acceso a minutos y usar un refresh token que sí se valida contra la base de datos.',
        consequence: 'La revocación surte efecto en minutos y conservas la mayor parte del beneficio de no consultar la base en cada petición.'
      },
      {
        id: 'c',
        text: 'Consultar la base de datos en cada petición para verificar que el usuario sigue activo.',
        consequence: 'Revocación inmediata, y renuncias a la ventaja principal del JWT. Válido si tu requisito de revocación es estricto.'
      },
      {
        id: 'd',
        text: 'Cambiar la clave de firma del servidor.',
        consequence: 'Revocas todos los tokens de todos los usuarios a la vez. Cumple el objetivo y expulsa a la empresa entera.'
      }
    ],
    answer: 'b',
    explain: 'Es un intercambio entre latencia de revocación y carga en la base de datos, no un problema con respuesta única. B es el punto medio habitual; C es defendible cuando la revocación inmediata es un requisito duro.'
  },
  {
    id: 'w12-q4',
    worldId: 'w12',
    kind: 'quiz',
    concepts: ['userdetails', 'authentication'],
    difficulty: 3,
    xp: 16,
    prompt: '¿Cuál es el papel de UserDetailsService en la autenticación?',
    options: [
      { id: 'a', text: 'Valida la contraseña que envía el usuario.' },
      {
        id: 'b',
        text: 'Carga el usuario por su nombre y devuelve sus datos y authorities; la comparación de la contraseña la hace el PasswordEncoder.'
      },
      { id: 'c', text: 'Genera el token JWT.' },
      { id: 'd', text: 'Guarda la sesión del usuario en memoria.' }
    ],
    answer: 'b',
    explain: 'Es un punto de extensión con una sola responsabilidad: dado un nombre de usuario, entregar sus datos. De dónde salen, base de datos, LDAP o memoria, es asunto de tu implementación.',
    deeper: 'Si el usuario no existe, lanza UsernameNotFoundException. Por seguridad, la respuesta al cliente debe ser la misma que para una contraseña incorrecta: revelar cuál de las dos falló facilita enumerar usuarios.'
  },
]

export default challenges
