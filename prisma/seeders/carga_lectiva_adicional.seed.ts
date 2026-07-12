// prisma/seeders/13_carga_adicional.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedCargaAdicional(prisma: PrismaClient) {
  console.log('🌱 Sembrando Carga Lectiva Adicional (CLAD)...');
  
  const periodo = await prisma.periodoAcademico.findUnique({ where: { codigo: '2026-I' } });
  const docente = await prisma.docente.findFirst({ where: { nombres: 'EVERSON DAVID' } });
  const facultad = await prisma.facultad.findFirst({ where: { codigo: 'F11' } });
  
  if (!periodo || !docente || !facultad) return;

  // Crear CLAD
  const clad = await prisma.cargaLectivaAdicional.create({
    data: {
      docenteId: docente.id_docente,
      dependencia: 'FILIAL',
      sedeId: facultad.id,
      curso: 'Taller de Programación',
      numeroResolucion: 'R-2026-001',
      fechaInicio: new Date('2026-04-13'),
      fechaFin: new Date('2026-08-08'),
      totalHoras: 6,
      estado: 'APROBADO'
    }
  });

  // Agregar horarios
  await prisma.horarioActividad.createMany({
    data: [
      { cargaLectivaAdicionalId: clad.id, dia: 'LU', horaInicio: '18:00', horaFin: '20:00' },
      { cargaLectivaAdicionalId: clad.id, dia: 'MI', horaInicio: '18:00', horaFin: '20:00' },
      { cargaLectivaAdicionalId: clad.id, dia: 'VI', horaInicio: '18:00', horaFin: '20:00' }
    ]
  });

  console.log('✅ CLAD creado con horarios.');
}