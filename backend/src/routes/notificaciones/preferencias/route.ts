import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const docente = await prisma.docente.findFirst({
    where: { id_usuario: parseInt(session.user.id_usuario) },
    include: { preferencias_notificacion: true }
  });

  if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });

  return NextResponse.json(docente.preferencias_notificacion);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const data = await request.json(); // { canal: 'correo' | 'telegram', activo: boolean }
  
  const docente = await prisma.docente.findFirst({
    where: { id_usuario: parseInt(session.user.id_usuario) }
  });

  if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });

  const preferencia = await prisma.preferenciasNotificacionDocente.upsert({
    where: {
      id_docente_canal: {
        id_docente: docente.id_docente,
        canal: data.canal
      }
    },
    update: { activo: data.activo },
    create: {
      id_docente: docente.id_docente,
      canal: data.canal,
      activo: data.activo,
      datos_contacto: data.canal === 'correo' ? { email: session.user.email } : {}
    }
  });

  return NextResponse.json(preferencia);
}
