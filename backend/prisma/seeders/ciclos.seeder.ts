import { PrismaClient } from '@prisma/client';

export async function seedCiclos(prisma: PrismaClient) {
  console.log('🌱 Sembrando Ciclos...');
  
  const ciclos = [
    { numero: 1, nombre: 'I Ciclo', activo: true },
    { numero: 2, nombre: 'II Ciclo', activo: true },
    { numero: 3, nombre: 'III Ciclo', activo: true },
    { numero: 4, nombre: 'IV Ciclo', activo: true },
    { numero: 5, nombre: 'V Ciclo', activo: true },
    { numero: 6, nombre: 'VI Ciclo', activo: true },
    { numero: 7, nombre: 'VII Ciclo', activo: true },
    { numero: 8, nombre: 'VIII Ciclo', activo: true },
    { numero: 9, nombre: 'IX Ciclo', activo: true },
    { numero: 10, nombre: 'X Ciclo', activo: true },
  ];

  for (const ciclo of ciclos) {
    await prisma.ciclo.upsert({
      where: { numero: ciclo.numero },
      update: { nombre: ciclo.nombre, activo: ciclo.activo },
      create: ciclo,
    });
  }
  
  const resultado = await prisma.ciclo.findMany();
  console.log(`✅ ${resultado.length} ciclos sembrados.`);
  return resultado;
}