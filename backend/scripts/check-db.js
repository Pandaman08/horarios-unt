const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.docente.count({ where: { activo: true } });
  console.log('Active docentes:', count);
  const sample = await prisma.docente.findMany({ take: 5 });
  console.log('Sample:', JSON.stringify(sample, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
