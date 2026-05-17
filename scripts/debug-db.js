const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const usuarios = await prisma.usuario.findMany();
    console.log('Usuarios en la base de datos:', usuarios.length);
    usuarios.forEach(u => console.log('- ', u.codigo, u.correo_electronico));
    
    const docentes = await prisma.docente.findMany();
    console.log('\nDocentes en la base de datos:', docentes.length);
    docentes.forEach(d => console.log('- ', d.codigo_docente, d.nombres, d.apellidos));
    
    const cursos = await prisma.curso.findMany();
    console.log('\nCursos en la base de datos:', cursos.length);
    cursos.forEach(c => console.log('- ', c.codigo, c.nombre));
  } catch (error) {
    console.error('Error al consultar la BD:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
