const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Insertando horarios de prueba...');

  const periodo = await prisma.periodoAcademico.findUnique({ where: { codigo: '2026-I' } });
  const curso = await prisma.curso.findUnique({ where: { codigo: 'ISW-01' } });
  const docente = await prisma.docente.findFirst({ where: { nombres: 'María' } });
  const ambiente = await prisma.ambiente.findUnique({ where: { codigo: 'S101' } });

  // Crear un grupo si no existe
  const grupo = await prisma.grupo.upsert({
    where: {
      id_curso_codigo_grupo_id_periodo: {
        id_curso: curso.id_curso,
        codigo_grupo: 'A',
        id_periodo: periodo.id_periodo
      }
    },
    update: {},
    create: {
      id_curso: curso.id_curso,
      id_periodo: periodo.id_periodo,
      codigo_grupo: 'A',
      capacidad_maxima: 40
    }
  });

  // Asignar algunos bloques
  const horarios = [
    { dia: 1, inicio: '08:00', fin: '10:00' },
    { dia: 3, inicio: '10:00', fin: '12:00' },
    { dia: 5, inicio: '14:00', fin: '16:00' },
  ];

  for (const h of horarios) {
    await prisma.horarioAsignado.create({
      data: {
        id_docente: docente.id_docente,
        id_curso: curso.id_curso,
        id_grupo: grupo.id_grupo,
        id_ambiente: ambiente.id_ambiente,
        id_periodo: periodo.id_periodo,
        dia_semana: h.dia,
        hora_inicio: h.inicio,
        hora_fin: h.fin,
        tipo_clase: 'teoria',
        estado: 'confirmado'
      }
    });
  }

  console.log('Horarios de prueba insertados.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
