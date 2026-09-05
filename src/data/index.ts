import type { Achievement, Challenge, ProjectBrief } from '../types'
import { CH_01 } from './challenges-01'
import { CH_02 } from './challenges-02'
import { CH_03 } from './challenges-03'
import { CH_04 } from './challenges-04'
import { CH_05 } from './challenges-05'
import { CH_06 } from './challenges-06'

export const CHALLENGES: Challenge[] = [...CH_01, ...CH_02, ...CH_03, ...CH_04, ...CH_05, ...CH_06]

export const CHALLENGE_BY_ID: Record<string, Challenge> = Object.fromEntries(
  CHALLENGES.map(c => [c.id, c]),
)

export function challengesOf(worldId: string): Challenge[] {
  return CHALLENGES.filter(c => c.worldId === worldId)
}

/**
 * Proyectos: son briefs para construir en tu IDE, no simulaciones.
 * Cada uno se desbloquea al superar la boss battle del mundo indicado
 * y se compone solo de temas que el curso cubre.
 */
export const PROJECTS: ProjectBrief[] = [
  {
    id: 'p1', title: 'CRUD en memoria', unlockedBy: 'w03',
    goal: 'Una API de productos sin base de datos, para asentar controladores, parámetros y capas.',
    requirements: [
      'Proyecto con spring-boot-starter-web y nada más',
      'Entidad Producto y una lista en memoria dentro del Service',
      'Endpoints GET de listado, GET por id, POST de alta y DELETE',
      'El id llega por @PathVariable y el filtro por @RequestParam',
      'Separación real Controller → Service, sin lógica en el Controller',
    ],
    acceptance: [
      'GET /api/productos devuelve la lista completa en JSON',
      'GET /api/productos/1 devuelve un solo producto',
      'El Controller no contiene ninguna colección ni lógica de negocio',
      'El puerto se puede cambiar desde application.properties sin tocar código',
    ],
    stretch: ['Añadir un perfil dev que precargue tres productos de ejemplo'],
  },
  {
    id: 'p2', title: 'API REST con MySQL', unlockedBy: 'w09',
    goal: 'La misma API, ahora con persistencia real y consultas propias.',
    requirements: [
      'Dependencias de Spring Data JPA y el driver de MySQL',
      'Entidad Producto con @Entity, @Id y @GeneratedValue',
      'Repositorio que extienda JpaRepository',
      'Al menos un Query Method y al menos una consulta con @Query en JPQL',
      'Un método de Service anotado con @Transactional que haga dos escrituras',
    ],
    acceptance: [
      'Los datos sobreviven al reinicio de la aplicación',
      'El log de Hibernate muestra el SQL que se emite',
      'Una excepción a mitad del método transaccional revierte ambas escrituras',
      'La contraseña de la base de datos no está escrita en el properties del repositorio',
    ],
    stretch: ['Cambiar ddl-auto a validate y comprobar que la app avisa si el esquema no coincide'],
  },
  {
    id: 'p3', title: 'Dominio con relaciones', unlockedBy: 'w10',
    goal: 'Modelar Cliente, Factura y LineaFactura con las relaciones correctas y sin N+1.',
    requirements: [
      'Cliente 1—N Factura, con la clave foránea en Factura',
      'Factura 1—N LineaFactura con cascade y orphanRemoval',
      'Todas las relaciones en LAZY',
      'Consultas con join fetch para los endpoints que necesitan el grafo',
      'DTOs de salida: ninguna entidad se expone directamente',
    ],
    acceptance: [
      'Listar 50 facturas emite una sola consulta, verificable en el log',
      'Borrar una factura borra sus líneas y no toca al cliente',
      'Ningún endpoint lanza LazyInitializationException',
      'La respuesta JSON no incluye campos internos ni relaciones completas sin pedirlas',
    ],
  },
  {
    id: 'p4', title: 'Validación y errores', unlockedBy: 'w11',
    goal: 'Cerrar el contrato de la API: entradas validadas y errores uniformes.',
    requirements: [
      'DTOs de entrada con restricciones de Bean Validation y @Valid en los endpoints',
      'Excepciones propias para no encontrado y para conflicto de negocio',
      'Un @RestControllerAdvice que traduzca cada excepción a su código HTTP',
      'Formato de error único para toda la API, con campo, mensaje y marca de tiempo',
      'ResponseEntity con 201 y cabecera Location en las creaciones',
    ],
    acceptance: [
      'Un cuerpo inválido responde 400 con el detalle por campo',
      'Un recurso inexistente responde 404, nunca 500',
      'Ninguna respuesta de error expone el stack trace',
      'Un JSON mal formado responde 400 y no 500',
    ],
  },
  {
    id: 'p5', title: 'Seguridad con JWT', unlockedBy: 'w12',
    goal: 'Autenticación con token y autorización por roles sobre la API anterior.',
    requirements: [
      'Entidad Usuario con roles y contraseñas guardadas con BCrypt',
      'UserDetailsService propio que cargue desde la base de datos',
      'Endpoint de login que emita un token firmado con expiración',
      'Filtro que valide el token y pueble el SecurityContext',
      'Política de sesión STATELESS y reglas de acceso por ruta y rol',
    ],
    acceptance: [
      'Sin token, los endpoints protegidos responden 401',
      'Con token de rol insuficiente responden 403',
      'Un token manipulado o expirado se rechaza',
      'La contraseña nunca aparece en ninguna respuesta ni en el log',
    ],
    stretch: ['Añadir refresh token y comprobar que la revocación surte efecto en minutos'],
  },
  {
    id: 'p6', title: 'Despliegue real', unlockedBy: 'w13',
    goal: 'El mismo JAR corriendo fuera de tu máquina, con configuración externa.',
    requirements: [
      'Empaquetado como JAR ejecutable',
      'Perfil prod con ddl-auto en validate',
      'URL, usuario y contraseña de la base de datos leídos de variables de entorno',
      'Base de datos en un host distinto al de la aplicación',
      'Arranque con el perfil activo pasado por línea de comandos',
    ],
    acceptance: [
      'El mismo artefacto arranca en local y en el servidor sin recompilar',
      'El repositorio no contiene ninguna credencial',
      'Un cambio de contraseña se aplica sin generar un JAR nuevo',
    ],
  },
  {
    id: 'p7', title: 'Aplicación completa', unlockedBy: 'w15',
    goal: 'El proyecto integrador: todo el curso en una sola aplicación.',
    requirements: [
      'Módulo MVC con Thymeleaf: listado paginado, alta y edición con formularios',
      'API REST equivalente, consumida por un frontend separado',
      'Login con roles, protegiendo ambos módulos',
      'Subida de imagen asociada a la entidad principal',
      'Interfaz en dos idiomas con archivos de mensajes',
      'Interceptor o aspecto que registre las operaciones de escritura',
    ],
    acceptance: [
      'Un usuario sin rol de administración no ve ni alcanza las pantallas de alta',
      'El listado pagina en el SQL, no en memoria',
      'Guardar y recargar no duplica el registro',
      'El cambio de idioma persiste durante la navegación',
      'La API y la vista comparten los mismos Services, sin lógica duplicada',
    ],
  },
]

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-blood', title: 'Primer acierto', detail: 'Resolviste tu primer reto.', icon: '◆' },
  { id: 'w01', title: 'Contenedor arrancado', detail: 'Superaste la boss battle de Fundamentos.', icon: '▲' },
  { id: 'streak-3', title: 'Tres días seguidos', detail: 'Practicaste tres días consecutivos.', icon: '▮' },
  { id: 'streak-7', title: 'Una semana entera', detail: 'Siete días consecutivos de práctica.', icon: '▮▮' },
  { id: 'perfect-boss', title: 'Sin un rasguño', detail: 'Superaste una boss battle sin fallar ni un reto.', icon: '★' },
  { id: 'debugger', title: 'Lector de stack traces', detail: 'Resolviste 10 retos de debugging.', icon: '⌁' },
  { id: 'architect', title: 'Criterio de diseño', detail: 'Resolviste 10 retos de decisión o arquitectura.', icon: '⬡' },
  { id: 'di-master', title: 'Dominas el contenedor', detail: 'Todos los conceptos de inyección de dependencias en verde.', icon: '⬢' },
  { id: 'jpa-master', title: 'Relaciones bajo control', detail: 'Todos los conceptos de relaciones JPA en verde.', icon: '⬢' },
  { id: 'sec-master', title: 'Cadena de filtros', detail: 'Todos los conceptos de seguridad en verde.', icon: '⬢' },
  { id: 'no-hints', title: 'Sin pistas', detail: 'Resolviste 20 retos seguidos sin usar la pista.', icon: '◇' },
  { id: 'comeback', title: 'Segunda vuelta', detail: 'Recuperaste un concepto que tenías en rojo hasta ponerlo en verde.', icon: '↻' },
  { id: 'half', title: 'Media montaña', detail: 'Completaste ocho mundos.', icon: '◐' },
  { id: 'all-worlds', title: 'Mapa completo', detail: 'Superaste las quince boss battles.', icon: '◉' },
  { id: 'exam', title: 'Examen presentado', detail: 'Completaste el Spring Boot Expert Exam.', icon: '✦' },
  { id: 'exam-90', title: 'Expert certificado', detail: 'Sacaste 90 % o más en el examen final.', icon: '✧' },
  { id: 'grinder', title: 'Cien retos', detail: 'Resolviste cien retos en total.', icon: '⧗' },
  { id: 'builder', title: 'Constructor', detail: 'Completaste el checklist de un proyecto.', icon: '⌸' },
]
