/*
  Warnings:

  - You are about to drop the column `ciclo` on the `Curso` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Curso" DROP COLUMN "ciclo",
ADD COLUMN     "id_ciclo" INTEGER,
ADD COLUMN     "tipo_curso" TEXT NOT NULL DEFAULT 'linea_carrera';

-- AlterTable
ALTER TABLE "Grupo" ADD COLUMN     "id_ciclo" INTEGER;

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
