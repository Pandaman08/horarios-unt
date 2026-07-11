// prisma/seeders/03_ambientes.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedAmbientes(prisma: PrismaClient) {
  console.log('🌱 Sembrando Ambientes...');

  // Obtener Departamento de Ingeniería de Sistemas
  const departamentoSistemas = await prisma.departamentoAcademico.findFirst({
    where: { nombre: { contains: 'Ingeniería de Sistemas' } }
  });
  const departamentoId = departamentoSistemas?.id;

  const ambientes = [
    // Aulas de teoría
    { codigo: 'A-101', nombre: 'Aula 101', tipo: 'teoria', capacidad: 40, piso: '1', pabellon: 'A', equipamiento: 'Proyector, pizarra acrílica', activo: true, departamentoId },
    { codigo: 'A-102', nombre: 'Aula 102', tipo: 'teoria', capacidad: 35, piso: '1', pabellon: 'A', equipamiento: 'Proyector, pizarra acrílica', activo: true, departamentoId },
    { codigo: 'A-201', nombre: 'Aula 201', tipo: 'teoria', capacidad: 50, piso: '2', pabellon: 'A', equipamiento: 'Proyector, aire acondicionado', activo: true, departamentoId },
    { codigo: 'A-301', nombre: 'Aula 301', tipo: 'teoria', capacidad: 30, piso: '3', pabellon: 'A', equipamiento: 'Proyector', activo: true, departamentoId },
    { codigo: 'A-307', nombre: 'Posgrado A-307', tipo: 'teoria', capacidad: 30, piso: '3', pabellon: 'A', equipamiento: 'Proyector', activo: true, departamentoId },
    { codigo: 'A-303', nombre: 'Posgrado A-303', tipo: 'teoria', capacidad: 30, piso: '3', pabellon: 'A', equipamiento: 'Proyector', activo: true, departamentoId },
    { codigo: 'A-311', nombre: 'Aula 311', tipo: 'teoria', capacidad: 35, piso: '3', pabellon: 'A', equipamiento: 'Proyector, pizarra acrílica', activo: true, departamentoId },
    { codigo: 'EPG-202', nombre: 'EPG-202 (Posgrado)', tipo: 'teoria', capacidad: 40, piso: '2', pabellon: 'Posgrado', equipamiento: 'Proyector, aire acondicionado', activo: true, departamentoId },
    { codigo: 'EPG-203', nombre: 'EPG-203 (Posgrado)', tipo: 'teoria', capacidad: 40, piso: '2', pabellon: 'Posgrado', equipamiento: 'Proyector, aire acondicionado', activo: true, departamentoId },
    { codigo: 'EPG-205', nombre: 'EPG-205 (Posgrado)', tipo: 'teoria', capacidad: 40, piso: '2', pabellon: 'Posgrado', equipamiento: 'Proyector', activo: true, departamentoId },
    { codigo: 'EPG-209', nombre: 'EPG-209 (Posgrado)', tipo: 'teoria', capacidad: 40, piso: '2', pabellon: 'Posgrado', equipamiento: 'Proyector', activo: true, departamentoId },

    // Laboratorios de cómputo
    { codigo: 'LAB-1', nombre: 'Laboratorio de Cómputo 1', tipo: 'laboratorio', capacidad: 25, piso: '1', pabellon: 'B', equipamiento: '25 PC, proyector, aire acondicionado', activo: true, departamentoId },
    { codigo: 'LAB-2', nombre: 'Laboratorio de Cómputo 2', tipo: 'laboratorio', capacidad: 30, piso: '1', pabellon: 'B', equipamiento: '30 PC, proyector, aire acondicionado', activo: true, departamentoId },
    { codigo: 'LAB-3', nombre: 'Laboratorio de Cómputo 3', tipo: 'laboratorio', capacidad: 20, piso: '2', pabellon: 'B', equipamiento: '20 PC, equipos de red', activo: true, departamentoId },
    { codigo: 'LAB-4', nombre: 'Laboratorio de Cómputo 4', tipo: 'laboratorio', capacidad: 25, piso: '1', pabellon: 'B', equipamiento: '25 PC, proyector', activo: true, departamentoId },
    { codigo: 'CCSIS01', nombre: 'CCSIS01 - SL01LA188', tipo: 'laboratorio', capacidad: 15, piso: '1', pabellon: 'Sistemas', equipamiento: 'PC Intel Core i7', activo: true, departamentoId },
    { codigo: 'CCSIS02', nombre: 'CCSIS02 - SL01LA189', tipo: 'laboratorio', capacidad: 15, piso: '1', pabellon: 'Sistemas', equipamiento: 'PC Intel Core i7', activo: true, departamentoId },
    { codigo: 'CCSIS03', nombre: 'CCSIS03 - SL01LA190', tipo: 'laboratorio', capacidad: 5, piso: '1', pabellon: 'Sistemas', equipamiento: 'PC Intel Core i7', activo: true, departamentoId },
    { codigo: 'CCSIS04', nombre: 'CCSIS04 - SL01LA191', tipo: 'laboratorio', capacidad: 20, piso: '1', pabellon: 'Sistemas', equipamiento: 'PC Intel Core i7', activo: true, departamentoId },

    // Otros laboratorios
    { codigo: 'LAB-FISICA', nombre: 'Laboratorio de Física', tipo: 'laboratorio', capacidad: 20, piso: '1', pabellon: 'Física', equipamiento: 'Equipos de física', activo: true, departamentoId: null },
    { codigo: 'TALLER-CONF', nombre: 'Taller de Confecciones', tipo: 'taller', capacidad: 30, piso: '1', pabellon: 'Industrial', equipamiento: 'Máquinas de confección', activo: true, departamentoId: null },
    { codigo: 'AUDIOVISUALES', nombre: 'Sala Audiovisuales', tipo: 'especializado', capacidad: 40, piso: '2', pabellon: 'A', equipamiento: 'Proyector, equipos audiovisuales', activo: true, departamentoId },
  ];

  for (const ambiente of ambientes) {
    await prisma.ambiente.upsert({
      where: { codigo: ambiente.codigo },
      update: ambiente,
      create: ambiente,
    });
    console.log(`✅ Ambiente ${ambiente.codigo} (${ambiente.nombre}) asegurado.`);
  }

  const resultado = await prisma.ambiente.findMany();
  console.log(`✅ ${resultado.length} ambientes sembrados.\n`);
  return resultado;
}