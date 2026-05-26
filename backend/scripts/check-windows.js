const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.ventanaAtencion.count();
  console.log('Total windows:', count);
  const sample = await prisma.ventanaAtencion.findMany({ take: 5, orderBy: { id_ventana: 'desc' } });
  console.log('Last 5 windows:', JSON.stringify(sample, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
