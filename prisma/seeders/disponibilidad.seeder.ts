// prisma/seeders/disponibilidad.seeder.ts
import { PrismaClient } from '@prisma/client';

const HORAS_POR_REGIMEN: Record<string, number> = {
  DE: 40, TC: 40, TP1: 20, TP2: 10, TP3: 8,
};

const HORAS_POR_CONTRATO: Record<string, number> = {
  A1: 32, A2: 16, A3: 8, B1: 32, B2: 16, B3: 8,
};

function getHorasMaximasSemanales(docente: {
  condicion?: string | null;
  regimenDedicacion?: string | null;
  tipoContrato?: string | null;
  horas_maximas_semanales?: number | null;
}): number {
  if (docente.condicion === 'CONTRATADO' && docente.tipoContrato) {
    return HORAS_POR_CONTRATO[docente.tipoContrato] ?? 0;
  }
  if (docente.regimenDedicacion) {
    return HORAS_POR_REGIMEN[docente.regimenDedicacion] ?? 0;
  }
  if (docente.horas_maximas_semanales && docente.horas_maximas_semanales > 0) {
    return docente.horas_maximas_semanales;
  }
  return 40;
}

export async function seedDisponibilidad(prisma: PrismaClient) {
  console.log('🌱 Sembrando Disponibilidad de Docentes...');

  // Obtener docentes y periodos
  const docentes = await prisma.docente.findMany();
  const periodos = await prisma.periodoAcademico.findMany();

  // Rango de horas (07:00 a 21:00, bloques de 1 hora, excluyendo receso 12:00)
  const horas = [
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00'
  ];

  // Días de la semana (0: Lunes a 5: Sábado)
  const dias = [0, 1, 2, 3, 4, 5];

  // Asignar disponibilidad para cada docente en cada período
  for (const periodo of periodos) {
    for (const docente of docentes) {
      const horasMaximas = getHorasMaximasSemanales({
        condicion: docente.condicion,
        regimenDedicacion: docente.regimenDedicacion,
        tipoContrato: docente.tipoContrato,
        horas_maximas_semanales: docente.horas_maximas_semanales,
      });

      const slotsDisponibles: Array<{ dia: number; horaInicio: string; horaFin: string }> = [];

      for (const dia of dias) {
        for (const horaInicio of horas) {
          const h = parseInt(horaInicio.split(':')[0]);
          if (h >= 7 && h <= 20 && dia >= 0 && dia <= 5) {
            const horaFin = `${String(h + 1).padStart(2, '0')}:00`;
            slotsDisponibles.push({ dia, horaInicio, horaFin });
          }
        }
      }

      const slotsSeleccionados = slotsDisponibles
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(horasMaximas || 40, slotsDisponibles.length));

      const setSeleccionado = new Set(slotsSeleccionados.map(s => `${s.dia}-${s.horaInicio}`));

      for (const dia of dias) {
        for (const horaInicio of horas) {
          const h = parseInt(horaInicio.split(':')[0]);
          const horaFin = `${String(h + 1).padStart(2, '0')}:00`;
          if (h >= 7 && h <= 20 && dia >= 0 && dia <= 5) {
            await prisma.disponibilidadDocente.create({
              data: {
                id_docente: docente.id_docente,
                id_periodo: periodo.id_periodo,
                dia_semana: dia,
                hora_inicio: horaInicio,
                hora_fin: horaFin,
                disponible: setSeleccionado.has(`${dia}-${horaInicio}`),
              },
            });
          }
        }
      }

      console.log(`✅ Disponibilidad para: ${docente.nombres} ${docente.apellidos} (Periodo: ${periodo.codigo}, Máx: ${horasMaximas}h)`);
    }
  }

  const totalDisponibilidad = await prisma.disponibilidadDocente.count();
  console.log(`✅ ${totalDisponibilidad} registros de disponibilidad sembrados.\n`);
  return totalDisponibilidad;
}
