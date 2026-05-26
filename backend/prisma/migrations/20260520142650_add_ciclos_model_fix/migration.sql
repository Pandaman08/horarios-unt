/*
  Warnings:

  - You are about to drop the column `ciclo` on the `Curso` table (if it exists). All the data in the column will be lost.

*/
-- AlterTable
DO $$ BEGIN
  ALTER TABLE "Curso" DROP COLUMN "ciclo";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

ALTER TABLE "Curso" 
ADD COLUMN IF NOT EXISTS "id_ciclo" INTEGER,
ADD COLUMN IF NOT EXISTS "tipo_curso" TEXT NOT NULL DEFAULT 'linea_carrera';

-- AlterTable
DO $$ BEGIN
  ALTER TABLE "Grupo" ADD COLUMN "id_ciclo" INTEGER;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- CreateTable
CREATE TABLE "Ciclo" (
    "id_ciclo" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Ciclo_pkey" PRIMARY KEY ("id_ciclo")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ciclo_numero_key" ON "Ciclo"("numero");

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_id_ciclo_fkey" FOREIGN KEY ("id_ciclo") REFERENCES "Ciclo"("id_ciclo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_id_ciclo_fkey" FOREIGN KEY ("id_ciclo") REFERENCES "Ciclo"("id_ciclo") ON DELETE SET NULL ON UPDATE CASCADE;
