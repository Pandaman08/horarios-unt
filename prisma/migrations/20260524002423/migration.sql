/*
  Warnings:

  - You are about to drop the column `antiguedad` on the `Docente` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dni]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Docente" DROP COLUMN "antiguedad",
ADD COLUMN     "dni" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "dni" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_dni_key" ON "Usuario"("dni");
