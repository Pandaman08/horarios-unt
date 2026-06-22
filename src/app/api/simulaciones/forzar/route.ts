import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// In-memory storage for forced results
const forcedResults = new Map<string, any>();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const key = `${data.docenteId}-${data.tipo}`;
    let resultado;
    try {
      resultado = JSON.parse(data.resultado);
    } catch (e) {
      resultado = data.resultado;
    }
    forcedResults.set(key, resultado);
    
    return NextResponse.json({ success: true, key, resultado });
  } catch (error) {
    console.error('Error forcing result:', error);
    return NextResponse.json({ error: 'Error al forzar resultado' }, { status: 500 });
  }
}

export function getForcedResult(docenteId: number, tipo: string) {
  const key = `${docenteId}-${tipo}`;
  return forcedResults.get(key);
}
