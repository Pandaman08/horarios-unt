/*
  Warnings:

  - You are about to drop the column `antiguedad` on the `Docente` table (if it exists). All the data in the column will be lost.
  - A unique constraint covering the columns `[dni]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable for Docente
DO $$ BEGIN
  ALTER TABLE "Docente" DROP COLUMN "antiguedad";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Docente" ADD COLUMN "dni" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- AlterTable for Usuario
DO $$ BEGIN
  ALTER TABLE "Usuario" ADD COLUMN "dni" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- CreateIndex
DO $$ BEGIN
  CREATE UNIQUE INDEX "Usuario_dni_key" ON "Usuario"("dni");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;
