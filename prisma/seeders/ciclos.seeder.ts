import { PrismaClient } from '@prisma/client';

export async function seedCiclos(prisma: PrismaClient) {
  console.log('-> Sembrando Ciclos...');
  const ciclos = [
    { numero: 1, nombre: 'I Ciclo' },
    { numero: 2, nombre: 'II Ciclo' },
    { numero: 3, nombre: 'III Ciclo' },
    { numero: 4, nombre: 'IV Ciclo' },
    { numero: 5, nombre: 'V Ciclo' },
    { numero: 6, nombre: 'VI Ciclo' },
    { numero: 7, nombre: 'VII Ciclo' },
    { numero: 8, nombre: 'VIII Ciclo' },
    { numero: 9, nombre: 'IX Ciclo' },
    { numero: 10, nombre: 'X Ciclo' },
  ];

  for (const ciclo of ciclos) {
    await prisma.ciclo.upsert({
      where: { numero: ciclo.numero },
      update: {},
      create: ciclo,
    });
  }
  return await prisma.ciclo.findMany();
}
