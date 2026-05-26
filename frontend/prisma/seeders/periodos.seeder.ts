import { PrismaClient } from '@prisma/client';

export async function seedPeriodos(prisma: PrismaClient) {
  console.log('🌱 Sembrando Períodos Académicos...');

  const periodos = [
    {
      codigo: '2025-II',
      nombre: '2025 - Segundo Semestre',
      anio: 2025,
      semestre: 2,
      fecha_inicio: new Date('2025-09-01'),
      fecha_fin: new Date('2025-12-20'),
      fecha_inicio_clases: new Date('2025-09-01'),
      fecha_fin_clases: new Date('2025-12-20'),
      activo: true,
      estado: 'finalizado', // ya pasó
    },
    {
      codigo: '2026-I',
      nombre: '2026 - Primer Semestre',
      anio: 2026,
      semestre: 1,
      fecha_inicio: new Date('2026-03-01'),
      fecha_fin: new Date('2026-07-31'),
      fecha_inicio_clases: new Date('2026-04-13'),
      fecha_fin_clases: new Date('2026-08-08'),
      activo: true,
      estado: 'en_curso', // actualmente en proceso
    },
  ];

  for (const periodo of periodos) {
    await prisma.periodoAcademico.upsert({
      where: { codigo: periodo.codigo },
      update: periodo,
      create: periodo,
    });
    console.log(`✅ Período ${periodo.codigo} asegurado.`);
  }

  const resultado = await prisma.periodoAcademico.findMany();
  console.log(`✅ ${resultado.length} períodos sembrados.\n`);
  return resultado;
}