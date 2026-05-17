import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GestorSeleccionTemporal } from '@/services/horarios/GestorSeleccionTemporal';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id_periodo } = await request.json();
    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    const docente = await prisma.docente.findFirst({
      where: { id_usuario: parseInt(session.user.id_usuario) }
    });

    if (!docente) return NextResponse.json({ error: 'Perfil de docente no encontrado' }, { status: 404 });

    const asignaciones = await GestorSeleccionTemporal.confirmarTodo(
      docente.id_docente,
      parseInt(id_periodo),
      parseInt(session.user.id_usuario)
    );

    return NextResponse.json({ success: true, count: asignaciones.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al confirmar' }, { status: 500 });
  }
}
