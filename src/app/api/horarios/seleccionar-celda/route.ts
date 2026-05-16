import { NextResponse } from 'next/server';
import { ValidadorHorario } from '@/services/horarios/ValidadorHorario';
import { GestorSeleccionTemporal } from '@/services/horarios/GestorSeleccionTemporal';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. Validar
    const validacion = await ValidadorHorario.validarAsignacion(data);
    if (!validacion.valido) {
      return NextResponse.json(validacion, { status: 400 });
    }

    // 2. Crear selección temporal
    const seleccion = await GestorSeleccionTemporal.crearSeleccion({
      ...data,
      id_docente: parseInt(data.id_docente),
      id_curso: parseInt(data.id_curso),
      id_grupo: parseInt(data.id_grupo),
      id_ambiente: parseInt(data.id_ambiente),
      id_periodo: parseInt(data.id_periodo),
      dia_semana: parseInt(data.dia_semana),
    });

    return NextResponse.json({ valido: true, seleccion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ valido: false, error: 'Error al seleccionar celda' }, { status: 500 });
  }
}
