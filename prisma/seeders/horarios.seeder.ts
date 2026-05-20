import { PrismaClient } from '@prisma/client';

export async function seedHorarios(prisma: PrismaClient, data: { periodo: any, docentes: any[], cursos: any[], ambientes: any[], ciclos: any[] }) {
  console.log('-> Sembrando Asignaciones y Grupos...');
  const { periodo, docentes, cursos, ambientes, ciclos } = data;

  for (const curso of cursos) {
    // Crear Grupo A para cada curso
    const grupo = await prisma.grupo.upsert({
      where: {
        id_curso_codigo_grupo_id_periodo: {
          id_curso: curso.id_curso,
          codigo_grupo: 'A',
          id_periodo: periodo.id_periodo
        }
      },
      update: { id_ciclo: curso.id_ciclo },
      create: {
        id_curso: curso.id_curso,
        id_periodo: periodo.id_periodo,
        id_ciclo: curso.id_ciclo,
        codigo_grupo: 'A',
        capacidad_maxima: 40
      }
    });

    // Asignar docente aleatorio al curso (DocenteCurso)
    const docente = docentes[Math.floor(Math.random() * docentes.length)];
    await prisma.docenteCurso.upsert({
      where: {
        id_docente_id_curso_tipo_clase: {
          id_docente: docente.id_docente,
          id_curso: curso.id_curso,
          tipo_clase: 'teoria'
        }
      },
      update: {},
      create: {
        id_docente: docente.id_docente,
        id_curso: curso.id_curso,
        tipo_clase: 'teoria',
        prioridad: 1
      }
    });

    // Crear HorarioAsignado para el curso (Lunes 8-10)
    const ambiente = ambientes.find(a => a.tipo === 'teoria') || ambientes[0];
    await prisma.horarioAsignado.create({
      data: {
        id_docente: docente.id_docente,
        id_curso: curso.id_curso,
        id_grupo: grupo.id_grupo,
        id_ambiente: ambiente.id_ambiente,
        id_periodo: periodo.id_periodo,
        dia_semana: 1, // Lunes
        hora_inicio: '08:00',
        hora_fin: '10:00',
        tipo_clase: 'teoria',
        estado: 'confirmado'
      }
    });
  }

  // Generar algunos conflictos
  console.log('-> Sembrando Conflictos...');
  await prisma.conflictoHorario.create({
    data: {
      id_periodo: periodo.id_periodo,
      tipo_conflicto: 'cruce_ambiente',
      descripcion: 'Cruce detectado en Aula 101 el Lunes a las 08:00',
      id_ambiente: ambientes[0].id_ambiente,
      dia_semana: 1,
      hora_inicio: '08:00',
      resuelto: false
    }
  });

  return true;
}
