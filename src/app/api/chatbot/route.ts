import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroqClient } from '@/services/ai/GroqClient';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history, currentModule } = body;
    console.log('Chatbot API received:', { message, currentModule, userRole: session.user.rol });

    // Obtener docenteId si el usuario es docente
    let docenteId: number | undefined;
    if (session.user.rol === 'docente') {
      const docente = await prisma.docente.findFirst({
        where: { id_usuario: session.user.id }
      });
      docenteId = docente?.id_docente;
    }

    // Obtener IP address
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

    const aiResponse = await GroqClient.generateResponse(
      message,
      history || [],
      {
        name: session.user.name,
        role: session.user.rol,
        currentModule: currentModule || 'Dashboard',
        userId: session.user.id_usuario,
        docenteId,
        ipAddress
      }
    );
    console.log('[API Route] aiResponse from GroqClient:', aiResponse);

    return NextResponse.json({
      response: aiResponse,
    });
  } catch (error) {
    console.error('Chatbot API Error:', error);
    return NextResponse.json({ error: 'Error interno al procesar la consulta' }, { status: 500 });
  }
}
