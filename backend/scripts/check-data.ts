import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DIAGNÓSTICO DE DATOS: DocenteCurso ---');
  
  const totalDocenteCurso = await prisma.docenteCurso.count();
  console.log(`Total de registros en DocenteCurso: ${totalDocenteCurso}`);

  if (totalDocenteCurso > 0) {
    const algunosRegistros = await prisma.docenteCurso.findMany({
      take: 5,
      include: {
        docente: { select: { nombres: true, apellidos: true, id_docente: true } },
        curso: { select: { nombre: true, id_curso: true } }
      }
    });
    console.log('Ejemplos de relaciones Docente-Curso:');
    algunosRegistros.forEach(r => {
      console.log(`- Docente: ${r.docente.nombres} ${r.docente.apellidos} (ID: ${r.id_docente}) -> Curso: ${r.curso.nombre} (ID: ${r.id_curso}) [Tipo: ${r.tipo_clase}]`);
    });
  } else {
    console.log('AVISO: La tabla DocenteCurso está VACÍA.');
  }

  console.log('\n--- DIAGNÓSTICO DE DATOS: Grupo ---');
  const totalGrupos = await prisma.grupo.count();
  console.log(`Total de registros en Grupo: ${totalGrupos}`);

  console.log('\n--- DIAGNÓSTICO DE DATOS: CursoAmbiente ---');
  const totalCursoAmbiente = await prisma.cursoAmbiente.count();
  console.log(`Total de registros en CursoAmbiente: ${totalCursoAmbiente}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
