import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedMain(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('123456', 10);

  // 0. Usuarios Administrativos
  console.log('-> Sembrando Usuarios Administrativos...');
  await prisma.usuario.upsert({
    where: { codigo: 'ADMIN001' },
    update: { contrasena_hash: passwordHash },
    create: {
      codigo: 'ADMIN001',
      nombres: 'Admin',
      apellidos: 'Sistema',
      correo_electronico: 'admin@unt.edu.pe',
      contrasena_hash: passwordHash,
      rol: 'administrador_sistema'
    }
  });

  await prisma.usuario.upsert({
    where: { codigo: 'OPER001' },
    update: { contrasena_hash: passwordHash },
    create: {
      codigo: 'OPER001',
      nombres: 'Juan',
      apellidos: 'Operador',
      correo_electronico: 'operador@unt.edu.pe',
      contrasena_hash: passwordHash,
      rol: 'operador_horarios'
    }
  });

  // 1. Periodo Académico
  console.log('-> Sembrando Periodo...');
  const periodo = await prisma.periodoAcademico.upsert({
    where: { codigo: '2026-I' },
    update: { activo: true, estado: 'planificacion' },
    create: {
      codigo: '2026-I',
      nombre: 'Semestre 2026 - I',
      anio: 2026,
      semestre: 1,
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-08-31'),
      activo: true,
      estado: 'planificacion'
    }
  });

  // 2. Ventanas de Atención
  console.log('-> Sembrando Ventanas...');
  const ventanasData = [
    { fecha: new Date('2026-03-20'), modalidad: 'nombrado', categoria: 'principal', hora_inicio: '08:00', hora_fin: '12:00', completado: true },
    { fecha: new Date(), modalidad: 'nombrado', categoria: 'asociado', hora_inicio: '08:00', hora_fin: '18:00', completado: false },
    { fecha: new Date('2026-04-05'), modalidad: 'contratado', categoria: 'auxiliar', hora_inicio: '09:00', hora_fin: '13:00', completado: false },
  ];

  const ventanas = [];
  for (const v of ventanasData) {
    const ventana = await prisma.ventanaAtencion.create({
      data: {
        ...v,
        id_periodo: periodo.id_periodo,
        orden_prioridad: 1,
        cantidad_docentes: 10,
        activo: true
      }
    });
    ventanas.push(ventana);
  }

  return { periodo, ventanas };
}
