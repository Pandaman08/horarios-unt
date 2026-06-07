// prisma/seeders/carga_lectiva_completa.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedCargaLectivaCompleta(prisma: PrismaClient) {
  console.log('🌱 Sembrando Carga Lectiva COMPLETA por ciclos...');

  // Obtener período activo (2026-I)
  const periodo = await prisma.periodoAcademico.findUnique({
    where: { codigo: '2026-I' },
  });

  if (!periodo) {
    throw new Error('❌ No se encontró el período 2026-I');
  }

  // Obtener docentes y cursos
  const docentes = await prisma.docente.findMany({
    include: { usuario: true },
  });
  const cursos = await prisma.curso.findMany();

  // Mapear nombres de docentes a IDs
  const docenteMap = new Map<string, number>();
  for (const docente of docentes) {
    const nombreCompleto = `${docente.nombres} ${docente.apellidos}`.toUpperCase();
    docenteMap.set(nombreCompleto, docente.id_docente);
    // También mapear con formato "apellidos, nombres" por si acaso
    const nombreFormato2 = `${docente.apellidos}, ${docente.nombres}`.toUpperCase();
    docenteMap.set(nombreFormato2, docente.id_docente);
  }

  // Mapear nombres de cursos a IDs
  const cursoMap = new Map<string, number>();
  for (const curso of cursos) {
    cursoMap.set(curso.nombre.toUpperCase(), curso.id_curso);
  }

  // Datos completos por ciclo
  const datosPorCiclo = [
    // ==================== CICLO I ====================
    {
      ciclo: 'I',
      asignaciones: [
        { docente: 'MARCELINO TORRES VILLANUEVA', curso: 'INTRODUCCIÓN A LA PROGRAMACIÓN', T: 2, P: 0, L: 2, gruposLab: 2 },
        { docente: 'ALBERTO CARLOS MENDOZA DE LOS SANTOS', curso: 'INTRODUCCIÓN A LA ING. DE SISTEMAS', T: 1, P: 2, L: 0, gruposLab: 0 },
        { docente: 'PAUL COTRINA CASTELLANOS', curso: 'INTRODUCCIÓN A LA PROGRAMACIÓN', T: 0, P: 0, L: 2, gruposLab: 2 },
        { docente: 'BERTHA URTECHO ZAVALETA', curso: 'DESARROLLO PERSONAL', T: 2, P: 2, L: 0, gruposLab: 0 },
        { docente: 'JOSE LUIS PONTE BEJARANO', curso: 'DESARROLLO DEL PENSAMIENTO LÓGICO MATEMÁTICO', T: 1, P: 4, L: 0, gruposLab: 0 },
        { docente: 'JORGE LUIS RIOS GONZALES', curso: 'LECTURA CRÍTICA Y REDACCIÓN DE TEXTOS ACADÉMICOS', T: 2, P: 2, L: 0, gruposLab: 0 },
        { docente: 'SEGUNDA GUBAR OBESO', curso: 'INTRODUCCIÓN AL ANÁLISIS MATEMÁTICO', T: 2, P: 4, L: 0, gruposLab: 0 },
        { docente: 'MIGUEL IPANAQUE ZAPATA', curso: 'ESTADÍSTICA GENERAL', T: 0, P: 2, L: 0, gruposLab: 0 },
        { docente: 'MARTHA CARDOSO', curso: 'ESTADÍSTICA GENERAL', T: 2, P: 2, L: 0, gruposLab: 0 },
      ]
    },
    // ==================== CICLO III ====================
    {
      ciclo: 'III',
      asignaciones: [
        { docente: 'ZORAIDA YANET VIDAL MELGAREJO', curso: 'PROGRAMACIÓN ORIENTADA A OBJETOS II', T: 2, P: 0, L: 4, gruposLab: 3 },
        { docente: 'EVERSON DAVID AGREDA GAMBOA', curso: 'SISTÉMICA', T: 2, P: 1, L: 2, gruposLab: 3 },
        { docente: 'JUAN CARLOS OBANDO ROLDÁN', curso: 'INGENIERÍA GRÁFICA', T: 1, P: 1, L: 2, gruposLab: 3 },
        { docente: 'MARCOS FERRER REYNA', curso: 'MATEMÁTICA APLICADA I', T: 1, P: 2, L: 2, gruposLab: 1 },
        { docente: 'TERESITA ROJAS GARCÍA', curso: 'ESTADÍSTICA APLICADA', T: 1, P: 2, L: 2, gruposLab: 3 },
        { docente: 'JUAN CARRASCAL CABANILLAS', curso: 'ADMINISTRACIÓN GENERAL', T: 2, P: 2, L: 0, gruposLab: 0 },
        { docente: 'VILMA MENDEZ GIL', curso: 'FÍSICA ELECTRÓNICA', T: 1, P: 2, L: 2, gruposLab: 1 },
        { docente: 'SHEYLA LAURA ESCOBEDO RODRÍGUEZ', curso: 'PSICOLOGÍA ORGANIZACIONAL', T: 2, P: 2, L: 0, gruposLab: 0 },
      ]
    },
    // ==================== CICLO V ====================
    {
      ciclo: 'V',
      asignaciones: [
        { docente: 'LUIS ENRIQUE BOY CHAVIL', curso: 'INGENIERÍA DE DATOS I', T: 2, P: 1, L: 3, gruposLab: 3 },
        { docente: 'JUAN CARLOS OBANDO ROLDÁN', curso: 'SISTEMAS DE INFORMACIÓN', T: 2, P: 2, L: 2, gruposLab: 3 },
        { docente: 'EVERSON DAVID AGREDA GAMBOA', curso: 'TRANSFORMACIÓN DIGITAL', T: 2, P: 0, L: 2, gruposLab: 2 },
        { docente: 'ROBERT JERRY SÁNCHEZ TICONA', curso: 'TECNOLOGÍAS WEB', T: 1, P: 1, L: 2, gruposLab: 3 },
        { docente: 'CÉSAR AUGUSTO ARELLANO SALAZAR', curso: 'ARQUITECTURA Y ORGANIZACIÓN DE COMPUTADORAS', T: 1, P: 2, L: 2, gruposLab: 3 },
        { docente: 'CAMILO ERNESTO SUÁREZ REBAZA', curso: 'TELEINFORMÁTICA', T: 1, P: 2, L: 2, gruposLab: 2 },

      ]
    },
    // ==================== CICLO VII ====================
    {
      ciclo: 'VII',
      asignaciones: [
        { docente: 'JUAN PEDRO SANTOS FERNÁNDEZ', curso: 'INGENIERÍA DEL SOFTWARE I', T: 2, P: 1, L: 3, gruposLab: 1 },
        { docente: 'CÉSAR AUGUSTO ARELLANO SALAZAR', curso: 'REDES Y COMUNICACIONES I', T: 1, P: 1, L: 3, gruposLab: 3 },
        { docente: 'ROBERT JERRY SÁNCHEZ TICONA', curso: 'INGENIERÍA DEL SOFTWARE I', T: 0, P: 0, L: 2, gruposLab: 3 },
        { docente: 'EVERSON DAVID AGREDA GAMBOA', curso: 'NEGOCIOS ELECTRÓNICOS', T: 2, P: 0, L: 0, gruposLab: 0 },
        { docente: 'ALBERTO CARLOS MENDOZA DE LOS SANTOS', curso: 'GESTIÓN DE SERVICIOS DE TIC', T: 1, P: 2, L: 2, gruposLab: 2 },
        { docente: 'PAUL COTRINA CASTELLANOS', curso: 'METODOLOGÍA DE LA INVESTIGACIÓN CIENTÍFICA', T: 2, P: 2, L: 0, gruposLab: 0 },
        { docente: 'RICARDO DARÍO MENDOZA RIVERA', curso: 'ADMINISTRACIÓN DE BASE DE DATOS', T: 1, P: 1, L: 3, gruposLab: 2 },
        { docente: 'OSCAR ROMEL ALCÁNTARA MORENO', curso: 'PLANEAMIENTO ESTRATÉGICO DE LA INFORMACIÓN', T: 1, P: 2, L: 2, gruposLab: 4 },
        { docente: 'PAUL COTRINA CASTELLANOS', curso: 'NEGOCIOS ELECTRÓNICOS', T: 0, P: 0, L: 2, gruposLab: 2 },
      ]
    },
    // ==================== CICLO IX ====================
    {
      ciclo: 'IX',
      asignaciones: [
        { docente: 'JUAN PEDRO SANTOS FERNÁNDEZ', curso: 'TESIS I', T: 2, P: 2, L: 2, gruposLab: 1 },
        { docente: 'RICARDO DARÍO MENDOZA RIVERA', curso: 'TESIS I', T: 2, P: 2, L: 2, gruposLab: 1 },
        { docente: 'RICARDO DARÍO MENDOZA RIVERA', curso: 'ANALÍTICA DE NEGOCIOS', T: 1, P: 2, L: 2, gruposLab: 1 },
        { docente: 'ALBERTO CARLOS MENDOZA DE LOS SANTOS', curso: 'AUDITORÍA INFORMÁTICA', T: 1, P: 2, L: 2, gruposLab: 2 },
        { docente: 'JOSÉ ALBERTO GÓMEZ ÁVILA', curso: 'GESTIÓN DE PROYECTOS DE TIC', T: 1, P: 2, L: 2, gruposLab: 3 },
        { docente: 'MARCELINO TORRES VILLANUEVA', curso: 'INGENIERÍA WEB', T: 1, P: 1, L: 3, gruposLab: 3 },
        { docente: 'JOSÉ ALBERTO GÓMEZ ÁVILA', curso: 'COMPUTACIÓN EN LA NUBE', T: 1, P: 1, L: 3, gruposLab: 3 },
        { docente: 'CAMILO ERNESTO SUÁREZ REBAZA', curso: 'HACKEo ÉTICO', T: 2, P: 0, L: 2, gruposLab: 2 },
      ]
    },
  ];

  let totalAsignaciones = 0;

  // Procesar cada ciclo
  for (const cicloData of datosPorCiclo) {
    console.log(`\n📚 Procesando Ciclo ${cicloData.ciclo}...`);
    
    for (const asignacion of cicloData.asignaciones) {
      // Buscar docente
      let idDocente: number | null = null;
      for (const [nombre, id] of docenteMap.entries()) {
        if (nombre.includes(asignacion.docente) || asignacion.docente.includes(nombre)) {
          idDocente = id;
          break;
        }
      }
      
      // Buscar curso
      let idCurso: number | null = null;
      for (const [nombre, id] of cursoMap.entries()) {
        if (nombre.includes(asignacion.curso) || asignacion.curso.includes(nombre)) {
          idCurso = id;
          break;
        }
      }

      if (!idDocente) {
        console.warn(`⚠️ Docente no encontrado: ${asignacion.docente}`);
        continue;
      }
      if (!idCurso) {
        console.warn(`⚠️ Curso no encontrado: ${asignacion.curso}`);
        continue;
      }

      // Primero, buscar o crear declaración de carga horaria para este docente y período
      let declaracion = await prisma.declaracionHoraria.findFirst({
        where: { id_docente: idDocente, id_periodo: periodo.id_periodo }
      });

      if (!declaracion) {
        // Obtener datos del docente para la declaración
        const docente = docentes.find(d => d.id_docente === idDocente);
        declaracion = await prisma.declaracionHoraria.create({
          data: {
            id_docente: idDocente,
            id_periodo: periodo.id_periodo,
            ibm: docente?.codigo_docente || 'IBM001',
            condicion: docente?.modalidad === 'nombrado' ? 'Nombrado' : 'Contratado',
            categoria: docente?.categoria || 'Auxiliar',
            dedicacion: 'Tiempo Completo 40 h',
            horas_dedicacion: 40,
            estado: 'BORRADOR',
          }
        });
      }

      // Crear carga lectiva para TEORÍA si hay horas
      if (asignacion.T > 0) {
        await prisma.cargaLectiva.create({
          data: {
            id_declaracion: declaracion.id_declaracion,
            id_curso: idCurso,
            tipo_clase: 'teoria',
            horas_semanales: asignacion.T,
            grupos_asignados: 1, // Teoría siempre es 1 grupo
          }
        });
        totalAsignaciones++;
      }

      // Crear carga lectiva para PRÁCTICA si hay horas
      if (asignacion.P > 0) {
        await prisma.cargaLectiva.create({
          data: {
            id_declaracion: declaracion.id_declaracion,
            id_curso: idCurso,
            tipo_clase: 'practica',
            horas_semanales: asignacion.P,
            grupos_asignados: 1, // Prácticas comparten aula con teoría → 1 grupo
          }
        });
        totalAsignaciones++;
      }

      // Crear carga lectiva para LABORATORIO si hay horas
      if (asignacion.L > 0) {
        await prisma.cargaLectiva.create({
          data: {
            id_declaracion: declaracion.id_declaracion,
            id_curso: idCurso,
            tipo_clase: 'laboratorio',
            horas_semanales: asignacion.L,
            grupos_asignados: asignacion.gruposLab,
          }
        });
        totalAsignaciones++;
      }

      console.log(`✅ Asignado: ${asignacion.docente} - ${asignacion.curso} (T:${asignacion.T} P:${asignacion.P} L:${asignacion.L})`);
    }
  }

  console.log(`\n🎉 Total de ${totalAsignaciones} cargas lectivas sembradas!`);
  return totalAsignaciones;
}
