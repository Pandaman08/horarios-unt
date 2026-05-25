// prisma/seeders/10_horarios.seeder.ts
import { PrismaClient } from '@prisma/client';

type TipoClase = 'teoria' | 'laboratorio' | 'practica';

type HorarioPlan = {
  periodoKey: string;
  cursoCodigo: string;
  docenteCodigo: string;
  ambienteCodigo: string;
  tipoClase: TipoClase;
  diaSemana: number; // 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado
  horaInicio: string;
  horaFin: string;
};

// Extracción completa de los horarios proporcionados
const horariosPlan: HorarioPlan[] = [
  // =========================================================
  // 2025-II (Ciclos pares) - SOLO SE GENERA SI EL PERÍODO ESTÁ ACTIVO
  // =========================================================

  // ---------------------- CICLO II -------------------------
  // Zoraida Yanet Vidal Melgarejo - Programación Orientada a Objetos I
  { periodoKey: '2025-II', cursoCodigo: 'EE-201', docenteCodigo: 'z18153095', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 0, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-201', docenteCodigo: 'z18153095', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-201', docenteCodigo: 'z18153095', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-201', docenteCodigo: 'z18153095', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },
  // Edgard Pelaez Vinces - Sociedad, Cultura y Ecología
  { periodoKey: '2025-II', cursoCodigo: 'EG-202', docenteCodigo: 'e99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-202', docenteCodigo: 'e99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  // Diego Llaro Cruz - Cultura Investigativa y Pensamiento Crítico
  { periodoKey: '2025-II', cursoCodigo: 'EG-203', docenteCodigo: 'd99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '17:00', horaFin: '18:00' },
  // Alex Herradas - Ética, Convivencia Humana y Ciudadanía
  { periodoKey: '2025-II', cursoCodigo: 'EG-201', docenteCodigo: 'a99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '16:00', horaFin: '17:00' },
  // Miltón Cortez - Análisis Numérico
  { periodoKey: '2025-II', cursoCodigo: 'EG-206', docenteCodigo: 'm99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  // Aristeres Tavara Aponte - Física General (Laboratorio)
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 'a99999999', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 'a99999999', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 'a99999999', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
  // Segundo Roseli Jauregui Rosas - Física General (Teoría y Práctica)
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 's99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 0, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 's99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 0, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 's99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 's99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },

  // ---------------------- CICLO IV -------------------------
  // Juan Carlos Obando Roldán - Diseño Web
  { periodoKey: '2025-II', cursoCodigo: 'EE-401', docenteCodigo: 'j18122605', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-401', docenteCodigo: 'j18122605', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-401', docenteCodigo: 'j18122605', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 2, horaInicio: '18:00', horaFin: '19:00' },
  // Robert Jerry Sánchez Ticona - Computación Gráfica y Visual (e)
  { periodoKey: '2025-II', cursoCodigo: 'EL-401', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-401', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  // César Arellano Salazar - Sistemas Digitales
  { periodoKey: '2025-II', cursoCodigo: 'EE-402', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-402', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-402', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-402', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '18:00', horaFin: '19:00' },
  // Marcelino Torres Villanueva - Estructura de Datos Orientado a Objetos
  { periodoKey: '2025-II', cursoCodigo: 'EE-403', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-403', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-403', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-403', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '09:00' },
  // Camilo Suárez Rebaza - Gestión de Procesos
  { periodoKey: '2025-II', cursoCodigo: 'EP-403', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-403', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-403', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  // Camilo Suárez Rebaza - Plataformas Tecnológicas (e)
  { periodoKey: '2025-II', cursoCodigo: 'EL-402', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '18:00', horaFin: '19:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-402', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 4, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-402', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 4, horaInicio: '19:00', horaFin: '20:00' },
  // José Alberto Gómez Ávila - Pensamiento del Diseño
  { periodoKey: '2025-II', cursoCodigo: 'EP-402', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-402', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-402', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-402', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 3, horaInicio: '16:00', horaFin: '17:00' },
  // Alberto Asmat Alva - Economía General
  { periodoKey: '2025-II', cursoCodigo: 'EP-401', docenteCodigo: 'a99999999', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },

  // =========================================================
  // 2026-I (Ciclos impares)
  // =========================================================

  // ---------------------- CICLO I -------------------------
  // Paul Cotrina Castellanos - Introducción a la Programación
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'p99999999', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '09:00' },
  // Marcelino Torres Villanueva - Introducción a la Programación
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'm17865408', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '07:00', horaFin: '09:00' },
  // Segundo Guibar Obeso - Introducción al Análisis Matemático
  { periodoKey: '2026-I', cursoCodigo: 'EG-104', docenteCodigo: 's99999999', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-104', docenteCodigo: 's99999999', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '11:00', horaFin: '12:00' },
  // Bertha Urtecho Zavaleta / Martha Cardoso - Estadística General
  // Asignamos a Bertha (b18165597) como principal
  { periodoKey: '2026-I', cursoCodigo: 'EG-105', docenteCodigo: 'b18165597', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '09:00', horaFin: '11:00' },
  // Jose Luis Ponte Bejarano - Desarrollo del Pensamiento Lógico Matemático
  { periodoKey: '2026-I', cursoCodigo: 'EG-101', docenteCodigo: 'j99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '09:00' },
  // Alberto Mendoza de los Santos - Introducción a la Ingeniería de Sistemas
  { periodoKey: '2026-I', cursoCodigo: 'EE-101', docenteCodigo: 'a17434055', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '12:00', horaFin: '13:00' },
  // Jorge Luis Rios Gonzales - Lectura Crítica y Redacción de Textos Académicos
  { periodoKey: '2026-I', cursoCodigo: 'EG-102', docenteCodigo: 'j99999999', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-102', docenteCodigo: 'j99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '09:00', horaFin: '10:00' },
  // Bertha Urtecho Zavaleta - Desarrollo Personal
  { periodoKey: '2026-I', cursoCodigo: 'EG-103', docenteCodigo: 'b18165597', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
];

export async function seedHorarios(prisma: PrismaClient) {
  console.log('🌱 Sembrando horarios asignados SOLO para PERÍODOS ACTIVOS...');

  // OBTENER SOLO LOS PERÍODOS ACTIVOS
  const periodosActivos = await prisma.periodoAcademico.findMany({
    where: { activo: true }
  });

  if (periodosActivos.length === 0) {
    console.log('⚠️ No hay períodos activos para sembrar horarios.');
    return { insertados: 0, errores: 0 };
  }

  console.log(`✅ Encontrados ${periodosActivos.length} período(s) activo(s):`);
  periodosActivos.forEach(p => console.log(`   - ${p.nombre} (${p.codigo})`));

  // Crear mapa de períodos por código
  const periodoMap = new Map(periodosActivos.map(p => [p.codigo, p]));

  // Obtener mapeos
  const docentes = await prisma.docente.findMany({ select: { id_docente: true, codigo_docente: true } });
  const cursos = await prisma.curso.findMany({ select: { id_curso: true, codigo: true } });
  const ambientes = await prisma.ambiente.findMany({ select: { id_ambiente: true, codigo: true } });
  const grupos = await prisma.grupo.findMany({
    include: { periodo: true, curso: true },
  });

  const docenteMap = new Map(docentes.map(d => [d.codigo_docente, d.id_docente]));
  const cursoMap = new Map(cursos.map(c => [c.codigo, c.id_curso]));
  const ambienteMap = new Map(ambientes.map(a => [a.codigo, a.id_ambiente]));

  const grupoMap = new Map<string, number>();
  for (const grupo of grupos) {
    const key = `${grupo.periodo.id_periodo}_${grupo.curso.codigo}_A`;
    grupoMap.set(key, grupo.id_grupo);
  }

  function getGrupoId(periodoId: number, cursoCodigo: string): number | null {
    return grupoMap.get(`${periodoId}_${cursoCodigo}_A`) || null;
  }

  // OBTENER LOS IDs DE LOS PERÍODOS ACTIVOS
  const idsPeriodosActivos = periodosActivos.map(p => p.id_periodo);

  // Limpiar horarios previos SOLO de períodos ACTIVOS
  await prisma.horarioAsignado.deleteMany({
    where: { id_periodo: { in: idsPeriodosActivos } },
  });

  // FILTRAR LOS HORARIOS PARA SOLO INCLUIR LOS DE PERÍODOS ACTIVOS
  const horariosParaGenerar = horariosPlan.filter(horario => {
    return periodoMap.has(horario.periodoKey);
  });

  console.log(`📋 Generando ${horariosParaGenerar.length} horarios para períodos activos...`);

  let totalInsertados = 0;
  let totalErrores = 0;

  for (const horario of horariosParaGenerar) {
    const periodo = periodoMap.get(horario.periodoKey);
    if (!periodo) continue; // Esto no debería pasar por el filtro anterior

    const idDocente = docenteMap.get(horario.docenteCodigo);
    const idCurso = cursoMap.get(horario.cursoCodigo);
    const idAmbiente = ambienteMap.get(horario.ambienteCodigo);
    const idGrupo = getGrupoId(periodo.id_periodo, horario.cursoCodigo);

    if (!idDocente) {
      console.error(`❌ Docente no encontrado: ${horario.docenteCodigo}`);
      totalErrores++;
      continue;
    }
    if (!idCurso) {
      console.error(`❌ Curso no encontrado: ${horario.cursoCodigo}`);
      totalErrores++;
      continue;
    }
    if (!idAmbiente) {
      console.error(`❌ Ambiente no encontrado: ${horario.ambienteCodigo}`);
      totalErrores++;
      continue;
    }
    if (!idGrupo) {
      console.error(`❌ Grupo no encontrado para curso ${horario.cursoCodigo} en período ${horario.periodoKey}`);
      totalErrores++;
      continue;
    }

    try {
      await prisma.horarioAsignado.create({
        data: {
          id_docente: idDocente,
          id_curso: idCurso,
          id_grupo: idGrupo,
          tipo_clase: horario.tipoClase,
          id_ambiente: idAmbiente,
          dia_semana: horario.diaSemana,
          hora_inicio: horario.horaInicio,
          hora_fin: horario.horaFin,
          id_periodo: periodo.id_periodo,
          estado: 'publicado',
        },
      });
      totalInsertados++;
    } catch (error) {
      console.error(`❌ Error insertando horario ${horario.cursoCodigo} (${horario.periodoKey}):`, error);
      totalErrores++;
    }
  }

  console.log(`✅ Total horarios insertados: ${totalInsertados}`);
  console.log(`❌ Total errores: ${totalErrores}`);
  return { insertados: totalInsertados, errores: totalErrores };
}
