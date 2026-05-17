-- CreateTable
CREATE TABLE "Preasignacion" (
    "id_preasignacion" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_grupo" INTEGER NOT NULL,
    "id_ambiente" INTEGER NOT NULL,
    "dia_semana" INTEGER,
    "hora_inicio" TEXT,
    "hora_fin" TEXT,
    "tipo_clase" TEXT NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Preasignacion_pkey" PRIMARY KEY ("id_preasignacion")
);

-- AddForeignKey
ALTER TABLE "Preasignacion" ADD CONSTRAINT "Preasignacion_id_ambiente_fkey" FOREIGN KEY ("id_ambiente") REFERENCES "Ambiente"("id_ambiente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preasignacion" ADD CONSTRAINT "Preasignacion_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preasignacion" ADD CONSTRAINT "Preasignacion_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preasignacion" ADD CONSTRAINT "Preasignacion_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "Grupo"("id_grupo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preasignacion" ADD CONSTRAINT "Preasignacion_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "PeriodoAcademico"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;
