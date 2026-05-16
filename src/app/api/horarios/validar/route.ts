import { NextResponse } from 'next/server';
import { ValidadorHorario } from '@/services/horarios/ValidadorHorario';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const resultado = await ValidadorHorario.validarAsignacion(data);
    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json({ valido: false, error: 'Error interno en validación' }, { status: 500 });
  }
}
