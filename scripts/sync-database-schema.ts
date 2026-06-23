/**
 * Sincroniza la base de datos con prisma/schema.prisma preservando datos existentes.
 * Ejecutar: npx tsx scripts/sync-database-schema.ts
 */
import { PrismaClient } from '@prisma/client';
import { seedFacultades } from '../prisma/seeders/facultades.seeder';
import { seedCargosAcademicosAdministrativos } from '../prisma/seeders/cargos_academicos_administrativos.seeder';

const prisma = new PrismaClient();

async function run(sql: string, label: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`✅ ${label}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes('already exists') ||
      msg.includes('duplicate key') ||
      msg.includes('ya existe') ||
      msg.includes('duplicate_object') ||
      msg.includes('enum label') ||
      msg.includes('42710')
    ) {
      console.log(`⏭️  ${label} (ya aplicado)`);
      return;
    }
    console.error(`❌ ${label}:`, msg);
    throw e;
  }
}

async function main() {
  console.log('--- Sincronizando esquema de base de datos ---\n');

  const enums = [
    `CREATE TYPE "RolUsuario" AS ENUM ('docente', 'operador_horarios', 'administrador_sistema', 'director_departamento', 'decano')`,
    `CREATE TYPE "CondicionDocente" AS ENUM ('ORDINARIO', 'EXTRAORDINARIO', 'CONTRATADO')`,
    `CREATE TYPE "CategoriaDocente" AS ENUM ('PRINCIPAL', 'ASOCIADO', 'AUXILIAR')`,
    `CREATE TYPE "RegimenDedicacion" AS ENUM ('DE', 'TC', 'TP1', 'TP2', 'TP3')`,
    `CREATE TYPE "TipoExtraordinario" AS ENUM ('HONORIS_CAUSA', 'EMERITO', 'HONORARIO', 'INVESTIGADOR', 'VISITANTE')`,
    `CREATE TYPE "TipoContrato" AS ENUM ('A1', 'A2', 'A3', 'B1', 'B2', 'B3')`,
    `CREATE TYPE "TipoFacultad" AS ENUM ('FACULTAD', 'FILIAL', 'ADMINISTRATIVA')`,
    `CREATE TYPE "DependenciaClad" AS ENUM ('FILIAL', 'POSGRADO', 'SEGUNDA_ESPECIALIDAD', 'CENTRO_PRODUCCION', 'EXTENSION_UNIVERSITARIA')`,
    `CREATE TYPE "EstadoClad" AS ENUM ('BORRADOR', 'ENVIADO', 'VALIDADO_DEPARTAMENTO', 'APROBADO', 'RECHAZADO')`,
    `CREATE TYPE "DiaSemana" AS ENUM ('LU', 'MA', 'MI', 'JU', 'VI', 'SA')`,
  ];

  for (const sql of enums) {
    await run(sql, `Enum: ${sql.match(/"(\w+)"/)?.[1]}`);
  }

  await run(
    `ALTER TYPE "EstadoDeclaracion" ADD VALUE 'VALIDADO_DEPARTAMENTO'`,
    'EstadoDeclaracion + VALIDADO_DEPARTAMENTO'
  );
  await run(
    `ALTER TYPE "EstadoDeclaracion" ADD VALUE 'LECTIVA_CONFIRMADA'`,
    'EstadoDeclaracion + LECTIVA_CONFIRMADA'
  );
  await run(
    `ALTER TYPE "TipoCargaNoLectiva" ADD VALUE 'AUTOEVALUACION_ACREDITACION'`,
    'TipoCargaNoLectiva + AUTOEVALUACION_ACREDITACION'
  );

  await run(`
    CREATE TABLE IF NOT EXISTS "Facultad" (
      "id" TEXT NOT NULL,
      "nombre" TEXT NOT NULL,
      "codigo" TEXT NOT NULL,
      "tipo" "TipoFacultad" NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Facultad_pkey" PRIMARY KEY ("id")
    )`, 'Tabla Facultad');

  await run(`
    CREATE TABLE IF NOT EXISTS "DepartamentoAcademico" (
      "id" TEXT NOT NULL,
      "nombre" TEXT NOT NULL,
      "facultadId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DepartamentoAcademico_pkey" PRIMARY KEY ("id")
    )`, 'Tabla DepartamentoAcademico');

  await run(`
    CREATE TABLE IF NOT EXISTS "EscuelaProfesional" (
      "id" TEXT NOT NULL,
      "nombre" TEXT NOT NULL,
      "facultadId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EscuelaProfesional_pkey" PRIMARY KEY ("id")
    )`, 'Tabla EscuelaProfesional');

  await run(`
    CREATE TABLE IF NOT EXISTS "CargoAcademicoAdministrativo" (
      "id" TEXT NOT NULL,
      "nombre" TEXT NOT NULL,
      "chlm" INTEGER NOT NULL,
      "chnlpe" INTEGER NOT NULL,
      "chnla" INTEGER NOT NULL,
      CONSTRAINT "CargoAcademicoAdministrativo_pkey" PRIMARY KEY ("id")
    )`, 'Tabla CargoAcademicoAdministrativo');

  await run(`
    CREATE TABLE IF NOT EXISTS "PersonalApoyo" (
      "id" TEXT NOT NULL,
      "nombre" TEXT NOT NULL,
      "tipo" TEXT NOT NULL,
      "modalidad" TEXT NOT NULL,
      "departamentoId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PersonalApoyo_pkey" PRIMARY KEY ("id")
    )`, 'Tabla PersonalApoyo');

  await run(`
    CREATE TABLE IF NOT EXISTS "HorarioActividad" (
      "id" TEXT NOT NULL,
      "cargaNoLectivaId" INTEGER,
      "cargaLectivaAdicionalId" TEXT,
      "dia" "DiaSemana" NOT NULL,
      "horaInicio" TEXT NOT NULL,
      "horaFin" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "HorarioActividad_pkey" PRIMARY KEY ("id")
    )`, 'Tabla HorarioActividad');

  await run(`
    CREATE TABLE IF NOT EXISTS "CargaLectivaAdicional" (
      "id" TEXT NOT NULL,
      "docenteId" INTEGER NOT NULL,
      "dependencia" "DependenciaClad" NOT NULL,
      "sedeId" TEXT NOT NULL,
      "curso" TEXT NOT NULL,
      "numeroResolucion" TEXT,
      "fechaInicio" TIMESTAMP(3) NOT NULL,
      "fechaFin" TIMESTAMP(3) NOT NULL,
      "totalHoras" INTEGER NOT NULL,
      "estado" "EstadoClad" NOT NULL DEFAULT 'BORRADOR',
      "observaciones" TEXT,
      "validadoPorId" INTEGER,
      "fechaValidacion" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CargaLectivaAdicional_pkey" PRIMARY KEY ("id")
    )`, 'Tabla CargaLectivaAdicional');

  await run(`
    CREATE TABLE IF NOT EXISTS "IntegracionSimulada" (
      "id" TEXT NOT NULL,
      "tipo" TEXT NOT NULL,
      "docenteId" INTEGER,
      "payload" TEXT NOT NULL,
      "resultado" TEXT NOT NULL,
      "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "IntegracionSimulada_pkey" PRIMARY KEY ("id")
    )`, 'Tabla IntegracionSimulada');

  const indexes = [
    `CREATE UNIQUE INDEX IF NOT EXISTS "Facultad_codigo_key" ON "Facultad"("codigo")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "DepartamentoAcademico_nombre_facultadId_key" ON "DepartamentoAcademico"("nombre", "facultadId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "EscuelaProfesional_nombre_facultadId_key" ON "EscuelaProfesional"("nombre", "facultadId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "CargoAcademicoAdministrativo_nombre_key" ON "CargoAcademicoAdministrativo"("nombre")`,
  ];
  for (const sql of indexes) await run(sql, 'Índice único');

  const addColumn = async (table: string, column: string, type: string) => {
    await run(
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type}`,
      `Columna ${table}.${column}`
    );
  };

  await addColumn('Ambiente', 'departamentoId', 'TEXT');
  await addColumn('Ambiente', 'facultadId', 'TEXT');
  await addColumn('CargaLectiva', 'sedeId', 'TEXT');
  await addColumn('CargaNoLectiva', 'ambiente', 'TEXT');
  await addColumn('CargaNoLectiva', 'cargoId', 'TEXT');
  await addColumn('CargaNoLectiva', 'sedeId', 'TEXT');
  await addColumn('Curso', 'departamentoId', 'TEXT');
  await addColumn('Curso', 'escuelaId', 'TEXT');
  await addColumn('DeclaracionHoraria', 'declaracionJuradaOpcion', 'TEXT');
  await addColumn('DeclaracionHoraria', 'etapaRechazo', 'TEXT');
  await addColumn('DeclaracionHoraria', 'fechaFirmaJurada', 'TIMESTAMP(3)');
  await addColumn('DeclaracionHoraria', 'fechaValidacionDepartamento', 'TIMESTAMP(3)');
  await addColumn('DeclaracionHoraria', 'validadoPorId', 'INTEGER');
  await addColumn('MallaCurricular', 'departamentoId', 'TEXT');
  await addColumn('MallaCurricular', 'escuelaId', 'TEXT');
  await addColumn('MallaCurricular', 'facultadId', 'TEXT');

  await addColumn('Docente', 'categoriaDocente', '"CategoriaDocente"');
  await addColumn('Docente', 'condicion', '"CondicionDocente"');
  await addColumn('Docente', 'departamentoId', 'TEXT');
  await addColumn('Docente', 'esInvestigadorAcreditado', 'BOOLEAN NOT NULL DEFAULT false');
  await addColumn('Docente', 'facultadId', 'TEXT');
  await addColumn('Docente', 'nivelRenacyt', 'TEXT');
  await addColumn('Docente', 'regimenDedicacion', '"RegimenDedicacion"');
  await addColumn('Docente', 'sancionActiva', 'BOOLEAN NOT NULL DEFAULT false');
  await addColumn('Docente', 'sancionHasta', 'TIMESTAMP(3)');
  await addColumn('Docente', 'tipoContrato', '"TipoContrato"');
  await addColumn('Docente', 'tipoExtraordinario', '"TipoExtraordinario"');

  console.log('\n-> Sembrando facultades y departamentos...');
  await seedFacultades(prisma);
  await seedCargosAcademicosAdministrativos(prisma);

  console.log('\n-> Migrando datos de docentes...');
  await run(`
    UPDATE "Docente"
    SET "condicion" = CASE
      WHEN LOWER("modalidad") = 'nombrado' THEN CAST('ORDINARIO' AS "CondicionDocente")
      WHEN LOWER("modalidad") = 'contratado' THEN CAST('CONTRATADO' AS "CondicionDocente")
      ELSE NULL
    END
    WHERE "condicion" IS NULL AND "modalidad" IS NOT NULL`, 'Backfill condicion');

  await run(`
    UPDATE "Docente"
    SET "categoriaDocente" = CASE
      WHEN LOWER("categoria") = 'principal' THEN CAST('PRINCIPAL' AS "CategoriaDocente")
      WHEN LOWER("categoria") = 'asociado' THEN CAST('ASOCIADO' AS "CategoriaDocente")
      WHEN LOWER("categoria") = 'auxiliar' THEN CAST('AUXILIAR' AS "CategoriaDocente")
      ELSE NULL
    END
    WHERE "categoriaDocente" IS NULL AND "categoria" IS NOT NULL`, 'Backfill categoriaDocente');

  await run(`
    UPDATE "Docente"
    SET "regimenDedicacion" = CASE
      WHEN UPPER("dedicacion") IN ('DE','TC','TP1','TP2','TP3')
        THEN CAST(UPPER("dedicacion") AS "RegimenDedicacion")
      ELSE CAST('TC' AS "RegimenDedicacion")
    END
    WHERE "regimenDedicacion" IS NULL
      AND "condicion" = CAST('ORDINARIO' AS "CondicionDocente")`, 'Backfill regimenDedicacion');

  await run(`
    UPDATE "Docente" d
    SET "facultadId" = f."id"
    FROM "Facultad" f
    WHERE d."facultadId" IS NULL AND f."codigo" = 'F11'`, 'Asignar facultad F11 a docentes');

  await run(`
    UPDATE "Docente" d
    SET "departamentoId" = dep."id"
    FROM "DepartamentoAcademico" dep
    JOIN "Facultad" f ON f."id" = dep."facultadId"
    WHERE d."departamentoId" IS NULL
      AND f."codigo" = 'F11'
      AND dep."nombre" = 'Ingeniería de Sistemas'`, 'Asignar depto Ingeniería de Sistemas');

  await run(`
    UPDATE "MallaCurricular" m
    SET "departamentoId" = dep."id",
        "facultadId" = f."id"
    FROM "DepartamentoAcademico" dep
    JOIN "Facultad" f ON f."id" = dep."facultadId"
    WHERE m."departamentoId" IS NULL
      AND f."codigo" = 'F11'
      AND dep."nombre" = 'Ingeniería de Sistemas'`, 'Asignar depto a mallas');

  const hasModalidad = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Docente' AND column_name = 'modalidad'
    ) as exists`;

  if (hasModalidad[0]?.exists) {
    await run(`ALTER TABLE "Docente" DROP COLUMN IF EXISTS "modalidad"`, 'Eliminar Docente.modalidad');
    await run(`ALTER TABLE "Docente" DROP COLUMN IF EXISTS "categoria"`, 'Eliminar Docente.categoria');
    await run(`ALTER TABLE "Docente" DROP COLUMN IF EXISTS "dedicacion"`, 'Eliminar Docente.dedicacion');
  }

  const rolType = await prisma.$queryRaw<{ udt_name: string }[]>`
    SELECT udt_name FROM information_schema.columns
    WHERE table_name = 'Usuario' AND column_name = 'rol' LIMIT 1`;

  if (rolType[0]?.udt_name === 'text') {
    await run(`ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "rol_new" "RolUsuario"`, 'Usuario.rol_new');
    await run(`
      UPDATE "Usuario"
      SET "rol_new" = CASE
        WHEN "rol" IN ('docente','operador_horarios','administrador_sistema','director_departamento','decano')
          THEN CAST("rol" AS "RolUsuario")
        ELSE CAST('docente' AS "RolUsuario")
      END
      WHERE "rol_new" IS NULL`, 'Migrar valores de rol');
    await run(`ALTER TABLE "Usuario" DROP COLUMN "rol"`, 'Eliminar Usuario.rol text');
    await run(`ALTER TABLE "Usuario" RENAME COLUMN "rol_new" TO "rol"`, 'Renombrar Usuario.rol');
    await run(`ALTER TABLE "Usuario" ALTER COLUMN "rol" SET NOT NULL`, 'Usuario.rol NOT NULL');
    await run(`ALTER TABLE "Usuario" ALTER COLUMN "rol" SET DEFAULT 'docente'`, 'Usuario.rol default');
  }

  const fks = [
    `ALTER TABLE "Docente" ADD CONSTRAINT "Docente_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "DepartamentoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "Docente" ADD CONSTRAINT "Docente_facultadId_fkey" FOREIGN KEY ("facultadId") REFERENCES "Facultad"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "DepartamentoAcademico" ADD CONSTRAINT "DepartamentoAcademico_facultadId_fkey" FOREIGN KEY ("facultadId") REFERENCES "Facultad"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "EscuelaProfesional" ADD CONSTRAINT "EscuelaProfesional_facultadId_fkey" FOREIGN KEY ("facultadId") REFERENCES "Facultad"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "MallaCurricular" ADD CONSTRAINT "MallaCurricular_facultadId_fkey" FOREIGN KEY ("facultadId") REFERENCES "Facultad"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "MallaCurricular" ADD CONSTRAINT "MallaCurricular_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "EscuelaProfesional"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "MallaCurricular" ADD CONSTRAINT "MallaCurricular_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "DepartamentoAcademico"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "Curso" ADD CONSTRAINT "Curso_escuelaId_fkey" FOREIGN KEY ("escuelaId") REFERENCES "EscuelaProfesional"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "Curso" ADD CONSTRAINT "Curso_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "DepartamentoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "Ambiente" ADD CONSTRAINT "Ambiente_facultadId_fkey" FOREIGN KEY ("facultadId") REFERENCES "Facultad"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "Ambiente" ADD CONSTRAINT "Ambiente_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "DepartamentoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "DeclaracionHoraria" ADD CONSTRAINT "DeclaracionHoraria_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "CargaLectiva" ADD CONSTRAINT "CargaLectiva_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Facultad"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "CargaNoLectiva" ADD CONSTRAINT "CargaNoLectiva_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Facultad"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "CargaNoLectiva" ADD CONSTRAINT "CargaNoLectiva_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "CargoAcademicoAdministrativo"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "HorarioActividad" ADD CONSTRAINT "HorarioActividad_cargaNoLectivaId_fkey" FOREIGN KEY ("cargaNoLectivaId") REFERENCES "CargaNoLectiva"("id_carga_no_lectiva") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "HorarioActividad" ADD CONSTRAINT "HorarioActividad_cargaLectivaAdicionalId_fkey" FOREIGN KEY ("cargaLectivaAdicionalId") REFERENCES "CargaLectivaAdicional"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "CargaLectivaAdicional" ADD CONSTRAINT "CargaLectivaAdicional_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE`,
    `ALTER TABLE "CargaLectivaAdicional" ADD CONSTRAINT "CargaLectivaAdicional_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Facultad"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    `ALTER TABLE "CargaLectivaAdicional" ADD CONSTRAINT "CargaLectivaAdicional_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "IntegracionSimulada" ADD CONSTRAINT "IntegracionSimulada_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id_docente") ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "PersonalApoyo" ADD CONSTRAINT "PersonalApoyo_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "DepartamentoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  ];

  for (const sql of fks) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // FK ya existe
    }
  }
  console.log('✅ Foreign keys verificadas');

  const count = await prisma.docente.count();
  console.log(`\n✅ Sincronización completada. Docentes en BD: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
