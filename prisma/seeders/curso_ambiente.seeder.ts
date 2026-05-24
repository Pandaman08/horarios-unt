// prisma/seeders/08_curso_ambiente.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedCursoAmbiente(prisma: PrismaClient) {
  console.log('🌱 Sembrando relaciones Curso - Ambiente (según horarios reales 2025-II y 2026-I)...');

  // Obtener todos los cursos y ambientes para mapear códigos a IDs
  const cursos = await prisma.curso.findMany({
    select: { id_curso: true, codigo: true },
  });
  const ambientes = await prisma.ambiente.findMany({
    select: { id_ambiente: true, codigo: true },
  });

  const cursoMap = new Map<string, number>();
  cursos.forEach(c => cursoMap.set(c.codigo, c.id_curso));

  const ambienteMap = new Map<string, number>();
  ambientes.forEach(a => ambienteMap.set(a.codigo, a.id_ambiente));

  // Relaciones reales extraídas de los horarios
  // Cada entrada: { cursoCodigo, ambienteCodigo, tipoClase }
  const relaciones: { cursoCodigo: string; ambienteCodigo: string; tipoClase: 'teoria' | 'laboratorio' }[] = [
    // ==================== 2025-II ====================
    // Ciclo II
    { cursoCodigo: 'EE-201', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-201', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EG-202', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EG-203', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EG-201', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EG-206', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' }, // Análisis Numérico
    { cursoCodigo: 'EG-205', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EG-205', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },

    // Ciclo IV
    { cursoCodigo: 'EE-401', ambienteCodigo: 'EPG-205', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-401', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-401', ambienteCodigo: 'EPG-205', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-401', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-402', ambienteCodigo: 'EPG-205', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-402', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-403', ambienteCodigo: 'EPG-205', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-403', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-403', ambienteCodigo: 'EPG-205', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-403', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-402', ambienteCodigo: 'EPG-205', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-402', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-402', ambienteCodigo: 'EPG-205', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-402', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-401', ambienteCodigo: 'EPG-205', tipoClase: 'teoria' },

    // Ciclo VI
    { cursoCodigo: 'EE-603', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-603', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-602', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-602', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-601', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-601', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-601', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-601', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-602', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-602', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-602', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-601', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },

    // Ciclo VIII
    { cursoCodigo: 'EL-802', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-802', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-805', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-805', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-804', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-804', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-801', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-801', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-803', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-803', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-802', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-802', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-801', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-801', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-801', ambienteCodigo: 'EPG-203', tipoClase: 'teoria' },

    // Ciclo X
    { cursoCodigo: 'EE-X03', ambienteCodigo: 'EPG-209', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-X03', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-X04', ambienteCodigo: 'EPG-209', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-X04', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EI-X01', ambienteCodigo: 'EPG-209', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-X02', ambienteCodigo: 'EPG-209', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-X02', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-X05', ambienteCodigo: 'EPG-209', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-X05', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-X01', ambienteCodigo: 'EPG-209', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-X01', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-X01', ambienteCodigo: 'EPG-209', tipoClase: 'teoria' },

    // ==================== 2026-I ====================
    // Ciclo I
    { cursoCodigo: 'EE-102', ambienteCodigo: 'A-307', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-102', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-101', ambienteCodigo: 'A-307', tipoClase: 'teoria' },
    { cursoCodigo: 'EG-103', ambienteCodigo: 'A-307', tipoClase: 'teoria' },
    { cursoCodigo: 'EG-101', ambienteCodigo: 'A-307', tipoClase: 'teoria' },
    { cursoCodigo: 'EG-102', ambienteCodigo: 'A-307', tipoClase: 'teoria' },
    { cursoCodigo: 'EG-104', ambienteCodigo: 'A-307', tipoClase: 'teoria' },
    { cursoCodigo: 'EG-105', ambienteCodigo: 'A-307', tipoClase: 'teoria' },

    // Ciclo III
    { cursoCodigo: 'EE-301', ambienteCodigo: 'A-303', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-301', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-302', ambienteCodigo: 'A-303', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-302', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-301', ambienteCodigo: 'A-303', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-301', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-304', ambienteCodigo: 'A-303', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-304', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-303', ambienteCodigo: 'A-303', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-303', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-301', ambienteCodigo: 'A-303', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-305', ambienteCodigo: 'A-303', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-305', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-302', ambienteCodigo: 'A-303', tipoClase: 'teoria' },

    // Ciclo V
    { cursoCodigo: 'EE-502', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-502', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-504', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-504', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-502', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-502', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-501', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-501', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-503', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-503', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-501', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-501', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-502', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-502', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-501', ambienteCodigo: 'EPG-202', tipoClase: 'teoria' },
    { cursoCodigo: 'EP-501', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },

    // Ciclo VII
    { cursoCodigo: 'EE-704', ambienteCodigo: 'A-301', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-704', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-703', ambienteCodigo: 'A-301', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-703', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EL-702', ambienteCodigo: 'A-301', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-702', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-701', ambienteCodigo: 'A-301', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-701', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EI-701', ambienteCodigo: 'A-301', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-701', ambienteCodigo: 'A-301', tipoClase: 'teoria' },
    { cursoCodigo: 'EL-701', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EE-702', ambienteCodigo: 'A-301', tipoClase: 'teoria' },
    { cursoCodigo: 'EE-702', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio' },
    { cursoCodigo: 'EP-701', ambienteCodigo: 'A-301', tipoClase: 'teoria' },
  ];

  let insertados = 0;
  let errores = 0;

  for (const rel of relaciones) {
    const idCurso = cursoMap.get(rel.cursoCodigo);
    const idAmbiente = ambienteMap.get(rel.ambienteCodigo);
    if (!idCurso) {
      console.error(`❌ Curso no encontrado: ${rel.cursoCodigo}`);
      errores++;
      continue;
    }
    if (!idAmbiente) {
      console.error(`❌ Ambiente no encontrado: ${rel.ambienteCodigo}`);
      errores++;
      continue;
    }
    try {
      await prisma.cursoAmbiente.upsert({
        where: {
          id_curso_id_ambiente_tipo_clase: {
            id_curso: idCurso,
            id_ambiente: idAmbiente,
            tipo_clase: rel.tipoClase,
          },
        },
        update: {},
        create: {
          id_curso: idCurso,
          id_ambiente: idAmbiente,
          tipo_clase: rel.tipoClase,
        },
      });
      insertados++;
    } catch (error) {
      console.error(`❌ Error insertando relación ${rel.cursoCodigo} - ${rel.ambienteCodigo} (${rel.tipoClase}):`, error);
      errores++;
    }
  }

  console.log(`✅ ${insertados} relaciones curso-ambiente insertadas/actualizadas. Errores: ${errores}`);
  return { insertados, errores };
}