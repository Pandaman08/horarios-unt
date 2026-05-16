import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GestorSeleccionTemporal } from '@/services/horarios/GestorSeleccionTemporal';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id_seleccion } = await request.json();
    if (!id_seleccion) return NextResponse.json({ error: 'Falta id_seleccion' }, { status: 400 });

    const asignacion = await GestorSeleccionTemporal.confirmarSeleccion(
      id_seleccion,
      parseInt(session.user.id_usuario)
    );

    return NextResponse.json({ success: true, asignacion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al confirmar' }, { status: 500 });
  }
}
