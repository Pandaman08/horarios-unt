const { PrismaClient } = require('./frontend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const periodos = await prisma.periodoAcademico.findMany();
  console.log(JSON.stringify(periodos, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
