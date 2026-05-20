import { PrismaClient } from '@prisma/client';

export async function seedAmbientes(prisma: PrismaClient) {
  console.log('-> Sembrando Ambientes...');
  
  const ambientesData = [
    { codigo: 'A-101', nombre: 'Aula 101', tipo: 'teoria', capacidad: 40, pabellon: 'A', piso: '1' },
    { codigo: 'A-102', nombre: 'Aula 102', tipo: 'teoria', capacidad: 40, pabellon: 'A', piso: '1' },
    { codigo: 'A-201', nombre: 'Aula 201', tipo: 'teoria', capacidad: 45, pabellon: 'A', piso: '2' },
    { codigo: 'LAB-1', nombre: 'Laboratorio de Cómputo 1', tipo: 'laboratorio', capacidad: 30, pabellon: 'B', piso: '1', equipamiento: 'i7, 16GB RAM' },
    { codigo: 'LAB-2', nombre: 'Laboratorio de Cómputo 2', tipo: 'laboratorio', capacidad: 30, pabellon: 'B', piso: '1', equipamiento: 'i5, 8GB RAM' },
    { codigo: 'LAB-SIS', nombre: 'Laboratorio de Sistemas Distribuidos', tipo: 'laboratorio', capacidad: 20, pabellon: 'B', piso: '2', equipamiento: 'Servidores' },
    { codigo: 'AUD-1', nombre: 'Auditorio Central', tipo: 'especializado', capacidad: 100, pabellon: 'C', piso: '1' },
  ];

  const ambientes = [];
  for (const a of ambientesData) {
    const ambiente = await prisma.ambiente.upsert({
      where: { codigo: a.codigo },
      update: {},
      create: a
    });
    ambientes.push(ambiente);
  }
  return ambientes;
}
