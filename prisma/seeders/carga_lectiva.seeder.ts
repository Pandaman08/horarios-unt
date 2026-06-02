// prisma/seeders/carga_lectiva.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedCargaLectiva(prisma: PrismaClient) {
  console.log('🌱 Sembrando Carga Lectiva para 2026-I...');

  const periodo = await prisma.periodoAcademico.findUnique({
    where: { codigo: '2026-I' },
  });

  if (!periodo) {
    throw new Error('❌ No se encontró el período 2026-I');
  }

  // Obtener docentes y cursos necesarios
  const docentes = await prisma.docente.findMany();
  const cursos = await prisma.curso.findMany({
    where: { id_ciclo: { in: [1, 3, 5, 7, 9] } },
    include: { grupos: { where: { id_periodo: periodo.id_periodo } } }
  });

  const docenteMap = new Map(docentes.map(d => [d.codigo_docente, d.id_docente]));
  const cursoMap = new Map(cursos.map(c => [c.codigo, c]));

  // Datos coherentes para 2026-I (Ciclos Impares)
  const asignaciones = [
    // Ciclo IX
    { docente: 'j17896289', curso: 'EI-901', tipo: 'teoria', horas: 2 },
    { docente: 'j17896289', curso: 'EI-901', tipo: 'laboratorio', horas: 2 },
    { docente: 'r18070765', curso: 'EE-903', tipo: 'teoria', horas: 2 },
    { docente: 'r18070765', curso: 'EE-903', tipo: 'laboratorio', horas: 2 },
    { docente: 'a17434055', curso: 'EE-902', tipo: 'teoria', horas: 2 },
    { docente: 'a17434055', curso: 'EE-902', tipo: 'laboratorio', horas: 2 },
    { docente: 'j40990648', curso: 'EE-901', tipo: 'teoria', horas: 2 },
    { docente: 'j40990648', curso: 'EE-901', tipo: 'laboratorio', horas: 2 },
    
    // Ciclo VII
    { docente: 'j17896289', curso: 'EE-704', tipo: 'teoria', horas: 2 },
    { docente: 'j17896289', curso: 'EE-704', tipo: 'laboratorio', horas: 2 },
    { docente: 'c18147714', curso: 'EE-703', tipo: 'teoria', horas: 2 },
    { docente: 'c18147714', curso: 'EE-703', tipo: 'laboratorio', horas: 2 },
    
    // Ciclo V
    { docente: 'l18842081', curso: 'EE-502', tipo: 'teoria', horas: 2 },
    { docente: 'l18842081', curso: 'EE-502', tipo: 'laboratorio', horas: 2 },
    { docente: 'r19082305', curso: 'EE-501', tipo: 'teoria', horas: 2 },
    { docente: 'r19082305', curso: 'EE-501', tipo: 'laboratorio', horas: 2 },
  ];

  let creados = 0;
  for (const asig of asignaciones) {
    const idDocente = docenteMap.get(asig.docente);
    const curso = cursoMap.get(asig.curso);
    const grupo = curso?.grupos[0];

    if (idDocente && curso && grupo) {
      await prisma.cargaLectiva.create({
        data: {
          id_docente: idDocente,
          id_curso: curso.id_curso,
          id_grupo: grupo.id_grupo,
          id_periodo: periodo.id_periodo,
          tipo_clase: asig.tipo,
          horas_semanales: asig.horas,
          estado: 'PENDIENTE'
        }
      });
      creados++;
    }
  }

  console.log(`✅ ${creados} registros de Carga Lectiva sembrados.`);
}
