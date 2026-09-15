import type { Challenge } from '../../types'

/** Mundo 13 · Despliegue — Del JAR local a un servidor de verdad
 *  Cobertura en el curso: 56–60 %. Se carga bajo demanda. */
const challenges: Challenge[] = [
  {
    id: 'w13-q1',
    worldId: 'w13',
    kind: 'quiz',
    concepts: ['jar-ejecutable', 'war-tomcat'],
    difficulty: 2,
    xp: 14,
    prompt: '¿Cuándo empaquetas como WAR en vez de JAR ejecutable?',
    options: [
      { id: 'a', text: 'Cuando la app es grande.' },
      {
        id: 'b',
        text: 'Cuando hay que desplegar sobre un Tomcat externo ya existente, en vez de usar el servidor embebido.'
      },
      { id: 'c', text: 'Cuando la app usa base de datos.' },
      { id: 'd', text: 'El WAR está descontinuado en Spring Boot 3.' }
    ],
    answer: 'b',
    explain: 'El JAR se ejecuta con java -jar y lleva su propio Tomcat dentro. El WAR se despliega en un servidor que ya existe, normalmente porque la infraestructura de la empresa lo exige.',
    deeper: 'Para el WAR hay que extender SpringBootServletInitializer y marcar el Tomcat embebido como provided, para no meter dos servidores en el mismo despliegue.'
  },
  {
    id: 'w13-d1',
    worldId: 'w13',
    kind: 'debug',
    concepts: ['perfiles-produccion', 'variables-entorno'],
    difficulty: 3,
    xp: 16,
    prompt: 'La app arranca en tu máquina y muere en el servidor con este error. ¿Cuál es la causa más probable?',
    code: 'Caused by: java.net.ConnectException: Connection refused (Connection refused)\n	at com.mysql.cj.jdbc.ConnectionImpl.<init>(ConnectionImpl.java:...)\n\nspring.datasource.url=jdbc:mysql://localhost:3306/tienda',
    lang: 'log',
    options: [
      { id: 'a', text: 'La versión de Java del servidor es distinta.' },
      {
        id: 'b',
        text: 'La URL apunta a localhost, que en el servidor significa el propio servidor y no la máquina donde está la base de datos. Debe venir de una variable de entorno por entorno.'
      },
      { id: 'c', text: 'Falta el driver de MySQL en el pom.' },
      { id: 'd', text: 'El puerto 3306 está mal, debe ser 8080.' }
    ],
    answer: 'b',
    explain: 'localhost es relativo a quien ejecuta. En tu máquina apunta a tu MySQL; en EC2 apunta al propio EC2, donde no hay base de datos. Con RDS, el host es un endpoint distinto.',
    deeper: 'Por eso la URL de la base de datos nunca se escribe fija en el properties que se sube al repositorio: se referencia una variable de entorno que cada entorno define.'
  },
  {
    id: 'w13-o1',
    worldId: 'w13',
    kind: 'order',
    concepts: ['jar-ejecutable', 'aws-ec2', 'aws-rds'],
    difficulty: 3,
    xp: 16,
    prompt: 'Ordena los pasos para llevar la aplicación a un servidor EC2 con base de datos en RDS.',
    steps: [
      'Empaquetar la aplicación como JAR ejecutable',
      'Crear la instancia RDS y anotar su endpoint',
      'Configurar el grupo de seguridad para que EC2 pueda alcanzar el puerto de RDS',
      'Subir el JAR a la instancia EC2',
      'Definir las variables de entorno con la URL, el usuario y la contraseña',
      'Ejecutar el JAR con el perfil de producción activo'
    ],
    explain: 'El paso del grupo de seguridad es el que más tiempo hace perder: la conexión se rechaza sin ningún error informativo del lado de AWS, y el síntoma es idéntico al de una URL mal escrita.'
  },
  {
    id: 'w13-q2',
    worldId: 'w13',
    kind: 'quiz',
    concepts: ['perfiles-produccion'],
    difficulty: 3,
    xp: 16,
    prompt: 'En desarrollo usas spring.jpa.hibernate.ddl-auto=update. ¿Qué valor corresponde en producción y por qué?',
    options: [
      { id: 'a', text: 'create, para tener siempre el esquema al día.' },
      {
        id: 'b',
        text: 'validate o none: en producción el esquema se administra con migraciones controladas, no dejando que Hibernate altere tablas por su cuenta.'
      },
      { id: 'c', text: 'El mismo update, es lo más práctico.' },
      { id: 'd', text: 'create-drop, para limpiar entre despliegues.' }
    ],
    answer: 'b',
    explain: 'update parece inofensivo y toma decisiones sobre tu esquema sin pedirte permiso. create y create-drop directamente borran datos: en producción, ambas son un incidente esperando fecha.',
    deeper: 'validate es la opción más útil: no toca nada y falla al arrancar si el esquema no coincide con las entidades, avisándote antes de que la app atienda peticiones.'
  },
  {
    id: 'w13-f1',
    worldId: 'w13',
    kind: 'fill',
    concepts: ['perfiles-produccion'],
    difficulty: 2,
    xp: 14,
    prompt: 'Escribe la propiedad que activa el perfil de producción al arrancar.',
    code: 'java -jar tienda.jar --_____________________=prod',
    lang: 'properties',
    accept: ['spring.profiles.active'],
    placeholder: 'spring...',
    explain: 'Pasarlo como argumento de línea de comandos tiene la máxima prioridad, por encima de cualquier valor del properties. Es la forma habitual de decidir el entorno en el momento del arranque.'
  },
  {
    id: 'w13-dec1',
    worldId: 'w13',
    kind: 'decision',
    concepts: ['variables-entorno', 'perfiles-produccion'],
    difficulty: 4,
    xp: 18,
    prompt: 'El equipo quiere generar un artefacto distinto por entorno: tienda-dev.jar, tienda-prod.jar. ¿Qué opinas?',
    options: [
      {
        id: 'a',
        text: 'Buena idea: cada JAR trae su configuración y no hay riesgo de confundirlas.',
        consequence: 'Lo que pruebas en pruebas no es lo que despliegas en producción. Cualquier diferencia entre ambos artefactos es un lugar donde se esconde un fallo que solo aparece en producción.'
      },
      {
        id: 'b',
        text: 'Un solo artefacto para todos los entornos, con la configuración inyectada desde fuera.',
        consequence: 'El binario que aprobó pruebas es exactamente el que llega a producción. La configuración se convierte en un dato del entorno, no del build.'
      },
      {
        id: 'c',
        text: 'Un solo JAR pero con todos los properties dentro y el perfil elegido al arrancar.',
        consequence: 'Mejor que A, y las credenciales de producción viajan dentro del artefacto. Cualquiera que lo obtenga las lee.'
      },
      {
        id: 'd',
        text: 'Recompilar en el servidor de producción.',
        consequence: 'Necesitas herramientas de compilación en producción y ya no sabes con certeza qué código está corriendo.'
      }
    ],
    answer: 'b',
    explain: 'La regla es separar el artefacto de la configuración. C es un punto intermedio aceptable si ningún properties contiene secretos, pero en cuanto entra una contraseña deja de serlo.'
  },
]

export default challenges
