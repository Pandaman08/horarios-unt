import { NextResponse } from 'next/server';
import { setForcedResult } from '@/lib/forcedResults';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    let resultado;
    try {
      resultado = JSON.parse(data.resultado);
    } catch (e) {
      resultado = data.resultado;
    }
    const { key } = setForcedResult(data.docenteId, data.tipo, resultado);
    
    return NextResponse.json({ success: true, key, resultado });
  } catch (error) {
    console.error('Error forcing result:', error);
    return NextResponse.json({ error: 'Error al forzar resultado' }, { status: 500 });
  }
}
