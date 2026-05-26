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

const horariosPlan: HorarioPlan[] = [
  // =========================================================
  // 2025-II (Ciclos pares)
  // =========================================================

  // ---------------------- CICLO II -------------------------
  { periodoKey: '2025-II', cursoCodigo: 'EE-201', docenteCodigo: 'z18153095', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 0, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-201', docenteCodigo: 'z18153095', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-201', docenteCodigo: 'z18153095', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-201', docenteCodigo: 'z18153095', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-202', docenteCodigo: 'e90000017', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-202', docenteCodigo: 'e90000017', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-203', docenteCodigo: 'd90000018', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 3, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-201', docenteCodigo: 'a90000020', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 4, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-206', docenteCodigo: 'm90000021', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 'a90000022', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 'a90000022', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 'a90000022', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 's90000016', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 0, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 's90000016', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 0, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 's90000016', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EG-205', docenteCodigo: 's90000016', ambienteCodigo: 'EPG-203', tipoClase: 'teoria', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },

  // ---------------------- CICLO IV -------------------------
  { periodoKey: '2025-II', cursoCodigo: 'EE-401', docenteCodigo: 'j18122605', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-401', docenteCodigo: 'j18122605', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-401', docenteCodigo: 'j18122605', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 2, horaInicio: '18:00', horaFin: '19:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-401', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-401', docenteCodigo: 'r19082305', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-402', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-402', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-402', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-402', docenteCodigo: 'c18147714', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '18:00', horaFin: '19:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-403', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-403', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-403', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EE-403', docenteCodigo: 'm17865408', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-403', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-403', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-403', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-402', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 0, horaInicio: '18:00', horaFin: '19:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-402', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 4, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EL-402', docenteCodigo: 'c32978627', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 4, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-402', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-402', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-402', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 1, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-402', docenteCodigo: 'j40990648', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 3, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2025-II', cursoCodigo: 'EP-401', docenteCodigo: 'a90000019', ambienteCodigo: 'EPG-205', tipoClase: 'teoria', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },

  // =========================================================
  // 2026-I — CICLO I
  // =========================================================
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'm17865408', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'm17865408', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-101', docenteCodigo: 'a17434055', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-101', docenteCodigo: 'a17434055', ambienteCodigo: 'A-307', tipoClase: 'practica', diaSemana: 1, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'p90000001', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'p90000001', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'p90000001', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-102', docenteCodigo: 'p90000001', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-103', docenteCodigo: 'b90000002', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-103', docenteCodigo: 'b90000002', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-101', docenteCodigo: 'j90000003', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 1, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-101', docenteCodigo: 'j90000003', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 1, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-101', docenteCodigo: 'j90000003', ambienteCodigo: 'A-307', tipoClase: 'practica', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-101', docenteCodigo: 'j90000003', ambienteCodigo: 'A-307', tipoClase: 'practica', diaSemana: 4, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-102', docenteCodigo: 'j90000004', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 3, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-102', docenteCodigo: 'j90000004', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 3, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-104', docenteCodigo: 's90000005', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-104', docenteCodigo: 's90000005', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-104', docenteCodigo: 's90000005', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-104', docenteCodigo: 's90000005', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-104', docenteCodigo: 's90000005', ambienteCodigo: 'A-303', tipoClase: 'practica', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-105', docenteCodigo: 'm90000006', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-105', docenteCodigo: 'm90000007', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EG-105', docenteCodigo: 'm90000007', ambienteCodigo: 'A-303', tipoClase: 'practica', diaSemana: 4, horaInicio: '16:00', horaFin: '17:00' },

  // =========================================================
  // 2026-I — CICLO III
  // =========================================================
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-302', docenteCodigo: 'z18153095', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-301', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-301', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-301', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-301', docenteCodigo: 'e18161457', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-301', docenteCodigo: 'e18161457', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-301', docenteCodigo: 'e18161457', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-301', docenteCodigo: 'j18122605', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-301', docenteCodigo: 'j18122605', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-301', docenteCodigo: 'j18122605', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-301', docenteCodigo: 'j18122605', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-301', docenteCodigo: 'j18122605', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-303', docenteCodigo: 'm90000008', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-303', docenteCodigo: 'm90000008', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-303', docenteCodigo: 'm90000008', ambienteCodigo: 'A-303', tipoClase: 'practica', diaSemana: 2, horaInicio: '20:00', horaFin: '21:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-302', docenteCodigo: 't90000009', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-302', docenteCodigo: 't90000009', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 1, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-302', docenteCodigo: 't90000009', ambienteCodigo: 'A-303', tipoClase: 'practica', diaSemana: 4, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-302', docenteCodigo: 't90000009', ambienteCodigo: 'A-303', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-301', docenteCodigo: 'j90000010', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-301', docenteCodigo: 'j90000010', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-301', docenteCodigo: 'j90000010', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-301', docenteCodigo: 'j90000010', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 1, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-304', docenteCodigo: 'v90000011', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-304', docenteCodigo: 'v90000011', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-304', docenteCodigo: 'v90000011', ambienteCodigo: 'LAB-FISICA', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-304', docenteCodigo: 'v90000011', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-302', docenteCodigo: 's90000012', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 1, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-302', docenteCodigo: 's90000012', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 4, horaInicio: '19:00', horaFin: '20:00' },

  // =========================================================
  // 2026-I — CICLO V
  // =========================================================
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-502', docenteCodigo: 'l18842081', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-504', docenteCodigo: 'j18122605', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-502', docenteCodigo: 'e18161457', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 2, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-502', docenteCodigo: 'e18161457', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '13:00', horaFin: '14:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-501', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-503', docenteCodigo: 'c18147714', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-501', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-501', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-501', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-501', docenteCodigo: 'c32978627', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-502', docenteCodigo: 'm90000013', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-502', docenteCodigo: 'm90000013', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-501', docenteCodigo: 'a90000014', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '20:00', horaFin: '21:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-501', docenteCodigo: 'a90000014', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 4, horaInicio: '20:00', horaFin: '21:00' },

  // =========================================================
  // 2026-I — CICLO VII
  // =========================================================
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'j17896289', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 4, horaInicio: '13:00', horaFin: '14:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-703', docenteCodigo: 'c18147714', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'r19082305', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'r19082305', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'r19082305', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-704', docenteCodigo: 'r19082305', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-702', docenteCodigo: 'e18161457', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-702', docenteCodigo: 'e18161457', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 2, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-701', docenteCodigo: 'a17434055', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-701', docenteCodigo: 'a17434055', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-701', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-701', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-701', docenteCodigo: 'p90000001', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 2, horaInicio: '13:00', horaFin: '14:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-701', docenteCodigo: 'p90000001', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 1, horaInicio: '13:00', horaFin: '14:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-701', docenteCodigo: 'p90000001', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 1, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'r18070765', ambienteCodigo: 'AUDIOVISUALES', tipoClase: 'teoria', diaSemana: 2, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'r18070765', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-701', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-702', docenteCodigo: 'o18126940', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-702', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-702', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '13:00', horaFin: '14:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-702', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-702', docenteCodigo: 'p90000001', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-702', docenteCodigo: 'p90000001', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EP-701', docenteCodigo: 'j90000015', ambienteCodigo: 'A-307', tipoClase: 'teoria', diaSemana: 3, horaInicio: '20:00', horaFin: '21:00' },

  // =========================================================
  // 2026-I — CICLO IX
  // =========================================================
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'j17896289', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'j17896289', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'j17896289', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'j17896289', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'r18070765', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 3, horaInicio: '13:00', horaFin: '14:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EI-901', docenteCodigo: 'r18070765', ambienteCodigo: 'A-311', tipoClase: 'teoria', diaSemana: 3, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-903', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '13:00', horaFin: '14:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-903', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-903', docenteCodigo: 'r18070765', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-902', docenteCodigo: 'a17434055', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-902', docenteCodigo: 'a17434055', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-902', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-902', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-902', docenteCodigo: 'a17434055', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'j40990648', ambienteCodigo: 'AUDIOVISUALES', tipoClase: 'teoria', diaSemana: 1, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'j40990648', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'j40990648', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '10:00', horaFin: '11:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-901', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-1', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '12:00', horaFin: '13:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'o18126940', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '13:00', horaFin: '14:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-901', docenteCodigo: 'o18126940', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-905', docenteCodigo: 'm17865408', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 0, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 1, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '07:00', horaFin: '08:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-4', tipoClase: 'laboratorio', diaSemana: 3, horaInicio: '20:00', horaFin: '21:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '16:00', horaFin: '17:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'LAB-3', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '17:00', horaFin: '18:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EE-904', docenteCodigo: 'j40990648', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 3, horaInicio: '08:00', horaFin: '09:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 2, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '14:00', horaFin: '15:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'LAB-2', tipoClase: 'laboratorio', diaSemana: 4, horaInicio: '15:00', horaFin: '16:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 0, horaInicio: '19:00', horaFin: '20:00' },
  { periodoKey: '2026-I', cursoCodigo: 'EL-902', docenteCodigo: 'c32978627', ambienteCodigo: 'A-303', tipoClase: 'teoria', diaSemana: 4, horaInicio: '19:00', horaFin: '20:00' },
];

export async function seedHorarios(prisma: PrismaClient) {
  console.log('🌱 Sembrando horarios asignados SOLO para PERÍODOS ACTIVOS...');

  const periodosActivos = await prisma.periodoAcademico.findMany({
    where: { activo: true }
  });

  if (periodosActivos.length === 0) {
    console.log('⚠️ No hay períodos activos para sembrar horarios.');
    return { insertados: 0, errores: 0 };
  }

  console.log(`✅ Encontrados ${periodosActivos.length} período(s) activo(s):`);
  periodosActivos.forEach(p => console.log(`   - ${p.nombre} (${p.codigo})`));

  const periodoMap = new Map(periodosActivos.map(p => [p.codigo, p]));

  const docentes  = await prisma.docente.findMany({ select: { id_docente: true, codigo_docente: true } });
  const cursos    = await prisma.curso.findMany({ select: { id_curso: true, codigo: true } });
  const ambientes = await prisma.ambiente.findMany({ select: { id_ambiente: true, codigo: true } });
  const grupos    = await prisma.grupo.findMany({ include: { periodo: true, curso: true } });

  const docenteMap  = new Map(docentes.map(d  => [d.codigo_docente, d.id_docente]));
  const cursoMap    = new Map(cursos.map(c    => [c.codigo, c.id_curso]));
  const ambienteMap = new Map(ambientes.map(a => [a.codigo, a.id_ambiente]));

  const grupoMap = new Map<string, number>();
  for (const grupo of grupos) {
    const key = `${grupo.periodo.id_periodo}_${grupo.curso.codigo}_A`;
    grupoMap.set(key, grupo.id_grupo);
  }

  function getGrupoId(periodoId: number, cursoCodigo: string): number | null {
    return grupoMap.get(`${periodoId}_${cursoCodigo}_A`) || null;
  }

  const idsPeriodosActivos = periodosActivos.map(p => p.id_periodo);

  await prisma.horarioAsignado.deleteMany({
    where: { id_periodo: { in: idsPeriodosActivos } },
  });

  const horariosParaGenerar = horariosPlan.filter(h => periodoMap.has(h.periodoKey));
  console.log(`📋 Generando ${horariosParaGenerar.length} horarios para períodos activos...`);

  let totalInsertados = 0;
  let totalErrores    = 0;

  for (const horario of horariosParaGenerar) {
    const periodo    = periodoMap.get(horario.periodoKey);
    if (!periodo) continue;

    const idDocente  = docenteMap.get(horario.docenteCodigo);
    const idCurso    = cursoMap.get(horario.cursoCodigo);
    const idAmbiente = ambienteMap.get(horario.ambienteCodigo);
    const idGrupo    = getGrupoId(periodo.id_periodo, horario.cursoCodigo);

    if (!idDocente)  { console.error(`❌ Docente no encontrado: ${horario.docenteCodigo}`);  totalErrores++; continue; }
    if (!idCurso)    { console.error(`❌ Curso no encontrado: ${horario.cursoCodigo}`);      totalErrores++; continue; }
    if (!idAmbiente) { console.error(`❌ Ambiente no encontrado: ${horario.ambienteCodigo}`); totalErrores++; continue; }
    if (!idGrupo)    { console.error(`❌ Grupo no encontrado para curso ${horario.cursoCodigo} en período ${horario.periodoKey}`); totalErrores++; continue; }

    try {
      await prisma.horarioAsignado.create({
        data: {
          id_docente:  idDocente,
          id_curso:    idCurso,
          id_grupo:    idGrupo,
          tipo_clase:  horario.tipoClase,
          id_ambiente: idAmbiente,
          dia_semana:  horario.diaSemana,
          hora_inicio: horario.horaInicio,
          hora_fin:    horario.horaFin,
          id_periodo:  periodo.id_periodo,
          estado:      'publicado',
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
