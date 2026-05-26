const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.usuario.upsert({
    where: { codigo: 'ADMIN001' },
    update: {
      nombres: 'Admin',
      apellidos: 'Sistema',
      correo_electronico: 'admin@unitru.edu.pe',
      contrasena_hash: hash,
      rol: 'administrador_sistema',
      activo: true,
    },
    create: {
      codigo: 'ADMIN001',
      nombres: 'Admin',
      apellidos: 'Sistema',
      correo_electronico: 'admin@unitru.edu.pe',
      contrasena_hash: hash,
      rol: 'administrador_sistema',
      activo: true,
    },
  });

  console.log('Upserted usuario id:', user.id_usuario);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
