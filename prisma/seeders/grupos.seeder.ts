// prisma/seeders/09_grupos.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedGrupos(prisma: PrismaClient) {
  console.log('🌱 Sembrando Grupos (secciones) para los períodos 2025-II y 2026-I...');

  // Obtener períodos
  const periodo2025_II = await prisma.periodoAcademico.findUnique({
    where: { codigo: '2025-II' },
  });
  const periodo2026_I = await prisma.periodoAcademico.findUnique({
    where: { codigo: '2026-I' },
  });

  if (!periodo2025_II || !periodo2026_I) {
    throw new Error('❌ No se encontraron los períodos 2025-II y/o 2026-I. Ejecuta primero 02_periodos.seeder.ts');
  }

  // Obtener todos los cursos con su ciclo
  const cursos = await prisma.curso.findMany({
    include: { ciclo_rel: true },
  });

  // Agrupar cursos por ciclo
  const cursosPorCiclo: Record<number, typeof cursos> = {};
  for (const curso of cursos) {
    if (curso.ciclo_rel) {
      const cicloNum = curso.ciclo_rel.numero;
      if (!cursosPorCiclo[cicloNum]) cursosPorCiclo[cicloNum] = [];
      cursosPorCiclo[cicloNum].push(curso);
    } else {
      console.warn(`⚠️ Curso ${curso.codigo} no tiene ciclo asignado. Se omitirá.`);
    }
  }

  // Definir qué grupos crear por curso (casos especiales con dos secciones)
  // Basado en los horarios: Ciclo X tiene secciones A y B para algunos cursos
  const cursosConDosGrupos = new Set<string>([
    'EI-X01', // Trabajo de Investigación (secciones A y B)
    'EE-X05', // Prácticas Preprofesionales
    // Agrega aquí otros cursos que tengan dos secciones
  ]);

  let gruposCreados = 0;

  // Función auxiliar para crear grupos para un período y lista de ciclos
  async function crearGruposParaPeriodo(
    periodo: { id_periodo: number },
    ciclosPermitidos: number[],
    nombrePeriodo: string
  ) {
    console.log(`\n📅 Procesando período ${nombrePeriodo} (ciclos ${ciclosPermitidos.join(', ')})...`);
    for (const cicloNum of ciclosPermitidos) {
      const cursosDelCiclo = cursosPorCiclo[cicloNum] || [];
      if (cursosDelCiclo.length === 0) continue;

      console.log(`  🌀 Ciclo ${cicloNum}: ${cursosDelCiclo.length} cursos`);

      for (const curso of cursosDelCiclo) {
        const tieneDosGrupos = cursosConDosGrupos.has(curso.codigo);
        const gruposACrear = tieneDosGrupos ? ['A', 'B'] : ['A'];

        for (const letraGrupo of gruposACrear) {
          const codigoGrupo = letraGrupo;
          try {
            await prisma.grupo.upsert({
              where: {
                id_curso_codigo_grupo_id_periodo: {
                  id_curso: curso.id_curso,
                  codigo_grupo: codigoGrupo,
                  id_periodo: periodo.id_periodo,
                },
              },
              update: {},
              create: {
                id_curso: curso.id_curso,
                id_periodo: periodo.id_periodo,
                id_ciclo: curso.id_ciclo,
                codigo_grupo: codigoGrupo,
                capacidad_maxima: 40,
                cantidad_matriculados: 0,
                activo: true,
              },
            });
            gruposCreados++;
            console.log(`    ✅ Grupo ${codigoGrupo} - ${curso.codigo} (${curso.nombre})`);
          } catch (error) {
            console.error(`    ❌ Error creando grupo ${codigoGrupo} para ${curso.codigo}:`, error);
          }
        }
      }
    }
  }

  // Crear grupos para 2025-II (ciclos pares)
  await crearGruposParaPeriodo(periodo2025_II, [2, 4, 6, 8, 10], '2025-II');

  // Crear grupos para 2026-I (ciclos impares)
  await crearGruposParaPeriodo(periodo2026_I, [1, 3, 5, 7, 9], '2026-I');

  console.log(`\n✅ Total de grupos creados/actualizados: ${gruposCreados}`);
  return gruposCreados;
}