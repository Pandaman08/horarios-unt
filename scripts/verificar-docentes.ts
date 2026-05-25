import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarDocentes() {
  console.log('📋 Verificando docentes y asignaciones...');
  
  try {
    // 1. Obtener período activo (2026-I)
    const periodoActivo = await prisma.periodoAcademico.findFirst({
      where: { activo: true }
    });

    if (!periodoActivo) {
      console.log('❌ No hay período activo!');
      return;
    }

    console.log(`\n✅ Periodo activo: ${periodoActivo.nombre} (${periodoActivo.codigo})`);

    // 2. Contar docentes activos totales
    const totalDocentes = await prisma.docente.count({
      where: { activo: true }
    });
    console.log(`\n📊 Total docentes activos: ${totalDocentes}`);

    // 3. Docentes que tienen grupos en el período activo
    const gruposEnPeriodo = await prisma.grupo.findMany({
      where: { id_periodo: periodoActivo.id_periodo },
      include: { curso: { include: { docente_cursos: true } } }
    });

    const docentesIdsConGrupos = new Set<number>();
    gruposEnPeriodo.forEach(g => {
      g.curso.docente_cursos.forEach(dc => {
        docentesIdsConGrupos.add(dc.id_docente);
      });
    });

    console.log(`\n👨‍🏫 Docentes con grupos en el período: ${docentesIdsConGrupos.size}`);

    // 4. Docentes que ya tienen horarios asignados
    const docentesConHorarios = await prisma.horarioAsignado.groupBy({
      by: ['id_docente'],
      where: { id_periodo: periodoActivo.id_periodo }
    });

    console.log(`📚 Docentes con horarios ya asignados: ${docentesConHorarios.length}`);

    // 5. Listar todos los docentes con su estado
    const todosDocentes = await prisma.docente.findMany({
      where: { activo: true },
      select: { 
        id_docente: true, 
        codigo_docente: true, 
        nombres: true, 
        apellidos: true 
      }
    });

    console.log(`\n📋 Lista de docentes (${todosDocentes.length}):`);
    todosDocentes.forEach((docente, idx) => {
      const tieneGrupo = docentesIdsConGrupos.has(docente.id_docente);
      const tieneHorario = docentesConHorarios.some(dh => dh.id_docente === docente.id_docente);
      
      const status = [];
      if (tieneGrupo) status.push('✅ Tiene grupo');
      if (tieneHorario) status.push('✅ Tiene horario');
      if (!tieneGrupo && !tieneHorario) status.push('❌ Sin grupo ni horario');

      console.log(`   ${idx + 1}. ${docente.nombres} ${docente.apellidos} (${docente.codigo_docente}) - ${status.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDocentes();
