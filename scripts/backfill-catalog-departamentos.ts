/**
 * Vincula cursos y ambientes con departamentos/facultades según datos legacy.
 * Ejecutar: npx tsx scripts/backfill-catalog-departamentos.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Backfill catálogo: departamentos ---\n');

  const departamentos = await prisma.departamentoAcademico.findMany({
    include: { facultad: true },
  });

  let cursosActualizados = 0;
  for (const depto of departamentos) {
    const result = await prisma.curso.updateMany({
      where: {
        departamentoId: null,
        departamento_responsable: { not: null },
        OR: [
          { departamento_responsable: { contains: depto.nombre, mode: 'insensitive' } },
          { departamento_responsable: { equals: depto.nombre, mode: 'insensitive' } },
        ],
      },
      data: { departamentoId: depto.id },
    });
    if (result.count > 0) {
      console.log(`✅ ${result.count} cursos → ${depto.nombre}`);
      cursosActualizados += result.count;
    }
  }

  const deptoSistemas = departamentos.find((d) =>
    d.nombre.toLowerCase().includes('ingeniería de sistemas')
  );

  if (deptoSistemas) {
    const escuelaSistemas = await prisma.escuelaProfesional.findFirst({
      where: {
        facultadId: deptoSistemas.facultadId,
        nombre: { contains: 'Ingeniería de Sistemas', mode: 'insensitive' },
      },
    });

    const ambientesResult = await prisma.ambiente.updateMany({
      where: { departamentoId: null },
      data: {
        departamentoId: deptoSistemas.id,
        facultadId: deptoSistemas.facultadId,
      },
    });
    console.log(`✅ ${ambientesResult.count} ambientes → ${deptoSistemas.nombre}`);

    if (escuelaSistemas) {
      const cursosSistemas = await prisma.curso.updateMany({
        where: {
          departamentoId: deptoSistemas.id,
          escuelaId: null,
          departamento_responsable: { contains: 'Ingeniería de Sistemas', mode: 'insensitive' },
        },
        data: { escuelaId: escuelaSistemas.id },
      });
      console.log(`✅ ${cursosSistemas.count} cursos con escuela Sistemas`);
    }
  }

  const sinDepto = await prisma.curso.count({
    where: { activo: true, departamentoId: null },
  });
  const conDepto = await prisma.curso.count({
    where: { activo: true, departamentoId: { not: null } },
  });
  const ambientesConDepto = await prisma.ambiente.count({
    where: { activo: true, departamentoId: { not: null } },
  });

  console.log('\nResumen:');
  console.log(`  Cursos vinculados en esta ejecución: ${cursosActualizados}`);
  console.log(`  Cursos con departamento: ${conDepto}`);
  console.log(`  Cursos sin departamento: ${sinDepto}`);
  console.log(`  Ambientes con departamento: ${ambientesConDepto}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
