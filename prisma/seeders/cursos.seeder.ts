import { PrismaClient } from '@prisma/client';

export async function seedCursos(prisma: PrismaClient, idMalla?: number) {
  console.log('🌱 Sembrando Cursos...');

  // Obtener los ciclos para mapear número -> id_ciclo
  const ciclos = await prisma.ciclo.findMany();
  const cicloMap = new Map<number, number>();
  for (const ciclo of ciclos) {
    cicloMap.set(ciclo.numero, ciclo.id_ciclo);
  }

  // Obtener Departamento de Ingeniería de Sistemas
  const departamentoSistemas = await prisma.departamentoAcademico.findFirst({

    where: { nombre: { contains: 'Ingeniería de Sistemas' } }
  });
  const departamentoId = departamentoSistemas?.id;

  // Lista de cursos según Plan de Estudios 2018 (códigos reales del documento)
  // tipo_curso: 'especializacion' (S), 'obligatorio' (OB), 'opcional' (OP), 'electivo' (EL)
  // T=horas_teoria, P=horas_practica, L=horas_laboratorio, C=creditos
  const cursos = [
    // ========== I CICLO (Suma: 23 créditos) ==========
    { codigo: '1939', nombre: 'Introducción a la Ingeniería de Sistemas',            creditos: 2, id_ciclo: cicloMap.get(1),  tipo_curso: 'especializacion', activo: true, horas_teoria: 3, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2347', nombre: 'Introducción a la Programación',                      creditos: 3, id_ciclo: cicloMap.get(1),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 0, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '1854', nombre: 'Desarrollo Personal',                                 creditos: 3, id_ciclo: cicloMap.get(1),  tipo_curso: 'obligatorio',     activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ciencias Psicológicas Filosofía y Arte' },
    { codigo: '1855', nombre: 'Desarrollo del Pensamiento Lógico Matemático',        creditos: 3, id_ciclo: cicloMap.get(1),  tipo_curso: 'obligatorio',     activo: true, horas_teoria: 1, horas_practica: 4, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Matemáticas' },
    { codigo: '1857', nombre: 'Lectura Crítica y Redacción de Textos Académicos',    creditos: 3, id_ciclo: cicloMap.get(1),  tipo_curso: 'obligatorio',     activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Lengua Nacional y Literatura' },
    { codigo: '1863', nombre: 'Introducción al Análisis Matemático',                 creditos: 4, id_ciclo: cicloMap.get(1),  tipo_curso: 'obligatorio',     activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Matemáticas' },
    { codigo: '1867', nombre: 'Estadística General',                                 creditos: 4, id_ciclo: cicloMap.get(1),  tipo_curso: 'opcional',        activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Estadística' },
    { codigo: '1883', nombre: 'Taller de Técnicas de Comunicación Eficaz',           creditos: 1, id_ciclo: cicloMap.get(1),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Comunicación Social' },
    { codigo: '1884', nombre: 'Taller de Música',                                    creditos: 1, id_ciclo: cicloMap.get(1),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Filosofía y Arte' },
    { codigo: '1908', nombre: 'Taller de Liderazgo y Trabajo en Equipo',             creditos: 1, id_ciclo: cicloMap.get(1),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ciencias Psicológicas' },
    { codigo: '2055', nombre: 'Taller de Deporte',                                   creditos: 1, id_ciclo: cicloMap.get(1),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ciencias de la Educación' },
    { codigo: '2056', nombre: 'Taller de Teatro',                                    creditos: 1, id_ciclo: cicloMap.get(1),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Filosofía y Arte' },

    // ========== II CICLO (Suma: 22 créditos) ==========
    // Prereq: 2051 <- 1939
    { codigo: '2051', nombre: 'Programación Orientado a Objetos I',                  creditos: 4, id_ciclo: cicloMap.get(2),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '1858', nombre: 'Sociedad, Cultura y Ecología',                        creditos: 3, id_ciclo: cicloMap.get(2),  tipo_curso: 'obligatorio',     activo: true, horas_teoria: 1, horas_practica: 4, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ciencias Sociales' },
    { codigo: '1859', nombre: 'Cultura Investigativa y Pensamiento Crítico',         creditos: 3, id_ciclo: cicloMap.get(2),  tipo_curso: 'obligatorio',     activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ciencias de la Educación' },
    { codigo: '1860', nombre: 'Ética, Convivencia Humana y Ciudadanía',              creditos: 3, id_ciclo: cicloMap.get(2),  tipo_curso: 'obligatorio',     activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Filosofía y Arte Ciencias Psicológicas' },
    // Prereq: 1861 <- 1863
    { codigo: '1861', nombre: 'Análisis Matemático',                                 creditos: 4, id_ciclo: cicloMap.get(2),  tipo_curso: 'obligatorio',     activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Matemáticas' },
    { codigo: '1875', nombre: 'Física General',                                      creditos: 4, id_ciclo: cicloMap.get(2),  tipo_curso: 'opcional',        activo: true, horas_teoria: 2, horas_practica: 4, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Física' },
    { codigo: '1888', nombre: 'Taller de Manejo de TIC',                             creditos: 1, id_ciclo: cicloMap.get(2),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '1889', nombre: 'Taller de Danzas Folclóricas',                        creditos: 1, id_ciclo: cicloMap.get(2),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Filosofía y Arte' },
    { codigo: '1890', nombre: 'Taller de Deporte',                                   creditos: 1, id_ciclo: cicloMap.get(2),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ciencias de la Educación' },
    { codigo: '2057', nombre: 'Taller de Música',                                    creditos: 1, id_ciclo: cicloMap.get(2),  tipo_curso: 'electivo',        activo: true, horas_teoria: 0, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Filosofía y Arte' },

    // ========== III CICLO (Suma: 22 créditos) ==========
    // Prereq: 2140 <- 1860 | 2141 <- 1939 | 2142 <- 1867 | 2143 <- 1861 | 2144 <- 1875 | 2145 <- 2051
    { codigo: '2140', nombre: 'Administración General',                              creditos: 3, id_ciclo: cicloMap.get(3),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Administración' },
    { codigo: '2141', nombre: 'Sistémica',                                           creditos: 3, id_ciclo: cicloMap.get(3),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2142', nombre: 'Estadística Aplicada',                                creditos: 3, id_ciclo: cicloMap.get(3),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Estadística' },
    { codigo: '2143', nombre: 'Matemática Aplicada',                                 creditos: 3, id_ciclo: cicloMap.get(3),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Matemáticas' },
    { codigo: '2144', nombre: 'Física Electrónica',                                  creditos: 3, id_ciclo: cicloMap.get(3),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Física' },
    { codigo: '2145', nombre: 'Programación Orientada a Objetos II',                 creditos: 4, id_ciclo: cicloMap.get(3),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 4, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2146', nombre: 'Ingeniería Gráfica',                                  creditos: 3, id_ciclo: cicloMap.get(3),  tipo_curso: 'electivo',        activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2147', nombre: 'Sicología Organizacional',                            creditos: 3, id_ciclo: cicloMap.get(3),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ciencias Psicológicas' },

    // ========== IV CICLO (Suma: 22 créditos) ==========
    // Prereq: 2650 <- 2141 | 2651 <- 2142 | 2652 <- 2141 | 2653 <- 2141 | 2654 <- 2143,2144 | 2655 <- 2145
    { codigo: '2650', nombre: 'Economía General',                                    creditos: 3, id_ciclo: cicloMap.get(4),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Economía' },
    { codigo: '2651', nombre: 'Diseño Web',                                          creditos: 3, id_ciclo: cicloMap.get(4),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2652', nombre: 'Pensamiento de Diseño',                               creditos: 3, id_ciclo: cicloMap.get(4),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2653', nombre: 'Gestión de Procesos',                                 creditos: 3, id_ciclo: cicloMap.get(4),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2654', nombre: 'Sistemas Digitales',                                  creditos: 3, id_ciclo: cicloMap.get(4),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2655', nombre: 'Estructura de Datos Orientado a Objetos',             creditos: 4, id_ciclo: cicloMap.get(4),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2656', nombre: 'Computación Gráfica y Visual',                        creditos: 3, id_ciclo: cicloMap.get(4),  tipo_curso: 'electivo',        activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2657', nombre: 'Plataformas Tecnológicas',                            creditos: 3, id_ciclo: cicloMap.get(4),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },

    // ========== V CICLO (Suma: 23 créditos) ==========
    // Prereq: 2689 <- 2650 | 2690 <- 2651 | 2691 <- 2652 | 2692 <- 2653,2655 | 2693 <- 2654 | 2694 <- 2651,2655
    { codigo: '2689', nombre: 'Contabilidad Gerencial',                              creditos: 3, id_ciclo: cicloMap.get(5),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Contabilidad y Finanzas' },
    { codigo: '2690', nombre: 'Tecnologías Web',                                     creditos: 3, id_ciclo: cicloMap.get(5),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2691', nombre: 'Investigación de Operaciones',                        creditos: 3, id_ciclo: cicloMap.get(5),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas Ingeniería Industrial' },
    { codigo: '2692', nombre: 'Ingeniería de Datos I',                               creditos: 4, id_ciclo: cicloMap.get(5),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2693', nombre: 'Arquitectura y Organización de Computadoras',         creditos: 3, id_ciclo: cicloMap.get(5),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2694', nombre: 'Sistemas de Información',                             creditos: 4, id_ciclo: cicloMap.get(5),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2695', nombre: 'Teleinformática',                                     creditos: 3, id_ciclo: cicloMap.get(5),  tipo_curso: 'electivo',        activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '2696', nombre: 'Transformación Digital',                              creditos: 3, id_ciclo: cicloMap.get(5),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },

    // ========== VI CICLO (Suma: 22 créditos) ==========
    // Prereq: 3125 <- 2689 | 3126 <- 2141,2693 | 3127 <- 2689,2691 | 3128 <- 2692 | 3129 <- 2693 | 3130 <- 2692,2694
    { codigo: '3125', nombre: 'Finanzas Corporativas',                               creditos: 3, id_ciclo: cicloMap.get(6),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Contabilidad y Finanzas' },
    { codigo: '3126', nombre: 'Sistemas Inteligentes',                               creditos: 3, id_ciclo: cicloMap.get(6),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3127', nombre: 'Ingeniería Económica',                                creditos: 3, id_ciclo: cicloMap.get(6),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería Industrial' },
    { codigo: '3128', nombre: 'Ingeniería de Datos II',                              creditos: 4, id_ciclo: cicloMap.get(6),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3129', nombre: 'Sistemas Operativos',                                 creditos: 3, id_ciclo: cicloMap.get(6),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3130', nombre: 'Ingeniería de Requerimientos',                        creditos: 3, id_ciclo: cicloMap.get(6),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3131', nombre: 'Ingeniería Ambiental',                                creditos: 3, id_ciclo: cicloMap.get(6),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ingeniería Química Ingeniería Ambiental' },
    { codigo: '3132', nombre: 'Gestión del Talento Humano',                          creditos: 3, id_ciclo: cicloMap.get(6),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Administración' },

    // ========== VII CICLO (Suma: 22 créditos) ==========
    // Prereq: 3444 <- 3125 | 3445 <- 3126,3130 | 3446 <- 2142 | 3447 <- 3127,3128 | 3448 <- 3129 | 3449 <- 3130
    { codigo: '3444', nombre: 'Cadena de Suministro',                                creditos: 3, id_ciclo: cicloMap.get(7),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ingeniería Industrial' },
    { codigo: '3445', nombre: 'Gestión de Servicios de TIC',                         creditos: 3, id_ciclo: cicloMap.get(7),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3446', nombre: 'Metodología de la Investigación Científica',          creditos: 3, id_ciclo: cicloMap.get(7),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3447', nombre: 'Planeamiento Estratégico de la Información',          creditos: 3, id_ciclo: cicloMap.get(7),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3448', nombre: 'Redes y Comunicaciones I',                            creditos: 3, id_ciclo: cicloMap.get(7),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3449', nombre: 'Ingeniería del Software I',                           creditos: 4, id_ciclo: cicloMap.get(7),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3450', nombre: 'Administración de Base de Datos',                     creditos: 3, id_ciclo: cicloMap.get(7),  tipo_curso: 'electivo',        activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '3451', nombre: 'Negocios Electrónicos',                               creditos: 3, id_ciclo: cicloMap.get(7),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },

    // ========== VIII CICLO (Suma: 22 créditos) ==========
    // Prereq: 4482 <- 2690,3444 | 4483 <- 3445,3448 | 4484 <- 3448,3449 | 4485 <- 3447 | 4486 <- 3448 | 4487 <- 3449
    { codigo: '4482', nombre: 'Marketing y Medios Sociales',                         creditos: 3, id_ciclo: cicloMap.get(8),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4483', nombre: 'Seguridad de la Información',                         creditos: 3, id_ciclo: cicloMap.get(8),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4484', nombre: 'Internet de las Cosas',                               creditos: 3, id_ciclo: cicloMap.get(8),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4485', nombre: 'Inteligencia de Negocios',                            creditos: 3, id_ciclo: cicloMap.get(8),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4486', nombre: 'Redes y Comunicaciones II',                           creditos: 3, id_ciclo: cicloMap.get(8),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4487', nombre: 'Ingeniería del Software II',                          creditos: 4, id_ciclo: cicloMap.get(8),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4488', nombre: 'Deontología y Derecho Informático',                   creditos: 3, id_ciclo: cicloMap.get(8),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Derecho' },
    { codigo: '4489', nombre: 'Arquitectura Basada en Microservicios',               creditos: 3, id_ciclo: cicloMap.get(8),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },

    // ========== IX CICLO (Suma: 22 créditos) ==========
    // Prereq: 4490 <- 3445,4484 | 4491 <- 4483 | 4492 <- 3446 (+ 170 créditos) | 4493 <- 4482,4485
    // Prereq: 4494 <- 4486 | 4495 <- 4486,4487
    { codigo: '4490', nombre: 'Gestión de Proyectos de TIC',                         creditos: 3, id_ciclo: cicloMap.get(9),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4491', nombre: 'Auditoría Informática',                               creditos: 3, id_ciclo: cicloMap.get(9),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4492', nombre: 'Tesis I',                                             creditos: 4, id_ciclo: cicloMap.get(9),  tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4493', nombre: 'Analítica de Negocios',                               creditos: 3, id_ciclo: cicloMap.get(9),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4494', nombre: 'Computación en la Nube',                              creditos: 3, id_ciclo: cicloMap.get(9),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4495', nombre: 'Ingeniería Web',                                      creditos: 3, id_ciclo: cicloMap.get(9),  tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4496', nombre: 'Emprendedurismo Tecnológico',                         creditos: 3, id_ciclo: cicloMap.get(9),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4497', nombre: 'Hackeo Ético',                                        creditos: 3, id_ciclo: cicloMap.get(9),  tipo_curso: 'electivo',        activo: true, horas_teoria: 2, horas_practica: 0, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },

    // ========== X CICLO (Suma: 24 créditos) ==========
    // Prereq: 4498 <- 4490 | 4499 <- 4490,4491 | 4501 <- 4491,4494 | 4502 <- 4490 | 4503 <- 4495
    // Prereq: 4504 <- 4492 (+ 192 créditos) | 5265 <- 4492
    { codigo: '4498', nombre: 'Sistemas de Información Empresarial',                 creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4499', nombre: 'Gobierno de TIC',                                     creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4501', nombre: 'Arquitectura Empresarial',                            creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4502', nombre: 'Responsabilidad Social Corporativa',                  creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 0, maximo_docentes: 1, departamento_responsable: 'Ingeniería Industrial' },
    { codigo: '4503', nombre: 'Aplicaciones Móviles',                                creditos: 3, id_ciclo: cicloMap.get(10), tipo_curso: 'especializacion', activo: true, horas_teoria: 1, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '4504', nombre: 'Prácticas Pre Profesionales',                         creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 1, horas_laboratorio: 3, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
    { codigo: '5265', nombre: 'Trabajo de Investigación',                            creditos: 4, id_ciclo: cicloMap.get(10), tipo_curso: 'especializacion', activo: true, horas_teoria: 2, horas_practica: 2, horas_laboratorio: 2, maximo_docentes: 1, departamento_responsable: 'Ingeniería de Sistemas' },
  ];

  // Upsert de todos los cursos
  for (const curso of cursos) {
    // Link to departamento de Ingeniería de Sistemas if it's that department's course
    const cursoDepartamentoId = curso.departamento_responsable?.includes('Ingeniería de Sistemas') 
      ? departamentoId 
      : undefined;

    await prisma.curso.upsert({
      where: { codigo: curso.codigo },
      update: { ...curso, id_malla: idMalla, departamentoId: cursoDepartamentoId },
      create: { ...curso, id_malla: idMalla, departamentoId: cursoDepartamentoId },
    });
    console.log(`✅ Curso ${curso.codigo} - ${curso.nombre} (Ciclo ${curso.id_ciclo}) asegurado.`);
  }

  // -----------------------------------------------------------------------
  // PREREQUISITOS (relación curso -> cursos que lo desbloquean)
  // Basado en los asteriscos (*) del Plan de Estudios 2018
  // Se asume que existe una tabla "prerequisito" con campos:
  //   id_curso (curso que se quiere llevar) y id_prerequisito (curso previo requerido)
  // -----------------------------------------------------------------------
  console.log('\n🔗 Sembrando Prerequisitos...');

  const prerequisitos: { curso: string; prerequisito: string }[] = [
    // II CICLO
    { curso: '2051', prerequisito: '1939' }, // POO I <- Intro Ingeniería Sistemas
    { curso: '1861', prerequisito: '1863' }, // Análisis Matemático <- Intro Análisis Matemático

    // III CICLO
    { curso: '2140', prerequisito: '1860' }, // Administración General <- Ética Convivencia
    { curso: '2141', prerequisito: '1939' }, // Sistémica <- Intro Ingeniería Sistemas
    { curso: '2142', prerequisito: '1867' }, // Estadística Aplicada <- Estadística General
    { curso: '2143', prerequisito: '1861' }, // Matemática Aplicada <- Análisis Matemático
    { curso: '2144', prerequisito: '1875' }, // Física Electrónica <- Física General
    { curso: '2145', prerequisito: '2051' }, // POO II <- POO I

    // IV CICLO
    { curso: '2650', prerequisito: '2141' }, // Economía General <- Sistémica
    { curso: '2651', prerequisito: '2142' }, // Diseño Web <- Estadística Aplicada
    { curso: '2652', prerequisito: '2141' }, // Pensamiento de Diseño <- Sistémica
    { curso: '2653', prerequisito: '2141' }, // Gestión de Procesos <- Sistémica
    { curso: '2654', prerequisito: '2143' }, // Sistemas Digitales <- Matemática Aplicada
    { curso: '2654', prerequisito: '2144' }, // Sistemas Digitales <- Física Electrónica
    { curso: '2655', prerequisito: '2145' }, // Estructura de Datos OO <- POO II

    // V CICLO
    { curso: '2689', prerequisito: '2650' }, // Contabilidad Gerencial <- Economía General
    { curso: '2690', prerequisito: '2651' }, // Tecnologías Web <- Diseño Web
    { curso: '2691', prerequisito: '2652' }, // Investigación de Operaciones <- Pensamiento de Diseño
    { curso: '2692', prerequisito: '2653' }, // Ingeniería de Datos I <- Gestión de Procesos
    { curso: '2692', prerequisito: '2655' }, // Ingeniería de Datos I <- Estructura de Datos OO
    { curso: '2693', prerequisito: '2654' }, // Arq. y Org. Computadoras <- Sistemas Digitales
    { curso: '2694', prerequisito: '2651' }, // Sistemas de Información <- Diseño Web
    { curso: '2694', prerequisito: '2655' }, // Sistemas de Información <- Estructura de Datos OO

    // VI CICLO
    { curso: '3125', prerequisito: '2689' }, // Finanzas Corporativas <- Contabilidad Gerencial
    { curso: '3126', prerequisito: '2141' }, // Sistemas Inteligentes <- Sistémica
    { curso: '3126', prerequisito: '2693' }, // Sistemas Inteligentes <- Arq. y Org. Computadoras
    { curso: '3127', prerequisito: '2689' }, // Ingeniería Económica <- Contabilidad Gerencial
    { curso: '3127', prerequisito: '2691' }, // Ingeniería Económica <- Investigación de Operaciones
    { curso: '3128', prerequisito: '2692' }, // Ingeniería de Datos II <- Ingeniería de Datos I
    { curso: '3129', prerequisito: '2693' }, // Sistemas Operativos <- Arq. y Org. Computadoras
    { curso: '3130', prerequisito: '2692' }, // Ingeniería de Requerimientos <- Ingeniería de Datos I
    { curso: '3130', prerequisito: '2694' }, // Ingeniería de Requerimientos <- Sistemas de Información

    // VII CICLO
    { curso: '3444', prerequisito: '3125' }, // Cadena de Suministro <- Finanzas Corporativas
    { curso: '3445', prerequisito: '3126' }, // Gestión de Servicios TIC <- Sistemas Inteligentes
    { curso: '3445', prerequisito: '3130' }, // Gestión de Servicios TIC <- Ing. de Requerimientos
    { curso: '3446', prerequisito: '2142' }, // Metodología Investigación Cient. <- Estadística Aplicada
    { curso: '3447', prerequisito: '3127' }, // Planeamiento Estratégico Info <- Ing. Económica
    { curso: '3447', prerequisito: '3128' }, // Planeamiento Estratégico Info <- Ing. de Datos II
    { curso: '3448', prerequisito: '3129' }, // Redes y Comunicaciones I <- Sistemas Operativos
    { curso: '3449', prerequisito: '3130' }, // Ingeniería del Software I <- Ing. de Requerimientos

    // VIII CICLO
    { curso: '4482', prerequisito: '2690' }, // Marketing y Medios Sociales <- Tecnologías Web
    { curso: '4482', prerequisito: '3444' }, // Marketing y Medios Sociales <- Cadena de Suministro
    { curso: '4483', prerequisito: '3445' }, // Seguridad de la Información <- Gestión de Servicios TIC
    { curso: '4483', prerequisito: '3448' }, // Seguridad de la Información <- Redes y Comunicaciones I
    { curso: '4484', prerequisito: '3448' }, // Internet de las Cosas <- Redes y Comunicaciones I
    { curso: '4484', prerequisito: '3449' }, // Internet de las Cosas <- Ingeniería del Software I
    { curso: '4485', prerequisito: '3447' }, // Inteligencia de Negocios <- Planeamiento Estratégico Info
    { curso: '4486', prerequisito: '3448' }, // Redes y Comunicaciones II <- Redes y Comunicaciones I
    { curso: '4487', prerequisito: '3449' }, // Ingeniería del Software II <- Ingeniería del Software I

    // IX CICLO
    { curso: '4490', prerequisito: '3445' }, // Gestión de Proyectos TIC <- Gestión de Servicios TIC
    { curso: '4490', prerequisito: '4484' }, // Gestión de Proyectos TIC <- Internet de las Cosas
    { curso: '4491', prerequisito: '4483' }, // Auditoría Informática <- Seguridad de la Información
    { curso: '4492', prerequisito: '3446' }, // Tesis I <- Metodología Investigación Cient. (+ 170 créditos)
    { curso: '4493', prerequisito: '4482' }, // Analítica de Negocios <- Marketing y Medios Sociales
    { curso: '4493', prerequisito: '4485' }, // Analítica de Negocios <- Inteligencia de Negocios
    { curso: '4494', prerequisito: '4486' }, // Computación en la Nube <- Redes y Comunicaciones II
    { curso: '4495', prerequisito: '4486' }, // Ingeniería Web <- Redes y Comunicaciones II
    { curso: '4495', prerequisito: '4487' }, // Ingeniería Web <- Ingeniería del Software II

    // X CICLO
    { curso: '4498', prerequisito: '4490' }, // Sistemas de Info Empresarial <- Gestión de Proyectos TIC
    { curso: '4499', prerequisito: '4490' }, // Gobierno de TIC <- Gestión de Proyectos TIC
    { curso: '4499', prerequisito: '4491' }, // Gobierno de TIC <- Auditoría Informática
    { curso: '4501', prerequisito: '4491' }, // Arquitectura Empresarial <- Auditoría Informática
    { curso: '4501', prerequisito: '4494' }, // Arquitectura Empresarial <- Computación en la Nube
    { curso: '4502', prerequisito: '4490' }, // Responsabilidad Social Corp. <- Gestión de Proyectos TIC
    { curso: '4503', prerequisito: '4495' }, // Aplicaciones Móviles <- Ingeniería Web
    { curso: '4504', prerequisito: '4492' }, // Prácticas Pre Prof. <- Tesis I (+ 192 créditos)
    { curso: '5265', prerequisito: '4492' }, // Trabajo de Investigación <- Tesis I
  ];

  // Obtener mapa de código -> id_curso para construir los prerequisitos
  const cursosDb = await prisma.curso.findMany({ select: { codigo: true, id_curso: true } });
  const cursoIdMap = new Map<string, number>();
  for (const c of cursosDb) {
    cursoIdMap.set(c.codigo, c.id_curso);
  }

  for (const prereq of prerequisitos) {
    const idCurso       = cursoIdMap.get(prereq.curso);
    const idPrerequisito = cursoIdMap.get(prereq.prerequisito);

    if (!idCurso || !idPrerequisito) {
      console.warn(`⚠️  No se encontró curso o prerequisito: ${prereq.curso} <- ${prereq.prerequisito}`);
      continue;
    }

    await prisma.prerequisito.upsert({
      where: {
        id_curso_id_prerequisito_curso: {
          id_curso: idCurso,
          id_prerequisito_curso: idPrerequisito,
        },
      },
      update: {},
      create: {
        id_curso: idCurso,
        id_prerequisito_curso: idPrerequisito,
      },
    });
    console.log(`🔗 Prereq: ${prereq.prerequisito} -> ${prereq.curso}`);
  }

  const resultado = await prisma.curso.findMany();
  console.log(`\n✅ ${resultado.length} cursos sembrados.`);
  return resultado;
}