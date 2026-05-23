// prisma/seeders/03_ambientes.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedAmbientes(prisma: PrismaClient) {
  console.log('🌱 Sembrando Ambientes...');

  const ambientes = [
    // Aulas de teoría
    { codigo: 'A-101', nombre: 'Aula 101', tipo: 'aula', capacidad: 40, piso: '1', pabellon: 'A', equipamiento: 'Proyector, pizarra acrílica', activo: true },
    { codigo: 'A-102', nombre: 'Aula 102', tipo: 'aula', capacidad: 35, piso: '1', pabellon: 'A', equipamiento: 'Proyector, pizarra acrílica', activo: true },
    { codigo: 'A-201', nombre: 'Aula 201', tipo: 'aula', capacidad: 50, piso: '2', pabellon: 'A', equipamiento: 'Proyector, aire acondicionado', activo: true },
    { codigo: 'A-301', nombre: 'Aula 301', tipo: 'aula', capacidad: 30, piso: '3', pabellon: 'A', equipamiento: 'Proyector', activo: true },
    { codigo: 'A-307', nombre: 'Posgrado A-307', tipo: 'aula', capacidad: 30, piso: '3', pabellon: 'A', equipamiento: 'Proyector', activo: true },
    { codigo: 'A-303', nombre: 'Posgrado A-303', tipo: 'aula', capacidad: 30, piso: '3', pabellon: 'A', equipamiento: 'Proyector', activo: true },
    { codigo: 'EPG-202', nombre: 'EPG-202 (Posgrado)', tipo: 'aula', capacidad: 40, piso: '2', pabellon: 'Posgrado', equipamiento: 'Proyector, aire acondicionado', activo: true },
    { codigo: 'EPG-203', nombre: 'EPG-203 (Posgrado)', tipo: 'aula', capacidad: 40, piso: '2', pabellon: 'Posgrado', equipamiento: 'Proyector, aire acondicionado', activo: true },
    { codigo: 'EPG-205', nombre: 'EPG-205 (Posgrado)', tipo: 'aula', capacidad: 40, piso: '2', pabellon: 'Posgrado', equipamiento: 'Proyector', activo: true },
    { codigo: 'EPG-209', nombre: 'EPG-209 (Posgrado)', tipo: 'aula', capacidad: 40, piso: '2', pabellon: 'Posgrado', equipamiento: 'Proyector', activo: true },

    // Laboratorios de cómputo
    { codigo: 'LAB-1', nombre: 'Laboratorio de Cómputo 1', tipo: 'laboratorio', capacidad: 25, piso: '1', pabellon: 'B', equipamiento: '25 PC, proyector, aire acondicionado', activo: true },
    { codigo: 'LAB-2', nombre: 'Laboratorio de Cómputo 2', tipo: 'laboratorio', capacidad: 30, piso: '1', pabellon: 'B', equipamiento: '30 PC, proyector, aire acondicionado', activo: true },
    { codigo: 'LAB-3', nombre: 'Laboratorio de Cómputo 3', tipo: 'laboratorio', capacidad: 20, piso: '2', pabellon: 'B', equipamiento: '20 PC, equipos de red', activo: true },
    { codigo: 'LAB-4', nombre: 'Laboratorio de Cómputo 4', tipo: 'laboratorio', capacidad: 25, piso: '1', pabellon: 'B', equipamiento: '25 PC, proyector', activo: true },
    { codigo: 'CCSIS01', nombre: 'CCSIS01 - SL01LA188', tipo: 'laboratorio', capacidad: 15, piso: '1', pabellon: 'Sistemas', equipamiento: 'PC Intel Core i7', activo: true },
    { codigo: 'CCSIS02', nombre: 'CCSIS02 - SL01LA189', tipo: 'laboratorio', capacidad: 15, piso: '1', pabellon: 'Sistemas', equipamiento: 'PC Intel Core i7', activo: true },
    { codigo: 'CCSIS03', nombre: 'CCSIS03 - SL01LA190', tipo: 'laboratorio', capacidad: 5, piso: '1', pabellon: 'Sistemas', equipamiento: 'PC Intel Core i7', activo: true },
    { codigo: 'CCSIS04', nombre: 'CCSIS04 - SL01LA191', tipo: 'laboratorio', capacidad: 20, piso: '1', pabellon: 'Sistemas', equipamiento: 'PC Intel Core i7', activo: true },

    // Otros laboratorios
    { codigo: 'LAB-FISICA', nombre: 'Laboratorio de Física', tipo: 'laboratorio', capacidad: 20, piso: '1', pabellon: 'Física', equipamiento: 'Equipos de física', activo: true },
    { codigo: 'TALLER-CONF', nombre: 'Taller de Confecciones', tipo: 'taller', capacidad: 30, piso: '1', pabellon: 'Industrial', equipamiento: 'Máquinas de confección', activo: true },
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