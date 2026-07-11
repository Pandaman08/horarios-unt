const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking departments...');
  const deps = await prisma.departamentoAcademico.findMany({ select: { id: true, nombre: true } });
  console.log('Departments:', deps);
  
  console.log('\nChecking ambientes with departamentoId...');
  const ambientes = await prisma.ambiente.findMany({ select: { id_ambiente: true, codigo: true, nombre: true, departamentoId: true, departamento: { select: { id: true, nombre: true } } } });
  console.log('Ambientes:', ambientes);
  
  console.log('\nChecking mallas with departamentoId...');
  const mallas = await prisma.mallaCurricular.findMany({ select: { id_malla: true, nombre: true, departamentoId: true, departamento: { select: { id: true, nombre: true } } } });
  console.log('Mallas:', mallas);
  
  console.log('\nChecking cursos with departamentoId...');
  const cursos = await prisma.curso.findMany({ take: 10, select: { id_curso: true, codigo: true, nombre: true, departamentoId: true, id_malla: true } });
  console.log('Cursos (10):', cursos);
}

main().catch(console.error).finally(() => prisma.$disconnect());
