
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
    { codigo: 'EG-101', nombre: 'Desarrollo del Pensamiento Lógico Matemático', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true, horas_teoria: 1, horas_practica: 4, horas_laboratorio: 0 },
    { codigo: 'EG-102', nombre: 'Lectura Crítica y Redacción de Textos Académicos', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EG-103', nombre: 'Desarrollo Personal', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EG-104', nombre: 'Introducción al Análisis Matemático', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0 },
    { codigo: 'EG-105', nombre: 'Estadística General', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(1), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-101', nombre: 'Introducción a la Ingeniería de Sistemas', maximo_docentes: 1, creditos: 2, id_ciclo: cicloMap.get(1), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-102', nombre: 'Introducción a la Programación', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(1), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2 },
    // Electivos I ciclo (solo uno, pero los registramos)
    { codigo: 'EL-101', nombre: 'Técnicas de comunicación eficaz', maximo_docentes: 1, creditos: 1, id_ciclo: cicloMap.get(1), tipo_curso: 'electivo', activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EL-102', nombre: 'Taller de Música', maximo_docentes: 1, creditos: 1, id_ciclo: cicloMap.get(1), tipo_curso: 'electivo', activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EL-103', nombre: 'Taller de Liderazgo y trabajo en equipo', maximo_docentes: 1, creditos: 1, id_ciclo: cicloMap.get(1), tipo_curso: 'electivo', activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0 },

    // ========== II CICLO ==========
    { codigo: 'EG-201', nombre: 'Ética, Convivencia Humana y Ciudadanía', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EG-202', nombre: 'Sociedad, Cultura y Ecología', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EG-203', nombre: 'Cultura Investigativa y Pensamiento Crítico', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EG-204', nombre: 'Análisis Matemático', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0 },
    { codigo: 'EG-205', nombre: 'Física General', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0 },
    { codigo: 'EE-201', nombre: 'Programación Orientada a Objetos I', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(2), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EL-201', nombre: 'Taller de Manejo de TIC', maximo_docentes: 1, creditos: 1, id_ciclo: cicloMap.get(2), tipo_curso: 'electivo', activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EL-202', nombre: 'Taller de Danzas Folklóricas', maximo_docentes: 1, creditos: 1, id_ciclo: cicloMap.get(2), tipo_curso: 'electivo', activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EL-203', nombre: 'Taller de Deporte', maximo_docentes: 1, creditos: 1, id_ciclo: cicloMap.get(2), tipo_curso: 'electivo', activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0 },
    // adicional: Análisis Numérico (no aparece en malla 2018 pero sí en horarios 2025-II)
    { codigo: 'EG-206', nombre: 'Análisis Numérico', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(2), tipo_curso: 'general', activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0 },

    // ========== III CICLO ==========
    { codigo: 'EP-301', nombre: 'Administración General', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-301', nombre: 'Sistémica', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 2 },
    { codigo: 'EP-302', nombre: 'Estadística Aplicada', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EP-303', nombre: 'Matemática Aplicada I', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EP-304', nombre: 'Física Electrónica', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EP-305', nombre: 'Química General', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0 },
    { codigo: 'EE-302', nombre: 'Programación Orientada a Objetos II', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(3), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EL-301', nombre: 'Ingeniería Gráfica', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'electivo', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 2 },
    { codigo: 'EL-302', nombre: 'Sicología Organizacional', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(3), tipo_curso: 'electivo', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },

    // ========== IV CICLO ==========
    { codigo: 'EP-401', nombre: 'Economía General', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-401', nombre: 'Diseño Web', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EP-402', nombre: 'Pensamiento de Diseño', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 4, horas_laboratorio: 0 },
    { codigo: 'EP-403', nombre: 'Gestión por Procesos', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-402', nombre: 'Sistemas Digitales', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-403', nombre: 'Estructura de Datos Orientado a Objetos', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(4), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EL-401', nombre: 'Computación Gráfica y Visual', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'electivo', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EL-402', nombre: 'Plataformas Tecnológicas', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(4), tipo_curso: 'electivo', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },

    // ========== V CICLO ==========
    { codigo: 'EP-501', nombre: 'Contabilidad Gerencial', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-501', nombre: 'Tecnologías Web', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 2 },
    { codigo: 'EP-502', nombre: 'Investigación de Operaciones', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-502', nombre: 'Ingeniería de Datos I', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3 },
    { codigo: 'EE-503', nombre: 'Arquitectura y Organización de Computadoras', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-504', nombre: 'Sistemas de Información', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(5), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EL-501', nombre: 'Teleinformática', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'electivo', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EL-502', nombre: 'Transformación Digital', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(5), tipo_curso: 'electivo', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2 },

    // ========== VI CICLO ==========
    { codigo: 'EP-601', nombre: 'Finanzas Corporativas', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-601', nombre: 'Sistemas Inteligentes', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EP-602', nombre: 'Ingeniería Económica', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-602', nombre: 'Ingeniería de Datos II', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EE-603', nombre: 'Sistemas Operativos', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EE-604', nombre: 'Ingeniería de Requerimientos', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EL-601', nombre: 'Ingeniería Ambiental', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'electivo', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EL-602', nombre: 'Gestión del Talento Humano', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(6), tipo_curso: 'electivo', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },

    // ========== VII CICLO ==========
    { codigo: 'EP-701', nombre: 'Cadena de Suministro', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-701', nombre: 'Gestión de Servicios de TIC', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EI-701', nombre: 'Metodología de la Investigación Científica', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-702', nombre: 'Planeamiento Estratégico de la Información', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-703', nombre: 'Redes y Comunicaciones I', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3 },
    { codigo: 'EE-704', nombre: 'Ingeniería del Software I', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(7), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3 },
    { codigo: 'EL-701', nombre: 'Administración de Base de Datos', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'electivo', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3 },
    { codigo: 'EL-702', nombre: 'Negocios Electrónicos', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(7), tipo_curso: 'electivo', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2 },

    // ========== VIII CICLO ==========
    { codigo: 'EP-801', nombre: 'Marketing y Medios Sociales', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-801', nombre: 'Seguridad de la Información', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2 },
    { codigo: 'EE-802', nombre: 'Internet de las Cosas', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EE-803', nombre: 'Inteligencia de Negocios', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2 },
    { codigo: 'EE-804', nombre: 'Redes y Comunicaciones II', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EE-805', nombre: 'Ingeniería del Software II', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(8), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EL-801', nombre: 'Deontología y Derecho Informático', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'electivo', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EL-802', nombre: 'Arquitectura basada en Microservicios', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(8), tipo_curso: 'electivo', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },

    // ========== IX CICLO ==========
    { codigo: 'EE-901', nombre: 'Gestión de Proyectos de TIC', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-902', nombre: 'Auditoría Informática', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EI-901', nombre: 'Tesis I', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-903', nombre: 'Analítica de Negocios', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-904', nombre: 'Computación en la Nube', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3 },
    { codigo: 'EE-905', nombre: 'Ingeniería Web', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3 },
    { codigo: 'EL-901', nombre: 'Emprendedurismo Tecnológico', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'electivo', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EL-902', nombre: 'Hackeo Ético', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(9), tipo_curso: 'electivo', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2 },

    // ========== X CICLO ==========
    { codigo: 'EE-X01', nombre: 'Sistemas de Información Empresarial', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EE-X02', nombre: 'Gobierno de TIC', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EI-X01', nombre: 'Tesis II', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2 },
    { codigo: 'EE-X03', nombre: 'Arquitectura Empresarial', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EP-X01', nombre: 'Responsabilidad Social Corporativa', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0 },
    { codigo: 'EE-X04', nombre: 'Aplicaciones Móviles', maximo_docentes: 1, creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 4 },
    { codigo: 'EE-X05', nombre: 'Prácticas Pre Profesionales', maximo_docentes: 1, creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'linea_carrera', activo: true, horas_teoria: 0, horas_practica: 0, horas_laboratorio: 0 },
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