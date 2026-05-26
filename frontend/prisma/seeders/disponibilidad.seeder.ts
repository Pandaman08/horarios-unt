// prisma/seeders/disponibilidad.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedDisponibilidad(prisma: PrismaClient) {
  console.log('🌱 Sembrando Disponibilidad de Docentes...');

  // Obtener docentes y periodos
  const docentes = await prisma.docente.findMany();
  const periodos = await prisma.periodoAcademico.findMany();

  // Rango de horas (07:00 a 21:00, bloques de 1 hora)
  const horas = [
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00'
  ];

  // Días de la semana (0: Lunes a 5: Sábado)
  const dias = [0, 1, 2, 3, 4, 5];

  // Patrones de disponibilidad para cada docente
  const patronesDisponibilidad = [
    // Patrón 1: Mañana (07:00-13:00) - Lunes a Viernes
    (dia: number, hora: string) => {
      if (dia >= 0 && dia <= 4) { // Lunes-Viernes
        const h = parseInt(hora.split(':')[0]);
        return h >= 7 && h <= 12;
      }
      return false;
    },
    // Patrón 2: Tarde (13:00-19:00) - Lunes a Viernes
    (dia: number, hora: string) => {
      if (dia >= 0 && dia <= 4) { // Lunes-Viernes
        const h = parseInt(hora.split(':')[0]);
        return h >= 13 && h <= 18;
      }
      return false;
    },
    // Patrón 3: Mañana + Tarde (07:00-19:00) - Lunes a Viernes
    (dia: number, hora: string) => {
      if (dia >= 0 && dia <= 4) { // Lunes-Viernes
        const h = parseInt(hora.split(':')[0]);
        return h >= 7 && h <= 18;
      }
      return false;
    },
    // Patrón 4: Lunes, Miércoles, Viernes (07:00-12:00)
    (dia: number, hora: string) => {
      if (dia === 0 || dia === 2 || dia === 4) {
        const h = parseInt(hora.split(':')[0]);
        return h >= 7 && h <= 11;
      }
      return false;
    },
    // Patrón 5: Martes, Jueves (13:00-18:00)
    (dia: number, hora: string) => {
      if (dia === 1 || dia === 3) {
        const h = parseInt(hora.split(':')[0]);
        return h >= 13 && h <= 17;
      }
      return false;
    },
    // Patrón 6: Todo el día (07:00-21:00) - Lunes a Sábado
    (dia: number, hora: string) => {
      if (dia >= 0 && dia <= 5) { // Lunes a Sábado
        const h = parseInt(hora.split(':')[0]);
        return h >= 7 && h <= 20;
      }
      return false;
    },
    // Patrón 7: Lunes a Viernes + Sábado por la mañana
    (dia: number, hora: string) => {
      const h = parseInt(hora.split(':')[0]);
      if (dia >= 0 && dia <= 4) { // Lunes-Viernes
        return h >= 8 && h <= 17;
      }
      if (dia === 5) { // Sábado
        return h >= 8 && h <= 12;
      }
      return false;
    },
  ];

  // Asignar disponibilidad para cada docente en cada período
  for (const periodo of periodos) {
    for (let i = 0; i < docentes.length; i++) {
      const docente = docentes[i];
      
      // Seleccionar un patrón de disponibilidad (rotando entre los patrones)
      const patron = patronesDisponibilidad[i % patronesDisponibilidad.length];

      // Generar disponibilidad para cada día y hora
      for (const dia of dias) {
        for (const horaInicio of horas) {
          const horaFin = `${String(parseInt(horaInicio.split(':')[0]) + 1).padStart(2, '0')}:00`;
          
          const disponible = patron(dia, horaInicio);

          await prisma.disponibilidadDocente.create({
            data: {
              id_docente: docente.id_docente,
              id_periodo: periodo.id_periodo,
              dia_semana: dia,
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              disponible: disponible,
            },
          });
        }
      }

      console.log(`✅ Disponibilidad para: ${docente.nombres} ${docente.apellidos} (Periodo: ${periodo.codigo})`);
    }
  }

  const totalDisponibilidad = await prisma.disponibilidadDocente.count();
  console.log(`✅ ${totalDisponibilidad} registros de disponibilidad sembrados.\n`);
  return totalDisponibilidad;
}
