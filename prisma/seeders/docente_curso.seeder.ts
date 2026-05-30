// prisma/seeders/07_docente_curso.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedDocenteCurso(prisma: PrismaClient) {
  console.log('🌱 Sembrando relaciones Docente - Curso (códigos = inicial + DNI)...');

  // Obtener todos los docentes y cursos para mapear códigos a IDs
  const docentes = await prisma.docente.findMany({
    select: { id_docente: true, codigo_docente: true },
  });
  const cursos = await prisma.curso.findMany({
    select: { id_curso: true, codigo: true },
  });

  const docenteMap = new Map<string, number>();
  docentes.forEach((d) => docenteMap.set(d.codigo_docente, d.id_docente));

  const cursoMap = new Map<string, number>();
  cursos.forEach((c) => cursoMap.set(c.codigo, c.id_curso));

  // Relaciones extraídas de los horarios 2025-II y 2026-I
  // Cada entrada: { docenteCodigo, cursoCodigo, tipoClase }
  const relaciones: { docenteCodigo: string; cursoCodigo: string; tipoClase: 'teoria' | 'laboratorio' | 'practica' }[] = [
    // ==================== 2025-II (Ciclos pares) ====================
    // Ciclo II
    { docenteCodigo: 'z18153095', cursoCodigo: 'EE-201', tipoClase: 'teoria' },        // Zoraida Yanet Vidal Melgarejo
    { docenteCodigo: 'z18153095', cursoCodigo: 'EE-201', tipoClase: 'laboratorio' },
    { docenteCodigo: 'e90000017', cursoCodigo: 'EG-202', tipoClase: 'teoria' },        // Edgard Pelaez Vinces
    { docenteCodigo: 'd90000018', cursoCodigo: 'EG-203', tipoClase: 'teoria' },        // Diego Llaro Cruz
    { docenteCodigo: 'a90000020', cursoCodigo: 'EG-201', tipoClase: 'teoria' },        // Alex Herradas
    { docenteCodigo: 'm90000021', cursoCodigo: 'EG-206', tipoClase: 'teoria' },        // Miltón Cortez (Análisis Numérico)
    { docenteCodigo: 'a90000022', cursoCodigo: 'EG-205', tipoClase: 'laboratorio' },   // Aristeres Tavara Aponte
    { docenteCodigo: 's90000016', cursoCodigo: 'EG-205', tipoClase: 'teoria' },        // Segundo Roseli Jauregui Rosas

    // Ciclo IV
    { docenteCodigo: 'j18122605', cursoCodigo: 'EE-401', tipoClase: 'teoria' },        // Juan Carlos Obando Roldán
    { docenteCodigo: 'j18122605', cursoCodigo: 'EE-401', tipoClase: 'laboratorio' },
    { docenteCodigo: 'r19082305', cursoCodigo: 'EL-401', tipoClase: 'teoria' },        // Robert Jerry Sánchez Ticona
    { docenteCodigo: 'r19082305', cursoCodigo: 'EL-401', tipoClase: 'laboratorio' },
    { docenteCodigo: 'c18147714', cursoCodigo: 'EE-402', tipoClase: 'teoria' },        // César Arellano Salazar
    { docenteCodigo: 'c18147714', cursoCodigo: 'EE-402', tipoClase: 'laboratorio' },
    { docenteCodigo: 'm17865408', cursoCodigo: 'EE-403', tipoClase: 'teoria' },        // Marcelino Torres Villanueva
    { docenteCodigo: 'm17865408', cursoCodigo: 'EE-403', tipoClase: 'laboratorio' },
    { docenteCodigo: 'c32978627', cursoCodigo: 'EP-403', tipoClase: 'teoria' },        // Camilo Ernesto Suárez Rebaza
    { docenteCodigo: 'c32978627', cursoCodigo: 'EP-403', tipoClase: 'laboratorio' },
    { docenteCodigo: 'c32978627', cursoCodigo: 'EL-402', tipoClase: 'teoria' },
    { docenteCodigo: 'c32978627', cursoCodigo: 'EL-402', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j40990648', cursoCodigo: 'EP-402', tipoClase: 'teoria' },        // José Alberto Gómez Ávila
    { docenteCodigo: 'j40990648', cursoCodigo: 'EP-402', tipoClase: 'laboratorio' },
    { docenteCodigo: 'a90000019', cursoCodigo: 'EP-401', tipoClase: 'teoria' },        // Alberto Asmat Alva

    // Ciclo VI
    { docenteCodigo: 'r19082305', cursoCodigo: 'EE-603', tipoClase: 'teoria' },
    { docenteCodigo: 'r19082305', cursoCodigo: 'EE-603', tipoClase: 'laboratorio' },
    { docenteCodigo: 'c18147714', cursoCodigo: 'EE-602', tipoClase: 'teoria' },
    { docenteCodigo: 'c18147714', cursoCodigo: 'EE-602', tipoClase: 'laboratorio' },
    { docenteCodigo: 'l18842081', cursoCodigo: 'EE-602', tipoClase: 'teoria' },        // Luis Enrique Boy Chavil
    { docenteCodigo: 'l18842081', cursoCodigo: 'EE-602', tipoClase: 'laboratorio' },
    { docenteCodigo: 'm17865408', cursoCodigo: 'EE-601', tipoClase: 'teoria' },
    { docenteCodigo: 'm17865408', cursoCodigo: 'EE-601', tipoClase: 'laboratorio' },
    { docenteCodigo: 'k90000023', cursoCodigo: 'EP-601', tipoClase: 'teoria' },        // Kevin Litman Florez Tolentino
    { docenteCodigo: 'k90000023', cursoCodigo: 'EP-601', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j90000015', cursoCodigo: 'EP-602', tipoClase: 'teoria' },        // Joe Alexis González Vásquez
    { docenteCodigo: 'j90000015', cursoCodigo: 'EP-602', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j90000024', cursoCodigo: 'EL-602', tipoClase: 'teoria' },        // Juan Cabanillas
    { docenteCodigo: 'l90000025', cursoCodigo: 'EL-601', tipoClase: 'teoria' },        // Luis Moncada Alvites

    // Ciclo VIII
    { docenteCodigo: 'j18122605', cursoCodigo: 'EL-802', tipoClase: 'teoria' },
    { docenteCodigo: 'j18122605', cursoCodigo: 'EL-802', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j17896289', cursoCodigo: 'EE-805', tipoClase: 'teoria' },        // Juan Pedro Santos Fernández
    { docenteCodigo: 'j17896289', cursoCodigo: 'EE-805', tipoClase: 'laboratorio' },
    { docenteCodigo: 'e18161457', cursoCodigo: 'EE-804', tipoClase: 'teoria' },        // Everson David Agreda Gamboa
    { docenteCodigo: 'e18161457', cursoCodigo: 'EE-804', tipoClase: 'laboratorio' },
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-801', tipoClase: 'teoria' },        // Alberto Carlos Mendoza de los Santos
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-801', tipoClase: 'laboratorio' },
    { docenteCodigo: 'r18070765', cursoCodigo: 'EE-803', tipoClase: 'teoria' },        // Ricardo Darío Mendoza Rivera
    { docenteCodigo: 'r18070765', cursoCodigo: 'EE-803', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j40990648', cursoCodigo: 'EE-802', tipoClase: 'teoria' },
    { docenteCodigo: 'j40990648', cursoCodigo: 'EE-802', tipoClase: 'laboratorio' },
    { docenteCodigo: 'o18126940', cursoCodigo: 'EP-801', tipoClase: 'teoria' },        // Oscar Romel Alcántara Moreno
    { docenteCodigo: 'o18126940', cursoCodigo: 'EP-801', tipoClase: 'laboratorio' },
    { docenteCodigo: 'm90000026', cursoCodigo: 'EL-801', tipoClase: 'teoria' },        // Marco Celi Arevalo

    // Ciclo X
    { docenteCodigo: 'e18161457', cursoCodigo: 'EE-X03', tipoClase: 'teoria' },
    { docenteCodigo: 'e18161457', cursoCodigo: 'EE-X03', tipoClase: 'laboratorio' },
    { docenteCodigo: 'r19082305', cursoCodigo: 'EE-X04', tipoClase: 'teoria' },
    { docenteCodigo: 'r19082305', cursoCodigo: 'EE-X04', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j17896289', cursoCodigo: 'EI-X01', tipoClase: 'teoria' },
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-X02', tipoClase: 'teoria' },
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-X02', tipoClase: 'laboratorio' },
    { docenteCodigo: 'r18070765', cursoCodigo: 'EI-X01', tipoClase: 'teoria' },
    { docenteCodigo: 'o18126940', cursoCodigo: 'EE-X05', tipoClase: 'teoria' },
    { docenteCodigo: 'o18126940', cursoCodigo: 'EE-X05', tipoClase: 'laboratorio' },
    { docenteCodigo: 'p90000001', cursoCodigo: 'EE-X01', tipoClase: 'teoria' },        // Jorge Paul Cotrina Castellanos
    { docenteCodigo: 'p90000001', cursoCodigo: 'EE-X01', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j90000015', cursoCodigo: 'EP-X01', tipoClase: 'teoria' },        // Joe Alexis González Vásquez (Responsabilidad Social)

    // ==================== 2026-I (Ciclos impares) ====================
    // Ciclo I
    { docenteCodigo: 'm17865408', cursoCodigo: 'EE-102', tipoClase: 'teoria' },
    { docenteCodigo: 'm17865408', cursoCodigo: 'EE-102', tipoClase: 'laboratorio' },
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-101', tipoClase: 'teoria' },
    { docenteCodigo: 'p90000001', cursoCodigo: 'EE-102', tipoClase: 'laboratorio' },   // Paul Cotrina Castellanos
    { docenteCodigo: 'b90000002', cursoCodigo: 'EG-103', tipoClase: 'teoria' },        // Bertha Urtecho Zavaleta
    { docenteCodigo: 'j90000003', cursoCodigo: 'EG-101', tipoClase: 'teoria' },        // Jose Luis Ponte Bejarano
    { docenteCodigo: 'j90000004', cursoCodigo: 'EG-102', tipoClase: 'teoria' },        // Jorge Luis Rios Gonzales
    { docenteCodigo: 's90000005', cursoCodigo: 'EG-104', tipoClase: 'teoria' },        // Segunda Gubar Obeso
    { docenteCodigo: 'm90000006', cursoCodigo: 'EG-105', tipoClase: 'teoria' },        // Miguel Ipanaque Zapata
    { docenteCodigo: 'm90000007', cursoCodigo: 'EG-105', tipoClase: 'teoria' },        // Martha Cardoso

    // Ciclo III
    { docenteCodigo: 'e18161457', cursoCodigo: 'EE-301', tipoClase: 'teoria' },
    { docenteCodigo: 'e18161457', cursoCodigo: 'EE-301', tipoClase: 'laboratorio' },
    { docenteCodigo: 'z18153095', cursoCodigo: 'EE-302', tipoClase: 'teoria' },
    { docenteCodigo: 'z18153095', cursoCodigo: 'EE-302', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j18122605', cursoCodigo: 'EL-301', tipoClase: 'teoria' },
    { docenteCodigo: 'j18122605', cursoCodigo: 'EL-301', tipoClase: 'laboratorio' },
    { docenteCodigo: 'm90000008', cursoCodigo: 'EP-303', tipoClase: 'teoria' },        // Marcos Ferrer Reyna
    { docenteCodigo: 'm90000008', cursoCodigo: 'EP-303', tipoClase: 'practica' },
    { docenteCodigo: 't90000009', cursoCodigo: 'EP-302', tipoClase: 'teoria' },        // Teresita Rojas García
    { docenteCodigo: 't90000009', cursoCodigo: 'EP-302', tipoClase: 'practica' },
    { docenteCodigo: 'j90000010', cursoCodigo: 'EP-301', tipoClase: 'teoria' },        // Juan Carrascal Cabanillas
    { docenteCodigo: 'v90000011', cursoCodigo: 'EP-304', tipoClase: 'teoria' },        // Vilma Mendez Gil
    { docenteCodigo: 'v90000011', cursoCodigo: 'EP-304', tipoClase: 'laboratorio' },
    { docenteCodigo: 's90000012', cursoCodigo: 'EL-302', tipoClase: 'teoria' },        // Sheyla Laura Escobedo Rodríguez

    // Ciclo V
    { docenteCodigo: 'l18842081', cursoCodigo: 'EE-502', tipoClase: 'teoria' },
    { docenteCodigo: 'l18842081', cursoCodigo: 'EE-502', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j18122605', cursoCodigo: 'EE-504', tipoClase: 'teoria' },
    { docenteCodigo: 'j18122605', cursoCodigo: 'EE-504', tipoClase: 'laboratorio' },
    { docenteCodigo: 'e18161457', cursoCodigo: 'EL-502', tipoClase: 'teoria' },
    { docenteCodigo: 'r19082305', cursoCodigo: 'EE-501', tipoClase: 'teoria' },
    { docenteCodigo: 'r19082305', cursoCodigo: 'EE-501', tipoClase: 'laboratorio' },
    { docenteCodigo: 'c18147714', cursoCodigo: 'EE-503', tipoClase: 'teoria' },
    { docenteCodigo: 'c18147714', cursoCodigo: 'EE-503', tipoClase: 'laboratorio' },
    { docenteCodigo: 'c32978627', cursoCodigo: 'EL-501', tipoClase: 'teoria' },
    { docenteCodigo: 'c32978627', cursoCodigo: 'EL-501', tipoClase: 'laboratorio' },
    { docenteCodigo: 'm90000013', cursoCodigo: 'EP-502', tipoClase: 'teoria' },        // Marcos Baca Lopez
    { docenteCodigo: 'a90000014', cursoCodigo: 'EP-501', tipoClase: 'teoria' },        // Ana Cuadra Mitzugaray

    // Ciclo VII
    { docenteCodigo: 'j17896289', cursoCodigo: 'EE-704', tipoClase: 'teoria' },
    { docenteCodigo: 'j17896289', cursoCodigo: 'EE-704', tipoClase: 'laboratorio' },
    { docenteCodigo: 'c18147714', cursoCodigo: 'EE-703', tipoClase: 'teoria' },
    { docenteCodigo: 'c18147714', cursoCodigo: 'EE-703', tipoClase: 'laboratorio' },
    { docenteCodigo: 'r19082305', cursoCodigo: 'EE-704', tipoClase: 'teoria' },
    { docenteCodigo: 'r19082305', cursoCodigo: 'EE-704', tipoClase: 'laboratorio' },
    { docenteCodigo: 'e18161457', cursoCodigo: 'EL-702', tipoClase: 'teoria' },
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-701', tipoClase: 'teoria' },
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-701', tipoClase: 'laboratorio' },
    { docenteCodigo: 'p90000001', cursoCodigo: 'EI-701', tipoClase: 'teoria' },        // Paul Cotrina Castellanos (Metodología)
    { docenteCodigo: 'r18070765', cursoCodigo: 'EL-701', tipoClase: 'teoria' },
    { docenteCodigo: 'r18070765', cursoCodigo: 'EL-701', tipoClase: 'laboratorio' },
    { docenteCodigo: 'o18126940', cursoCodigo: 'EE-702', tipoClase: 'teoria' },
    { docenteCodigo: 'o18126940', cursoCodigo: 'EE-702', tipoClase: 'laboratorio' },
    { docenteCodigo: 'j90000015', cursoCodigo: 'EP-701', tipoClase: 'teoria' },        // Jhoe Alexis González Vásquez (Cadena de Suministro)

    // ==================== CICLO IX (2026-I) ====================
    // 1. Juan Pedro Santos Fernández - Tesis I
    { docenteCodigo: 'j17896289', cursoCodigo: 'EI-901', tipoClase: 'teoria' },
    { docenteCodigo: 'j17896289', cursoCodigo: 'EI-901', tipoClase: 'laboratorio' },
    // 2. Ricardo Mendoza Rivera - Tesis I
    { docenteCodigo: 'r18070765', cursoCodigo: 'EI-901', tipoClase: 'teoria' },
    { docenteCodigo: 'r18070765', cursoCodigo: 'EI-901', tipoClase: 'laboratorio' },
    // 3. Ricardo Mendoza Rivera - Analítica de Negocios
    { docenteCodigo: 'r18070765', cursoCodigo: 'EE-903', tipoClase: 'teoria' },
    { docenteCodigo: 'r18070765', cursoCodigo: 'EE-903', tipoClase: 'laboratorio' },
    // 4. Alberto Mendoza de los Santos - Auditoría Informática
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-902', tipoClase: 'teoria' },
    { docenteCodigo: 'a17434055', cursoCodigo: 'EE-902', tipoClase: 'laboratorio' },
    // 5. José Gómez Ávila - Gestión de Proyectos de TI
    { docenteCodigo: 'j40990648', cursoCodigo: 'EE-901', tipoClase: 'teoria' },
    { docenteCodigo: 'j40990648', cursoCodigo: 'EE-901', tipoClase: 'laboratorio' },
    // 6. Oscar Romel Alcántara Moreno - Emprendimiento Tecnológico
    { docenteCodigo: 'o18126940', cursoCodigo: 'EL-901', tipoClase: 'teoria' },
    { docenteCodigo: 'o18126940', cursoCodigo: 'EL-901', tipoClase: 'laboratorio' },
    // 7. Marcelino Torres Villanueva - Ingeniería Web
    { docenteCodigo: 'm17865408', cursoCodigo: 'EE-905', tipoClase: 'teoria' },
    { docenteCodigo: 'm17865408', cursoCodigo: 'EE-905', tipoClase: 'laboratorio' },
    // 8. José Gómez Ávila - Computación en la Nube
    { docenteCodigo: 'j40990648', cursoCodigo: 'EE-904', tipoClase: 'teoria' },
    { docenteCodigo: 'j40990648', cursoCodigo: 'EE-904', tipoClase: 'laboratorio' },
    // 9. Camilo Suarez Rebaza - Hackeo Ético
    { docenteCodigo: 'c32978627', cursoCodigo: 'EL-902', tipoClase: 'teoria' },
    { docenteCodigo: 'c32978627', cursoCodigo: 'EL-902', tipoClase: 'laboratorio' },

  ];

  let insertados = 0;
  let errores = 0;

  for (const rel of relaciones) {
    const idDocente = docenteMap.get(rel.docenteCodigo);
    const idCurso = cursoMap.get(rel.cursoCodigo);
    if (!idDocente) {
      console.error(`❌ Docente no encontrado: ${rel.docenteCodigo}`);
      errores++;
      continue;
    }
    if (!idCurso) {
      console.error(`❌ Curso no encontrado: ${rel.cursoCodigo}`);
      errores++;
      continue;
    }
    try {
      await prisma.docenteCurso.upsert({
        where: {
          id_docente_id_curso_tipo_clase: {
            id_docente: idDocente,
            id_curso: idCurso,
            tipo_clase: rel.tipoClase,
          },
        },
        update: {},
        create: {
          id_docente: idDocente,
          id_curso: idCurso,
          tipo_clase: rel.tipoClase,
          experiencia_anios: 0,
          prioridad: 1,
          activo: true,
        },
      });
      insertados++;
    } catch (error) {
      console.error(`❌ Error insertando relación ${rel.docenteCodigo} - ${rel.cursoCodigo} (${rel.tipoClase}):`, error);
      errores++;
    }
  }

  console.log(`✅ ${insertados} relaciones docente-curso insertadas/actualizadas. Errores: ${errores}`);
  return { insertados, errores };
}
