import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroqClient } from '@/services/ai/GroqClient';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { message, history, currentModule } = body;
    console.log('Chatbot API received:', { message, currentModule, userRole: session?.user?.rol });

    // Construir contexto seguro
    const context = {
      name: session?.user?.name,
      role: session?.user?.rol,
      currentModule: currentModule || 'Dashboard',
    };

    const aiResponse = await GroqClient.generateResponse(message, history || [], context);
    console.log('[API Route] aiResponse from GroqClient:', aiResponse);

    return NextResponse.json({ 
      response: aiResponse,
    });
  } catch (error) {
    console.error('Chatbot API Error:', error);
    return NextResponse.json({ error: 'Error interno al procesar la consulta' }, { status: 500 });
  }
}
