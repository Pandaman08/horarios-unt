-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo_electronico" TEXT,
    "contrasena_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Docente" (
    "id_docente" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "codigo_docente" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "dedicacion" TEXT,
    "antiguedad" INTEGER NOT NULL DEFAULT 0,
    "fecha_ingreso" TIMESTAMP(3),
    "correo_electronico" TEXT,
    "telefono" TEXT,
    "grado_academico" TEXT,
    "especialidad" TEXT,
    "horas_maximas_semanales" INTEGER NOT NULL DEFAULT 40,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Docente_pkey" PRIMARY KEY ("id_docente")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id_curso" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "horas_teoria" INTEGER NOT NULL DEFAULT 0,
    "horas_laboratorio" INTEGER NOT NULL DEFAULT 0,
    "horas_practica" INTEGER NOT NULL DEFAULT 0,
    "creditos" INTEGER NOT NULL,
    "ciclo" INTEGER,
    "plan_estudios" TEXT,
    "prerequisitos" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "DocenteCurso" (
    "id_docente_curso" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "tipo_clase" TEXT NOT NULL,
    "experiencia_anios" INTEGER NOT NULL DEFAULT 0,
    "prioridad" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocenteCurso_pkey" PRIMARY KEY ("id_docente_curso")
);

-- CreateTable
CREATE TABLE "Grupo" (
    "id_grupo" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "codigo_grupo" TEXT NOT NULL,
    "capacidad_maxima" INTEGER NOT NULL DEFAULT 40,
    "cantidad_matriculados" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id_grupo")
);

-- CreateTable
CREATE TABLE "Ambiente" (
    "id_ambiente" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "piso" TEXT,
    "pabellon" TEXT,
    "equipamiento" TEXT,
    "caracteristicas" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "requiere_mantenimiento" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,

    CONSTRAINT "Ambiente_pkey" PRIMARY KEY ("id_ambiente")
);

-- CreateTable
CREATE TABLE "CursoAmbiente" (
    "id_curso_ambiente" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_ambiente" INTEGER NOT NULL,
    "tipo_clase" TEXT NOT NULL,

    CONSTRAINT "CursoAmbiente_pkey" PRIMARY KEY ("id_curso_ambiente")
);

-- CreateTable
CREATE TABLE "PeriodoAcademico" (
    "id_periodo" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "fecha_inicio_clases" TIMESTAMP(3),
    "fecha_fin_clases" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "estado" TEXT NOT NULL DEFAULT 'planificacion',

    CONSTRAINT "PeriodoAcademico_pkey" PRIMARY KEY ("id_periodo")
);

-- CreateTable
CREATE TABLE "VentanaAtencion" (
    "id_ventana" SERIAL NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "orden_prioridad" INTEGER NOT NULL,
    "modalidad" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "intervalo_minutos" INTEGER NOT NULL DEFAULT 15,
    "cantidad_docentes" INTEGER NOT NULL DEFAULT 0,
    "cantidad_atendidos" INTEGER NOT NULL DEFAULT 0,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VentanaAtencion_pkey" PRIMARY KEY ("id_ventana")
);

-- CreateTable
CREATE TABLE "HorarioAsignado" (
    "id_asignacion" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_grupo" INTEGER NOT NULL,
    "tipo_clase" TEXT NOT NULL,
    "id_ambiente" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "id_ventana" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "observaciones" TEXT,
    "creado_por" INTEGER,

    CONSTRAINT "HorarioAsignado_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "SeleccionTemporalHorario" (
    "id_seleccion" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_grupo" INTEGER NOT NULL,
    "tipo_clase" TEXT NOT NULL,
    "id_ambiente" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "fecha_seleccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeleccionTemporalHorario_pkey" PRIMARY KEY ("id_seleccion")
);

-- CreateTable
CREATE TABLE "DisponibilidadDocente" (
    "id_disponibilidad" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "es_restriccion" BOOLEAN NOT NULL DEFAULT false,
    "motivo_restriccion" TEXT,

    CONSTRAINT "DisponibilidadDocente_pkey" PRIMARY KEY ("id_disponibilidad")
);

-- CreateTable
CREATE TABLE "ConflictoHorario" (
    "id_conflicto" SERIAL NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "tipo_conflicto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "id_docente_1" INTEGER,
    "id_docente_2" INTEGER,
    "id_curso" INTEGER,
    "id_ambiente" INTEGER,
    "dia_semana" INTEGER,
    "hora_inicio" TEXT,
    "hora_fin" TEXT,
    "resuelto" BOOLEAN NOT NULL DEFAULT false,
    "fecha_deteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),
    "resuelto_por" INTEGER,

    CONSTRAINT "ConflictoHorario_pkey" PRIMARY KEY ("id_conflicto")
);

-- CreateTable
CREATE TABLE "PreferenciasNotificacionDocente" (
    "id_preferencia" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "canal" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "datos_contacto" JSONB NOT NULL,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_verificacion" TIMESTAMP(3),

    CONSTRAINT "PreferenciasNotificacionDocente_pkey" PRIMARY KEY ("id_preferencia")
);

-- CreateTable
CREATE TABLE "HistorialNotificaciones" (
    "id_notificacion" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_ventana" INTEGER,
    "tipo_notificacion" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado_envio" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha_envio" TIMESTAMP(3),
    "fecha_entrega" TIMESTAMP(3),
    "codigo_respuesta" TEXT,
    "respuesta_servidor" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "HistorialNotificaciones_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateTable
CREATE TABLE "ColaNotificaciones" (
    "id_cola" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "tipo_notificacion" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "datos_mensaje" JSONB NOT NULL,
    "fecha_programada" TIMESTAMP(3) NOT NULL,
    "prioridad" INTEGER NOT NULL DEFAULT 5,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "maximo_intentos" INTEGER NOT NULL DEFAULT 3,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_procesamiento" TIMESTAMP(3),

    CONSTRAINT "ColaNotificaciones_pkey" PRIMARY KEY ("id_cola")
);

-- CreateTable
CREATE TABLE "ConfiguracionNotificaciones" (
    "id_configuracion" SERIAL NOT NULL,
    "tipo_notificacion" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "plantilla_mensaje" TEXT NOT NULL,
    "hora_envio" TEXT,
    "dias_antelacion" INTEGER,
    "minutos_antelacion" INTEGER,
    "configuracion_adicional" JSONB,

    CONSTRAINT "ConfiguracionNotificaciones_pkey" PRIMARY KEY ("id_configuracion")
);

-- CreateTable
CREATE TABLE "DiaNoLaborable" (
    "id_dia_no_laborable" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "afecta_clases" BOOLEAN NOT NULL DEFAULT true,
    "id_periodo" INTEGER,

    CONSTRAINT "DiaNoLaborable_pkey" PRIMARY KEY ("id_dia_no_laborable")
);

-- CreateTable
CREATE TABLE "RestriccionInstitucional" (
    "id_restriccion" SERIAL NOT NULL,
    "tipo_restriccion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "configuracion" JSONB NOT NULL,
    "id_periodo" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RestriccionInstitucional_pkey" PRIMARY KEY ("id_restriccion")
);

-- CreateTable
CREATE TABLE "AuditoriaHorario" (
    "id_auditoria" SERIAL NOT NULL,
    "id_asignacion" INTEGER,
    "accion" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "direccion_ip" TEXT,
    "motivo" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaHorario_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_codigo_key" ON "Usuario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_electronico_key" ON "Usuario"("correo_electronico");

-- CreateIndex
CREATE UNIQUE INDEX "Docente_id_usuario_key" ON "Docente"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Docente_codigo_docente_key" ON "Docente"("codigo_docente");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_codigo_key" ON "Curso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "DocenteCurso_id_docente_id_curso_tipo_clase_key" ON "DocenteCurso"("id_docente", "id_curso", "tipo_clase");

-- CreateIndex
CREATE UNIQUE INDEX "Grupo_id_curso_codigo_grupo_id_periodo_key" ON "Grupo"("id_curso", "codigo_grupo", "id_periodo");

-- CreateIndex
CREATE UNIQUE INDEX "Ambiente_codigo_key" ON "Ambiente"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CursoAmbiente_id_curso_id_ambiente_tipo_clase_key" ON "CursoAmbiente"("id_curso", "id_ambiente", "tipo_clase");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoAcademico_codigo_key" ON "PeriodoAcademico"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "SeleccionTemporalHorario_sesion_id_dia_semana_hora_inicio_key" ON "SeleccionTemporalHorario"("sesion_id", "dia_semana", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "DisponibilidadDocente_id_docente_dia_semana_hora_inicio_id__key" ON "DisponibilidadDocente"("id_docente", "dia_semana", "hora_inicio", "id_periodo");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciasNotificacionDocente_id_docente_canal_key" ON "PreferenciasNotificacionDocente"("id_docente", "canal");

-- AddForeignKey
ALTER TABLE "Docente" ADD CONSTRAINT "Docente_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteCurso" ADD CONSTRAINT "DocenteCurso_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteCurso" ADD CONSTRAINT "DocenteCurso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "PeriodoAcademico"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoAmbiente" ADD CONSTRAINT "CursoAmbiente_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoAmbiente" ADD CONSTRAINT "CursoAmbiente_id_ambiente_fkey" FOREIGN KEY ("id_ambiente") REFERENCES "Ambiente"("id_ambiente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentanaAtencion" ADD CONSTRAINT "VentanaAtencion_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "PeriodoAcademico"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioAsignado" ADD CONSTRAINT "HorarioAsignado_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioAsignado" ADD CONSTRAINT "HorarioAsignado_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioAsignado" ADD CONSTRAINT "HorarioAsignado_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "Grupo"("id_grupo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioAsignado" ADD CONSTRAINT "HorarioAsignado_id_ambiente_fkey" FOREIGN KEY ("id_ambiente") REFERENCES "Ambiente"("id_ambiente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioAsignado" ADD CONSTRAINT "HorarioAsignado_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "PeriodoAcademico"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioAsignado" ADD CONSTRAINT "HorarioAsignado_id_ventana_fkey" FOREIGN KEY ("id_ventana") REFERENCES "VentanaAtencion"("id_ventana") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionTemporalHorario" ADD CONSTRAINT "SeleccionTemporalHorario_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionTemporalHorario" ADD CONSTRAINT "SeleccionTemporalHorario_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionTemporalHorario" ADD CONSTRAINT "SeleccionTemporalHorario_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "Grupo"("id_grupo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionTemporalHorario" ADD CONSTRAINT "SeleccionTemporalHorario_id_ambiente_fkey" FOREIGN KEY ("id_ambiente") REFERENCES "Ambiente"("id_ambiente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionTemporalHorario" ADD CONSTRAINT "SeleccionTemporalHorario_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "PeriodoAcademico"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibilidadDocente" ADD CONSTRAINT "DisponibilidadDocente_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibilidadDocente" ADD CONSTRAINT "DisponibilidadDocente_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "PeriodoAcademico"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictoHorario" ADD CONSTRAINT "ConflictoHorario_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "PeriodoAcademico"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciasNotificacionDocente" ADD CONSTRAINT "PreferenciasNotificacionDocente_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialNotificaciones" ADD CONSTRAINT "HistorialNotificaciones_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColaNotificaciones" ADD CONSTRAINT "ColaNotificaciones_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;
