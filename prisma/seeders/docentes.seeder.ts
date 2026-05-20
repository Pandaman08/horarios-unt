import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedDocentes(prisma: PrismaClient) {
  console.log('-> Sembrando Docentes...');
  
  const passwordHash = await bcrypt.hash('123456', 10);
  
  const docentesData = [
    { codigo: 'DOC001', nombres: 'Roberto', apellidos: 'García', modalidad: 'nombrado', categoria: 'principal', tel: '987654321', correo: 'ronabuve7@gmail.com', esp: 'Ingeniería de Software' },
    { codigo: 'DOC002', nombres: 'Ana', apellidos: 'Martínez', modalidad: 'nombrado', categoria: 'asociado', tel: '912345678', correo: 'ana.martinez@unt.edu.pe', esp: 'Inteligencia Artificial' },
    { codigo: 'DOC003', nombres: 'Carlos', apellidos: 'Sánchez', modalidad: 'contratado', categoria: 'auxiliar', tel: '923456789', correo: 'carlos.sanchez@unt.edu.pe', esp: 'Redes y Comunicaciones' },
    { codigo: 'DOC004', nombres: 'Elena', apellidos: 'Rodríguez', modalidad: 'nombrado', categoria: 'principal', tel: '934567890', correo: 'elena.rodriguez@unt.edu.pe', esp: 'Bases de Datos' },
    { codigo: 'DOC005', nombres: 'Luis', apellidos: 'Pérez', modalidad: 'contratado', categoria: 'auxiliar', tel: '945678901', correo: 'luis.perez@unt.edu.pe', esp: 'Sistemas Distribuidos' },
    { codigo: 'DOC006', nombres: 'María', apellidos: 'López', modalidad: 'nombrado', categoria: 'asociado', tel: '956789012', correo: 'maria.lopez@unt.edu.pe', esp: 'Seguridad Informática' },
    { codigo: 'DOC007', nombres: 'Jorge', apellidos: 'Ramírez', modalidad: 'contratado', categoria: 'jefe_practica', tel: '967890123', correo: 'jorge.ramirez@unt.edu.pe', esp: 'Ciencia de Datos' },
  ];

  const docentes = [];
  for (const d of docentesData) {
    // Crear Usuario primero
    const usuario = await prisma.usuario.upsert({
      where: { codigo: d.codigo },
      update: { 
        correo_electronico: d.correo,
        contrasena_hash: passwordHash
      },
      create: {
        codigo: d.codigo,
        nombres: d.nombres,
        apellidos: d.apellidos,
        correo_electronico: d.correo,
        contrasena_hash: passwordHash,
        rol: 'docente'
      }
    });

    const docente = await prisma.docente.upsert({
      where: { codigo_docente: d.codigo },
      update: { id_usuario: usuario.id_usuario },
      create: {
        codigo_docente: d.codigo,
        nombres: d.nombres,
        apellidos: d.apellidos,
        modalidad: d.modalidad,
        categoria: d.categoria,
        dedicacion: 'tiempo_completo',
        antiguedad: Math.floor(Math.random() * 20),
        correo_electronico: d.correo,
        telefono: d.tel,
        especialidad: d.esp,
        id_usuario: usuario.id_usuario
      }
    });
    docentes.push(docente);
  }
  return docentes;
}
