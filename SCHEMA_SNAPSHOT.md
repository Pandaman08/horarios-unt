
# SCHEMA SNAPSHOT

## model Usuario
model Usuario {
  id_usuario          Int       @id @default(autoincrement())
  codigo              String    @unique
  nombres             String
  apellidos           String
  correo_electronico  String?   @unique
  contrasena_hash     String
  rol                 String
  activo              Boolean   @default(true)
  ultimo_acceso       DateTime?
  fecha_creacion      DateTime  @default(now())
  fecha_actualizacion DateTime  @default(now())
  dni                 String?   @unique
  docente             Docente?
}

## model Docente
model Docente {
  id_docente                Int                               @id @default(autoincrement())
  id_usuario                Int?                              @unique
  codigo_docente            String                            @unique
  nombres                   String
  apellidos                 String
  modalidad                 String
  categoria                 String
  dedicacion                String?
  fecha_ingreso             DateTime?
  correo_electronico        String?
  telefono                  String?
  grado_academico           String?
  especialidad              String?
  horas_maximas_semanales   Int                               @default(40)
  activo                    Boolean                           @default(true)
  dni                       String?
  departamentoId            String?
  departamento              DepartamentoAcademico?            @relation(fields: [departamentoId], references: [id], onDelete: SetNull)
  facultadId                String?
  facultad                  Facultad?                         @relation(fields: [facultadId], references: [id], onDelete: SetNull)
  cola_notificaciones       ColaNotificaciones[]
  disponibilidad            DisponibilidadDocente[]
  usuario                   Usuario?                          @relation(fields: [id_usuario], references: [id_usuario])
  docente_cursos            DocenteCurso[]
  historial_notificaciones  HistorialNotificaciones[]
  horarios_asignados        HorarioAsignado[]
  preferencias_notificacion PreferenciasNotificacionDocente[]
  selecciones_temporales    SeleccionTemporalHorario[]
  declaraciones_horarias    DeclaracionHoraria[]
}

## enum EstadoDeclaracion
enum EstadoDeclaracion {
  BORRADOR
  ENVIADO
  APROBADO
  RECHAZADO
}

## enum TipoCargaNoLectiva
enum TipoCargaNoLectiva {
  PREPARACION_EVALUACION
  TUTORIA
  INVESTIGACION
  CAPACITACION
  GOBIERNO
  ADMINISTRACION
  ASESORIA
  RESPONSABILIDAD_SOCIAL
  COMITES_TECNICOS
  OTRO
}

## model DeclaracionHoraria
model DeclaracionHoraria {
  id_declaracion      Int                  @id @default(autoincrement())
  id_docente          Int
  id_periodo          Int
  ibm                 String
  condicion           String
  categoria           String
  dedicacion          String
  horas_dedicacion    Int
  estado              EstadoDeclaracion    @default(BORRADOR)
  fecha_creacion      DateTime             @default(now())
  fecha_actualizacion DateTime             @default(now())
  fecha_envio         DateTime?
  fecha_aprobacion    DateTime?
  observaciones       String?
  docente             Docente              @relation(fields: [id_docente], references: [id_docente])
  periodo             PeriodoAcademico     @relation(fields: [id_periodo], references: [id_periodo])
  cargas_lectivas     CargaLectiva[]
  cargas_no_lectivas  CargaNoLectiva[]
  formatos            FormatoDeclaracion[]

  @@unique([id_docente, id_periodo])
}

## model CargaLectiva
model CargaLectiva {
  id_carga_lectiva Int                @id @default(autoincrement())
  id_declaracion   Int
  id_curso         Int
  id_grupo         Int?
  tipo_clase       String // teoria, practica, laboratorio
  horas_semanales  Int
  grupos_asignados Int?
  sedeId           String?
  sede             Facultad?          @relation("CargaLectivaSede", fields: [sedeId], references: [id], onDelete: SetNull)
  curso            Curso              @relation(fields: [id_curso], references: [id_curso])
  grupo            Grupo?             @relation(fields: [id_grupo], references: [id_grupo])
  declaracion      DeclaracionHoraria @relation(fields: [id_declaracion], references: [id_declaracion])
}

## model CargaNoLectiva
model CargaNoLectiva {
  id_carga_no_lectiva Int                @id @default(autoincrement())
  id_declaracion      Int
  tipo                TipoCargaNoLectiva
  descripcion         String?
  horas_semanales     Int
  sedeId              String?
  sede                Facultad?          @relation("CargaNoLectivaSede", fields: [sedeId], references: [id], onDelete: SetNull)
  declaracion         DeclaracionHoraria @relation(fields: [id_declaracion], references: [id_declaracion])
}

