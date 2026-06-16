import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ServicioHorariosDocente } from '@/services/horarios/ServicioHorariosDocente';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id_usuario) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodoId = searchParams.get('periodoId');

    // Buscar el docente por el id_usuario de la sesión
    const docente = await prisma.docente.findUnique({
      where: { id_usuario: session.user.id_usuario }
    });

    if (!docente) {
      return NextResponse.json(
        { error: 'Usuario no es docente' },
        { status: 403 }
      );
    }

    const resultado = await ServicioHorariosDocente.obtenerHorarioDocente(
      docente.id_docente,
      periodoId ? parseInt(periodoId) : undefined
    );

    // Si el período no está activo, devolver lista vacía (mismo comportamiento que antes)
    if (!resultado.periodoActivo) {
      return NextResponse.json([]);
    }

    return NextResponse.json(resultado.horarios);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener horarios' },
      { status: 500 }
    );
  }
}
