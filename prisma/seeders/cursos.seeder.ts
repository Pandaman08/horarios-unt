
import { PrismaClient } from '@prisma/client';

export async function seedCursos(prisma: PrismaClient) {
  console.log('🌱 Sembrando Cursos...');

  // Primero, obtener los ciclos para mapear número -> id_ciclo
  const ciclos = await prisma.ciclo.findMany();
  const cicloMap = new Map<number, number>();
  for (const ciclo of ciclos) {
    cicloMap.set(ciclo.numero, ciclo.id_ciclo);
  }

  // Lista de cursos según malla curricular 2018 y horarios
  const cursos = [
    // ========== I CICLO ==========
    { codigo: 'EG-101', nombre: 'Desarrollo del Pensamiento Lógico Matemático', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true },
    { codigo: 'EG-102', nombre: 'Lectura Crítica y Redacción de Textos Académicos', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true },
    { codigo: 'EG-103', nombre: 'Desarrollo Personal', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true },
    { codigo: 'EG-104', nombre: 'Introducción al Análisis Matemático', horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0, creditos: 4, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true },
    { codigo: 'EG-105', nombre: 'Estadística General', horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0, creditos: 4, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true },
    { codigo: 'EE-101', nombre: 'Introducción a la Ingeniería de Sistemas', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 0, creditos: 2, id_ciclo: cicloMap.get(1), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-102', nombre: 'Introducción a la Programación', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(1), tipo_curso: 'linea_carrera', activo: true },
    // Electivos I ciclo (solo uno, pero los registramos)
    { codigo: 'EL-101', nombre: 'Técnicas de comunicación eficaz', horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, creditos: 1, id_ciclo: cicloMap.get(1), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-102', nombre: 'Taller de Música', horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, creditos: 1, id_ciclo: cicloMap.get(1), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-103', nombre: 'Taller de Liderazgo y trabajo en equipo', horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, creditos: 1, id_ciclo: cicloMap.get(1), tipo_curso: 'electivo', activo: true },

    // ========== II CICLO ==========
    { codigo: 'EG-201', nombre: 'Ética, Convivencia Humana y Ciudadanía', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true },
    { codigo: 'EG-202', nombre: 'Sociedad, Cultura y Ecología', horas_teoria: 1, horas_practica: 4, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true },
    { codigo: 'EG-203', nombre: 'Cultura Investigativa y Pensamiento Crítico', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true },
    { codigo: 'EG-204', nombre: 'Análisis Matemático', horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0, creditos: 4, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true },
    { codigo: 'EG-205', nombre: 'Física General', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2, creditos: 4, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true },
    { codigo: 'EE-201', nombre: 'Programación Orientada a Objetos I', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4, creditos: 4, id_ciclo: cicloMap.get(2), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EL-201', nombre: 'Taller de Manejo de TIC', horas_teoria: 0, horas_practica: 0, horas_laboratorio: 2, creditos: 1, id_ciclo: cicloMap.get(2), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-202', nombre: 'Taller de Danzas Folklóricas', horas_teoria: 0, horas_practica: 0, horas_laboratorio: 2, creditos: 1, id_ciclo: cicloMap.get(2), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-203', nombre: 'Taller de Deporte', horas_teoria: 0, horas_practica: 0, horas_laboratorio: 2, creditos: 1, id_ciclo: cicloMap.get(2), tipo_curso: 'electivo', activo: true },
    // adicional: Análisis Numérico (no aparece en malla 2018 pero sí en horarios 2025-II)
    { codigo: 'EG-206', nombre: 'Análisis Numérico', horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0, creditos: 4, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true },

    // ========== III CICLO ==========
    { codigo: 'EP-301', nombre: 'Administración General', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-301', nombre: 'Sistémica', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EP-302', nombre: 'Estadística Aplicada', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EP-303', nombre: 'Matemática Aplicada I', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EP-304', nombre: 'Física Electrónica', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-302', nombre: 'Programación Orientada a Objetos II', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4, creditos: 4, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EL-301', nombre: 'Ingeniería Gráfica', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-302', nombre: 'Sicología Organizacional', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'electivo', activo: true },

    // ========== IV CICLO ==========
    { codigo: 'EP-401', nombre: 'Economía General', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-401', nombre: 'Diseño Web', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EP-402', nombre: 'Pensamiento de Diseño', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EP-403', nombre: 'Gestión por Procesos', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-402', nombre: 'Sistemas Digitales', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-403', nombre: 'Estructura de Datos Orientado a Objetos', horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, creditos: 4, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EL-401', nombre: 'Computación Gráfica y Visual', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-402', nombre: 'Plataformas Tecnológicas', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'electivo', activo: true },

    // ========== V CICLO ==========
    { codigo: 'EP-501', nombre: 'Contabilidad Gerencial', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-501', nombre: 'Tecnologías Web', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EP-502', nombre: 'Investigación de Operaciones', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-502', nombre: 'Ingeniería de Datos I', horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, creditos: 4, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-503', nombre: 'Arquitectura y Organización de Computadoras', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-504', nombre: 'Sistemas de Información', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2, creditos: 4, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EL-501', nombre: 'Teleinformática', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-502', nombre: 'Transformación Digital', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'electivo', activo: true },

    // ========== VI CICLO ==========
    { codigo: 'EP-601', nombre: 'Finanzas Corporativas', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-601', nombre: 'Sistemas Inteligentes', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EP-602', nombre: 'Ingeniería Económica', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-602', nombre: 'Ingeniería de Datos II', horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, creditos: 4, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-603', nombre: 'Sistemas Operativos', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-604', nombre: 'Ingeniería de Requerimientos', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EL-601', nombre: 'Ingeniería Ambiental', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-602', nombre: 'Gestión del Talento Humano', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'electivo', activo: true },

    // ========== VII CICLO ==========
    { codigo: 'EP-701', nombre: 'Cadena de Suministro', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-701', nombre: 'Gestión de Servicios de TIC', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EI-701', nombre: 'Metodología de la Investigación Científica', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-702', nombre: 'Planeamiento Estratégico de la Información', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 4, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-703', nombre: 'Redes y Comunicaciones I', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-704', nombre: 'Ingeniería del Software I', horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, creditos: 4, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EL-701', nombre: 'Administración de Base de Datos', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-702', nombre: 'Negocios Electrónicos', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'electivo', activo: true },

    // ========== VIII CICLO ==========
    { codigo: 'EP-801', nombre: 'Marketing y Medios Sociales', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-801', nombre: 'Seguridad de la Información', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-802', nombre: 'Internet de las Cosas', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-803', nombre: 'Inteligencia de Negocios', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-804', nombre: 'Redes y Comunicaciones II', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-805', nombre: 'Ingeniería del Software II', horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, creditos: 4, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EL-801', nombre: 'Deontología y Derecho Informático', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-802', nombre: 'Arquitectura basada en Microservicios', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'electivo', activo: true },

    // ========== IX CICLO ==========
    { codigo: 'EE-901', nombre: 'Gestión de Proyectos de TIC', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-902', nombre: 'Auditoría Informática', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EI-901', nombre: 'Tesis I', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2, creditos: 4, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-903', nombre: 'Analítica de Negocios', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-904', nombre: 'Computación en la Nube', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-905', nombre: 'Ingeniería Web', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EL-901', nombre: 'Emprendedurismo Tecnológico', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'electivo', activo: true },
    { codigo: 'EL-902', nombre: 'Hackeo Ético', horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'electivo', activo: true },

    // ========== X CICLO ==========
    { codigo: 'EE-X01', nombre: 'Sistemas de Información Empresarial', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 3, creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-X02', nombre: 'Gobierno de TIC', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EI-X01', nombre: 'Tesis II', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2, creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-X03', nombre: 'Arquitectura Empresarial', horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EP-X01', nombre: 'Responsabilidad Social Corporativa', horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-X04', nombre: 'Aplicaciones Móviles', horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true },
    { codigo: 'EE-X05', nombre: 'Prácticas Pre Profesionales', horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true },
  ];

  for (const curso of cursos) {
    await prisma.curso.upsert({
      where: { codigo: curso.codigo },
      update: curso,
      create: curso,
    });
    console.log(`✅ Curso ${curso.codigo} - ${curso.nombre} (Ciclo ${curso.id_ciclo}) asegurado.`);
  }

  const resultado = await prisma.curso.findMany();
  console.log(`✅ ${resultado.length} cursos sembrados.\n`);
  return resultado;
}