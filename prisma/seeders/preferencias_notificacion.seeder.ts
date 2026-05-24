// prisma/seeders/11_preferencias_notificacion.seeder.ts
import { PrismaClient } from '@prisma/client';

export async function seedPreferenciasNotificacion(prisma: PrismaClient) {
  console.log('🌱 Sembrando preferencias de notificación para docentes...');

  // Obtener todos los docentes activos con su correo
  const docentes = await prisma.docente.findMany({
    where: { activo: true },
    select: {
      id_docente: true,
      correo_electronico: true,
    },
  });

  let insertados = 0;

  for (const docente of docentes) {
    if (!docente.correo_electronico) {
      console.warn(`⚠️ Docente ID ${docente.id_docente} no tiene correo electrónico. Se omitirá preferencia de correo.`);
      continue;
    }

    // Preferencia para correo electrónico (activo por defecto)
    const datosContacto = { correo: docente.correo_electronico };
    await prisma.preferenciasNotificacionDocente.upsert({
      where: {
        id_docente_canal: {
          id_docente: docente.id_docente,
          canal: 'correo',
        },
      },
      update: {
        activo: true,
        datos_contacto: datosContacto,
        verificado: true, // se asume verificado porque el correo ya está registrado
        fecha_verificacion: new Date(),
      },
      create: {
        id_docente: docente.id_docente,
        canal: 'correo',
        activo: true,
        datos_contacto: datosContacto,
        verificado: true,
        fecha_verificacion: new Date(),
      },
    });

    insertados++;
  }

  // Opcional: crear preferencias para WhatsApp y Telegram pero inactivas
  // (los docentes las activarán manualmente luego)
  // No se insertan por defecto para no llenar la tabla con registros inactivos.
  // Si se desea tener un registro aunque esté inactivo, se puede descomentar el bloque siguiente.

  /*
  for (const docente of docentes) {
    // WhatsApp
    await prisma.preferenciasNotificacionDocente.upsert({
      where: {
        id_docente_canal: {
          id_docente: docente.id_docente,
          canal: 'whatsapp',
        },
      },
      update: { activo: false, datos_contacto: {} },
      create: {
        id_docente: docente.id_docente,
        canal: 'whatsapp',
        activo: false,
        datos_contacto: {},
      },
    });
    // Telegram
    await prisma.preferenciasNotificacionDocente.upsert({
      where: {
        id_docente_canal: {
          id_docente: docente.id_docente,
          canal: 'telegram',
        },
      },
      update: { activo: false, datos_contacto: {} },
      create: {
        id_docente: docente.id_docente,
        canal: 'telegram',
        activo: false,
        datos_contacto: {},
      },
    });
  }
  */

  console.log(`✅ ${insertados} preferencias de notificación (correo) activadas.`);
}