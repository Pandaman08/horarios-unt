import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GestorVentanasAtencion } from '@/services/ventanas/GestorVentanasAtencion';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Los administradores y operadores siempre tienen acceso
  if (['administrador_sistema', 'operador_horarios'].includes(session.user.rol)) {
    return NextResponse.json({ tieneAcceso: true });
  }

  // Si es docente, verificar su ventana
  if (session.user.rol === 'docente') {
    const docente = await prisma.docente.findFirst({
      where: { id_usuario: session.user.id_usuario }
    });

    if (!docente) {
      return NextResponse.json({ tieneAcceso: false, mensaje: 'Perfil de docente no encontrado' });
    }

    const resultado = await GestorVentanasAtencion.verificarAccesoDocente(docente.id_docente);
    return NextResponse.json(resultado);
  }

  return NextResponse.json({ tieneAcceso: false, mensaje: 'Rol no autorizado' });
}
