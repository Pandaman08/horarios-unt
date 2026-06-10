/**
 * SystemKnowledge.ts
 * 
 * Este archivo contiene el inventario verificado de módulos, funcionalidades,
 * rutas y permisos del Sistema de Gestión de Horarios UNT.
 * 
 * El Chatbot utiliza esta información para proporcionar respuestas precisas
 * y evitar la deducción o invención de funcionalidades.
 */

export const SYSTEM_KNOWLEDGE = {
  project_name: "Sistema de Gestión de Horarios UNT",
  base_url: "/dashboard",
  roles: [
    "administrador_sistema",
    "operador_horarios",
    "docente"
  ],
  modules: [
    {
      id: "dashboard_principal",
      name: "Panel de Control (Dashboard)",
      route: "/dashboard",
      description: "Vista principal con KPIs y estadísticas generales del periodo.",
      allowed_roles: ["administrador_sistema", "operador_horarios", "docente"],
      features: [
        "Visualización de estadísticas de avance por categoría docente",
        "Resumen de carga horaria",
        "Indicadores de docentes atendidos y pendientes"
      ]
    },
    {
      id: "usuarios",
      name: "Gestión de Usuarios",
      route: "/dashboard/usuarios",
      description: "Administración de cuentas de usuario, roles y permisos.",
      allowed_roles: ["administrador_sistema"],
      features: [
        "Listado de usuarios registrados",
        "Creación de nuevos usuarios (Administrador, Operador, Docente)",
        "Edición de perfiles y asignación de roles",
        "Generación de códigos de acceso"
      ]
    },
    {
      id: "horarios_seleccion",
      name: "Selección de Horarios (Matriz)",
      route: "/dashboard/horarios/seleccion",
      description: "Interfaz principal para la asignación manual y automática de horarios.",
      allowed_roles: ["administrador_sistema", "operador_horarios"],
      features: [
        "Matriz de disponibilidad en tiempo real",
        "Asignación de celdas horarias a docentes y grupos",
        "Validación automática de conflictos (cruces de horas, ambientes)",
        "Asignación automática basada en algoritmos de prioridad",
        "Progreso de carga de cursos por ciclo"
      ]
    },
    {
      id: "mi_horario",
      name: "Mi Horario",
      route: "/dashboard/horarios/mi-horario",
      description: "Consulta del horario personal asignado al docente.",
      allowed_roles: ["docente"],
      features: [
        "Visualización de horario semanal personal",
        "Detalle de cursos, grupos y ambientes asignados"
      ]
    },
    {
      id: "carga_horaria",
      name: "Gestión de Carga Horaria",
      route: "/dashboard/carga-horaria",
      description: "Registro y actualización de la carga lectiva y no lectiva.",
      allowed_roles: ["docente", "administrador_sistema", "operador_horarios"],
      features: [
        "Declaración de horas lectivas (Teoría, Práctica, Lab)",
        "Declaración de horas no lectivas (Investigación, Gestión, etc.)",
        "Seguimiento de cumplimiento de carga mínima y máxima"
      ]
    },
    {
      id: "aprobacion_carga",
      name: "Aprobación de Carga",
      route: "/dashboard/aprobacion-carga-horaria",
      description: "Validación y aprobación administrativa de las declaraciones de carga.",
      allowed_roles: ["administrador_sistema", "operador_horarios"],
      features: [
        "Revisión de declaraciones enviadas por docentes",
        "Aprobación o rechazo de carga horaria"
      ]
    },
    {
      id: "disponibilidad",
      name: "Disponibilidad Docente",
      route: "/dashboard/disponibilidad",
      description: "Registro de franjas horarias disponibles para el dictado de clases.",
      allowed_roles: ["docente"],
      features: [
        "Registro de disponibilidad por días y horas",
        "Validación de horas mínimas requeridas"
      ]
    },
    {
      id: "catalogos",
      name: "Catálogos del Sistema",
      route: "/dashboard/catalogos",
      description: "Gestión de entidades base: Docentes, Cursos, Ambientes, Grupos y Periodos.",
      allowed_roles: ["administrador_sistema", "operador_horarios"],
      features: [
        "Mantenimiento de Ambientes (Aulas, Laboratorios)",
        "Mantenimiento de Cursos y Mallas Curriculares",
        "Mantenimiento de Grupos de Estudiantes",
        "Gestión de Periodos Académicos (Activo/Inactivo)"
      ]
    },
    {
      id: "reportes",
      name: "Reportes y Documentos",
      route: "/dashboard/reportes",
      description: "Generación de documentos oficiales en formatos PDF y Excel.",
      allowed_roles: ["administrador_sistema", "operador_horarios"],
      features: [
        "Generación de reportes PDF de horarios por Docente/Ciclo/Aula",
        "Exportación de carga lectiva a Excel",
        "Reportes de cumplimiento de horas"
      ]
    },
    {
      id: "notificaciones",
      name: "Centro de Notificaciones",
      route: "/dashboard/notificaciones",
      description: "Gestión de avisos vía Correo y Telegram.",
      allowed_roles: ["administrador_sistema", "operador_horarios", "docente"],
      features: [
        "Configuración de preferencias de notificación",
        "Historial de avisos enviados",
        "Alertas de cambios en horarios"
      ]
    }
  ],
  api_endpoints: [
    { path: "/api/chatbot", method: "POST", action: "Consulta al asistente con IA" },
    { path: "/api/dashboard/stats", method: "GET", action: "Obtener estadísticas globales" },
    { path: "/api/horarios/asignacion-automatica", method: "POST", action: "Ejecutar algoritmo de asignación" },
    { path: "/api/reportes/pdf", method: "POST", action: "Generar documento PDF" },
    { path: "/api/reportes/excel", method: "POST", action: "Exportar a Excel" },
    { path: "/api/usuarios", method: "POST", action: "Crear nuevo usuario" }
  ]
};
