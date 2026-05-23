// prisma/seeders/06_usuarios_administrativos.seeder.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsuariosAdministrativos(prisma: PrismaClient) {
  console.log('🌱 Sembrando usuarios administrativos y administrador general...');

  // Función para generar correo (similar a docentes)
  function generarCorreo(nombres: string, apellidos: string): string {
    const nombreParts = nombres.trim().toLowerCase().split(/\s+/);
    const apellidoParts = apellidos.trim().toLowerCase().split(/\s+/);
    const inicialNombre = nombreParts[0].charAt(0);
    const primerApellido = apellidoParts[0];
    const segundoApellido = apellidoParts[1] ? apellidoParts[1] : '';
    let base = inicialNombre + primerApellido + segundoApellido;
    base = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    return `${base}@unitru.edu.pe`;
  }

  // 1. Administrador general del sistema
  const adminData = {
    nombres: 'Administrador',
    apellidos: 'Sistema',
    dni: '00000000',
    correo: 'admin@unitru.edu.pe',
    rol: 'administrador_sistema',
    contrasena: '00000000',
  };
  const adminHash = await bcrypt.hash(adminData.contrasena, 10);
  await prisma.usuario.upsert({
    where: { correo_electronico: adminData.correo },
    update: {},
    create: {
      codigo: 'ADMIN_SISTEMA',
      nombres: adminData.nombres,
      apellidos: adminData.apellidos,
      dni: adminData.dni,
      correo_electronico: adminData.correo,
      contrasena_hash: adminHash,
      rol: adminData.rol,
    },
  });
  console.log(`✅ Administrador general: ${adminData.correo}`);

  // 2. Personal administrativo de la escuela de sistemas (según página web)
  const administrativos = [
    {
      nombres: 'Deivis Alexander',
      apellidos: 'Valeriano Rodriguez',
      dni: null, // no se tiene
      cargo: 'Administrador de Centro de Cómputo',
      rol: 'operador_horarios',
    },
    {
      nombres: 'Jeancarlos Josue',
      apellidos: 'Ramirez Garcia',
      dni: null,
      cargo: 'Administrador de Centro de Cómputo',
      rol: 'operador_horarios',
    },
    {
      nombres: 'Doris Elizabeth',
      apellidos: 'Briones Heras',
      dni: null,
      cargo: 'Secretaria de Escuela',
      rol: 'operador_horarios',
    },
  ];

  for (const admin of administrativos) {
    const correo = generarCorreo(admin.nombres, admin.apellidos);
    const dni = admin.dni || '99999999';
    const contrasenaHash = await bcrypt.hash(dni, 10);
    await prisma.usuario.upsert({
      where: { correo_electronico: correo },
      update: {},
      create: {
        codigo: `ADM_${admin.apellidos.replace(/\s/g, '')}_${admin.nombres.split(' ')[0]}`,
        nombres: admin.nombres,
        apellidos: admin.apellidos,
        dni: dni,
        correo_electronico: correo,
        contrasena_hash: contrasenaHash,
        rol: admin.rol,
      },
    });
    console.log(`✅ Personal: ${admin.nombres} ${admin.apellidos} (${correo}) - ${admin.cargo}`);
  }

  const totalUsuarios = await prisma.usuario.count();
  console.log(`✅ Total usuarios sembrados: ${totalUsuarios}\n`);
}