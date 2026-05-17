import { ValidadorHorario, SolicitudAsignacion } from '../src/services/horarios/ValidadorHorario';
import { prisma } from '../src/lib/prisma';

async function test() {
  console.log('--- Iniciando Prueba de Validaciones ---');

  // Obtener datos reales de la BD
  const periodo = await prisma.periodoAcademico.findFirst({ where: { codigo: '2026-I' } });
  const docente = await prisma.docente.findFirst({ where: { codigo_docente: '1001' } });
  const curso = await prisma.curso.findFirst({ where: { codigo: 'ISW01' } });
  const ambiente = await prisma.ambiente.findFirst({ where: { codigo: 'S101' } });

  if (!periodo || !docente || !curso || !ambiente) {
    console.error('No se encontraron datos base para la prueba. Asegúrate de haber ejecutado el seed.');
    return;
  }

  // Asegurar que el docente pueda dictar el curso (para evitar error de CURSO_NO_ASIGNABLE)
  await prisma.docenteCurso.upsert({
    where: { 
      id_docente_id_curso_tipo_clase: {
        id_docente: docente.id_docente,
        id_curso: curso.id_curso,
        tipo_clase: 'teoria'
      }
    },
    update: { activo: true },
    create: {
      id_docente: docente.id_docente,
      id_curso: curso.id_curso,
      tipo_clase: 'teoria',
      activo: true
    }
  });

  // Asegurar que el ambiente sea válido para el curso
  await prisma.cursoAmbiente.upsert({
    where: {
      id_curso_id_ambiente_tipo_clase: {
        id_curso: curso.id_curso,
        id_ambiente: ambiente.id_ambiente,
        tipo_clase: 'teoria'
      }
    },
    update: {},
    create: {
      id_curso: curso.id_curso,
      id_ambiente: ambiente.id_ambiente,
      tipo_clase: 'teoria'
    }
  });

  // Asegurar que el grupo exista
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
      codigo_grupo: 'A',
      id_periodo: periodo.id_periodo,
      capacidad_maxima: 40
    }
  });

  const solicitud: SolicitudAsignacion = {
    docenteId: docente.id_docente,
    cursoId: curso.id_curso,
    grupoId: grupo.id_grupo,
    tipoClase: 'teoria',
    ambienteId: ambiente.id_ambiente,
    diaSemana: 1,
    horaInicio: '08:00',
    horaFin: '10:00',
    periodoId: periodo.id_periodo
  };

  console.log('1. Probando validación exitosa...');
  // Limpiar posibles asignaciones previas para este test
  await prisma.horarioAsignado.deleteMany({
    where: { id_docente: docente.id_docente, dia_semana: 1, id_periodo: periodo.id_periodo }
  });

  const res1 = await ValidadorHorario.validarAsignacion(solicitud);
  console.log('Resultado:', res1.valido ? '✅ Válido' : '❌ Inválido');
  if (res1.conflictos.length > 0) console.log('Conflictos:', res1.conflictos);

  console.log('\n2. Probando Cruce de Docente...');
  // Crear una asignación previa que cruce
  await prisma.horarioAsignado.create({
    data: {
      id_docente: docente.id_docente,
      id_curso: curso.id_curso,
      id_grupo: grupo.id_grupo,
      tipo_clase: 'teoria',
      id_ambiente: ambiente.id_ambiente,
      dia_semana: 1,
      hora_inicio: '09:00',
      hora_fin: '11:00',
      id_periodo: periodo.id_periodo,
      estado: 'confirmado'
    }
  });

  const res2 = await ValidadorHorario.validarAsignacion(solicitud);
  console.log('Resultado:', res2.valido ? '✅ Válido' : '❌ Inválido');
  const cruceDocente = res2.conflictos.find(c => c.tipo === 'CRUCE_DOCENTE');
  if (cruceDocente) console.log('✅ Detectado correctamente:', cruceDocente.mensaje);

  console.log('\n3. Verificando registro de conflicto en BD...');
  const conflictoDB = await prisma.conflictoHorario.findFirst({
    where: { tipo_conflicto: 'CRUCE_DOCENTE', id_docente_1: docente.id_docente },
    orderBy: { fecha_deteccion: 'desc' }
  });
  if (conflictoDB) {
    console.log('✅ Conflicto registrado en BD:', conflictoDB.descripcion);
  } else {
    console.error('❌ El conflicto no se registró en la BD');
  }

  console.log('\n--- Pruebas Finalizadas ---');
}

test()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
