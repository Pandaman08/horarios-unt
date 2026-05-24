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
  // 2025-II (Ciclos pares)
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

  // ---------------------- CICLO VI -------------------------
  // Robert Jerry Sánchez Ticona - Ingeniería de Requerimientos
  { periodoKey: '2025-II', cursoCodigo: 'EE-603', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-603', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  // César Arellano Salazar - Sistemas Operativos
  { periodoKey: '2025-II', cursoCodigo: 'EE-602', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 1, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-602', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00' },
  // Luis Enrique Boy Chavil - Ingeniería de Datos II
  { periodoKey: '2025-II', cursoCodigo: 'EE-602', docenteCodigo: 'l18842081', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-602', docenteCodigo: 'l18842081', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  // Marcelino Torres Villanueva - Sistemas Inteligentes
  { periodoKey: '2025-II', cursoCodigo: 'EE-601', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-601', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 4, horaInicio: '16:00', horaFin: '17:00' },
  // Kevin Litman Florez Tolentino - Finanzas Corporativas
  { periodoKey: '2025-II', cursoCodigo: 'EP-601', docenteCodigo: 'k99999999', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 0, horaInicio: '18:00', horaFin: '19:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-601', docenteCodigo: 'k99999999', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  // Joe Alexis González Vásquez - Ingeniería Económica
  { periodoKey: '2025-II', cursoCodigo: 'EP-602', docenteCodigo: 'j99999999', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-602', docenteCodigo: 'j99999999', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 4, horaInicio: '11:00', horaFin: '12:00' },
  // Luis Moncada Alvites - Ingeniería Ambiental (e)
  { periodoKey: '2025-II', cursoCodigo: 'EL-601', docenteCodigo: 'l99999999', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-601', docenteCodigo: 'l99999999', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 3, horaInicio: '10:00', horaFin: '11:00' },
  // Nota: Juan Cabanillas (Gestión del Talento Humano) no tiene horario identificado.

  // ---------------------- CICLO VIII -------------------------
  // Juan Carlos Obando Roldán - Arquitectura basada en Microservicios (e)
  { periodoKey: '2025-II', cursoCodigo: 'EL-802', docenteCodigo: 'j18122605', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-802', docenteCodigo: 'j18122605', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 2, horaInicio: '09:00', horaFin: '10:00' },
  // Juan Pedro Santos Fernández - Ingeniería de Software II
  { periodoKey: '2025-II', cursoCodigo: 'EE-805', docenteCodigo: 'j17896289', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-805', docenteCodigo: 'j17896289', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-805', docenteCodigo: 'j17896289', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 2, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-805', docenteCodigo: 'j17896289', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '15:00', horaFin: '16:00' },
  // Everson David Agreda Gamboa - Redes y Comunicaciones II
  { periodoKey: '2025-II', cursoCodigo: 'EE-804', docenteCodigo: 'e18161457', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-804', docenteCodigo: 'e18161457', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 2, horaInicio: '17:00', horaFin: '18:00' },
  // Alberto Carlos Mendoza de los Santos - Seguridad de la Información
  { periodoKey: '2025-II', cursoCodigo: 'EE-801', docenteCodigo: 'a17434055', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-801', docenteCodigo: 'a17434055', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-801', docenteCodigo: 'a17434055', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-801', docenteCodigo: 'a17434055', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '17:00', horaFin: '18:00' },
  // Ricardo Darío Mendoza Rivera - Inteligencia de Negocios
  { periodoKey: '2025-II', cursoCodigo: 'EE-803', docenteCodigo: 'r18070765', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-803', docenteCodigo: 'r18070765', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-803', docenteCodigo: 'r18070765', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-803', docenteCodigo: 'r18070765', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '19:00', horaFin: '20:00' },
  // José Alberto Gómez Ávila - Internet de las Cosas
  { periodoKey: '2025-II', cursoCodigo: 'EE-802', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-802', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-802', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-202', tipoClase: 'teoria', diaSemana: 0, horaInicio: '15:00', horaFin: '16:00' },
  // Oscar Romel Alcántara Moreno - Marketing y Medios Sociales
  { periodoKey: '2025-II', cursoCodigo: 'EP-801', docenteCodigo: 'o18126940', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-801', docenteCodigo: 'o18126940', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-801', docenteCodigo: 'o18126940', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '12:00', horaFin: '13:00' },
  // Marco Celi Arévalo - Deontología y Derecho Informático (e)
  { periodoKey: '2025-II', cursoCodigo: 'EL-801', docenteCodigo: 'm99999999', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },

  // ---------------------- CICLO X -------------------------
  // Everson David Agreda Gamboa - Arquitectura Empresarial
  { periodoKey: '2025-II', cursoCodigo: 'EE-X03', docenteCodigo: 'e18161457', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X03', docenteCodigo: 'e18161457', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
  // Robert Jerry Sánchez Ticona - Aplicaciones Móviles
  { periodoKey: '2025-II', cursoCodigo: 'EE-X04', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X04', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X04', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 4, horaInicio: '16:00', horaFin: '17:00' },
  // Juan Pedro Santos Fernández - Trabajo de Investigación – Sección A
  { periodoKey: '2025-II', cursoCodigo: 'EI-X01', docenteCodigo: 'j17896289', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 1, horaInicio: '18:00', horaFin: '19:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EI-X01', docenteCodigo: 'j17896289', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 3, horaInicio: '18:00', horaFin: '19:00' },
  // Alberto Carlos Mendoza de los Santos - Gobierno de TIC
  { periodoKey: '2025-II', cursoCodigo: 'EE-X02', docenteCodigo: 'a17434055', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X02', docenteCodigo: 'a17434055', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X02', docenteCodigo: 'a17434055', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 3, horaInicio: '15:00', horaFin: '16:00' },
  // Ricardo Darío Mendoza Rivera - Trabajo de Investigación – Sección B
  { periodoKey: '2025-II', cursoCodigo: 'EI-X01', docenteCodigo: 'r18070765', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 3, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EI-X01', docenteCodigo: 'r18070765', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },
  // Oscar Romel Alcántara Moreno - Prácticas Preprofesionales
  { periodoKey: '2025-II', cursoCodigo: 'EE-X05', docenteCodigo: 'o18126940', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X05', docenteCodigo: 'o18126940', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 0, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X05', docenteCodigo: 'o18126940', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 0, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X05', docenteCodigo: 'o18126940', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 4, horaInicio: '18:00', horaFin: '19:00' },
  // Jorge Paul Cotrina Castellanos - Sistemas de Información Empresarial
  { periodoKey: '2025-II', cursoCodigo: 'EE-X01', docenteCodigo: 'j99999999', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X01', docenteCodigo: 'j99999999', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 2, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X01', docenteCodigo: 'j99999999', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 2, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-X01', docenteCodigo: 'j99999999', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 4, horaInicio: '15:00', horaFin: '16:00' },
  // Joe Alexis González Vásquez - Responsabilidad Social Corporativa
  { periodoKey: '2025-II', cursoCodigo: 'EP-X01', docenteCodigo: 'j99999999', ambienteCodigo: 'EPG-209', tipoClase: 'teoria', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },

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

  // ---------------------- CICLO III -------------------------
  // Zoraida Vidal Melgarejo - Programación Orientada a Objetos II
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 5, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 5, horaInicio: '09:00', horaFin: '10:00' },
  // Everson David Agreda Gamboa - Sistémica
  { periodoKey: '2026-I', cursoCodigo: 'EE-301', docenteCodigo: 'e18161457', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 0, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-301', docenteCodigo: 'e18161457', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  // Juan Carlos Obando Roldán - (sin curso específico, se asume EE-??? pero no se especifica, lo omitimos)
  // Teresita Rojas García - Estadística Aplicada
  { periodoKey: '2026-I', cursoCodigo: 'EP-303', docenteCodigo: 't99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-303', docenteCodigo: 't99999999', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-303', docenteCodigo: 't99999999', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-303', docenteCodigo: 't99999999', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '09:00', horaFin: '10:00' },
  // Marcos Ferrer Reyna - Matemática Aplicada
  { periodoKey: '2026-I', cursoCodigo: 'EP-304', docenteCodigo: 'm99999999', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-304', docenteCodigo: 'm99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-304', docenteCodigo: 'm99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-304', docenteCodigo: 'm99999999', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 5, horaInicio: '07:00', horaFin: '08:00' },
  // Juan Carrascal Cabanillas - Administración General
  { periodoKey: '2026-I', cursoCodigo: 'EP-301', docenteCodigo: 'j99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  // Sheyla Laura Escobedo Rodríguez - Ingeniería Gráfica (e) - no se especifica ambiente exacto, usamos A-311
  { periodoKey: '2026-I', cursoCodigo: 'EL-301', docenteCodigo: 's99999999', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-301', docenteCodigo: 's99999999', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  // Vilma Méndez Gil - Psicología Organizacional (e) - Taller Confecciones
  { periodoKey: '2026-I', cursoCodigo: 'EL-302', docenteCodigo: 'v99999999', ambienteCodigo: 'TALLER-CONF', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },

  // ---------------------- CICLO V -------------------------
  // Luis Boy Chavil - Ingeniería de Datos I
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '12:00', horaFin: '13:00' },
  // Camilo Suárez Rebaza - Teleinformática (e)
  { periodoKey: '2026-I', cursoCodigo: 'EL-501', docenteCodigo: 'c32978627', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 5, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-501', docenteCodigo: 'c32978627', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 5, horaInicio: '09:00', horaFin: '10:00' },
  // Robert Jerry Sánchez Ticona - Tecnología Web
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 2, horaInicio: '09:00', horaFin: '10:00' },
  // César Arellano Salazar - Arquitectura de Computadoras
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  // Juan Carlos Obando Roldán - Sistemas de Información
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '12:00', horaFin: '13:00' },
  // Everson David Agreda Gamboa - Transformación Digital
  { periodoKey: '2026-I', cursoCodigo: 'EL-502', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-502', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-502', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '12:00', horaFin: '13:00' },
  // Marcos Baca López - Investigación de Operaciones
  { periodoKey: '2026-I', cursoCodigo: 'EP-502', docenteCodigo: 'm99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-502', docenteCodigo: 'm99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '12:00', horaFin: '13:00' },
  // Ana Cuadra Mitzugaray - Contabilidad Gerencial
  { periodoKey: '2026-I', cursoCodigo: 'EP-501', docenteCodigo: 'a99999999', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00' },

  // ---------------------- CICLO VII -------------------------
  // Nota: Muchos horarios del ciclo VII no tienen hora exacta en el texto, solo día y ambiente.
  // Se asignan horas genéricas (ej. 08:00-10:00) para que el seeder funcione, pero deberás ajustar si es necesario.
  // Juan Pedro Santos Fernández - Ingeniería de Software I
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '08:00', horaFin: '10:00' },
  // César Arellano Salazar - Redes y Comunicaciones I
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '10:00' },
  // Robert Jerry Sánchez Ticona - Ingeniería de Software I (otra sección)
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'r19082305', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'r19082305', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'r19082305', ambienteCodigo: 'AUDIOVISUALES', tipoClase: 'teoria', diaSemana: 5, horaInicio: '08:00', horaFin: '10:00' },
  // Everson David Agreda Gamboa - Administración de Base de Datos
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '16:00', horaFin: '17:00' },
  // Paul Cotrina Castellanos - Metodología de la Investigación Científica
  { periodoKey: '2026-I', cursoCodigo: 'EI-701', docenteCodigo: 'p99999999', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-701', docenteCodigo: 'p99999999', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-701', docenteCodigo: 'p99999999', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '08:00', horaFin: '10:00' },
  // Ricardo Mendoza Rivera - Planeamiento Estratégico de TI
  { periodoKey: '2026-I', cursoCodigo: 'EE-702', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-702', docenteCodigo: 'r18070765', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-702', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '10:00' },
  // Oscar Romel Alcántara Moreno - Gestión de Servicios de TI
  { periodoKey: '2026-I', cursoCodigo: 'EE-701', docenteCodigo: 'o18126940', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-701', docenteCodigo: 'o18126940', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '10:00' },
  // Jhoe González Vásquez - Cadena de Suministros (e)
  { periodoKey: '2026-I', cursoCodigo: 'EP-701', docenteCodigo: 'j99999999', ambienteCodigo: 'TALLER-CONF', tipoClase: 'teoria', diaSemana: 4, horaInicio: '08:00', horaFin: '10:00' },
  // Alberto Mendoza de los Santos - Negocios Electrónicos (e)
  { periodoKey: '2026-I', cursoCodigo: 'EL-702', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-702', docenteCodigo: 'a17434055', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 1, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-702', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '10:00' },

  // ---------------------- CICLO IX -------------------------
  // Juan Pedro Santos Fernández - Tesis I
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'j17896289', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  // Ricardo Mendoza Rivera - Tesis I / Analítica de Negocios
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-903', docenteCodigo: 'r18070765', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-903', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-903', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '16:00', horaFin: '17:00' },
  // Marcelino Torres Villanueva - Ingeniería Web
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '10:00' },
  // José Gómez Ávila - Computación en la Nube
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 1, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  // Alberto Mendoza de los Santos - Auditoría Informática
  { periodoKey: '2026-I', cursoCodigo: 'EE-902', docenteCodigo: 'a17434055', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-902', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-902', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '10:00' },
  // Oscar Romel Alcántara Moreno - Gestión de Proyectos de TI
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'o18126940', ambienteCodigo: 'AUDIOVISUALES', tipoClase: 'teoria', diaSemana: 1, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '10:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'o18126940', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'o18126940', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '09:00', horaFin: '10:00' },
  // Camilo Suárez Rebaza - Hackeo Ético (e)
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '15:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '17:00', horaFin: '19:00' },
  // José Gómez Ávila - Emprendimiento Tecnológico
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '08:00', horaFin: '10:00' },
];

export async function seedHorarios(prisma: PrismaClient) {
  console.log('🌱 Sembrando horarios asignados para 2025-II y 2026-I...');

  // Obtener períodos
  const periodo2025_II = await prisma.periodoAcademico.findUnique({
    where: { codigo: '2025-II' },
  });
  const periodo2026_I = await prisma.periodoAcademico.findUnique({
    where: { codigo: '2026-I' },
  });
  if (!periodo2025_II || !periodo2026_I) {
    throw new Error('❌ No se encontraron períodos. Ejecuta primero 02_periodos.seeder.ts');
  }

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

  // Limpiar horarios previos
  await prisma.horarioAsignado.deleteMany({
    where: { id_periodo: { in: [periodo2025_II.id_periodo, periodo2026_I.id_periodo] } },
  });

  let totalInsertados = 0;
  let totalErrores = 0;

  for (const horario of horariosPlan) {
    const periodoId = horario.periodoKey === '2025-II' ? periodo2025_II.id_periodo : periodo2026_I.id_periodo;
    const idDocente = docenteMap.get(horario.docenteCodigo);
    const idCurso = cursoMap.get(horario.cursoCodigo);
    const idAmbiente = ambienteMap.get(horario.ambienteCodigo);
    const idGrupo = getGrupoId(periodoId, horario.cursoCodigo);

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
          id_periodo: periodoId,
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