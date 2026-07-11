import { PrismaClient } from '@prisma/client';
import { seedCargosAcademicosAdministrativos } from './seeders/cargos_academicos_administrativos.seeder';

const prisma = new PrismaClient();

async function main() {
  await seedCargosAcademicosAdministrativos(prisma);
  await prisma.$disconnect();
}

main();
