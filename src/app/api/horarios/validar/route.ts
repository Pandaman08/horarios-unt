import { NextResponse } from 'next/server';
import { ValidadorHorario, SolicitudAsignacion } from '@/services/horarios/ValidadorHorario';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Mapear campos si vienen en snake_case
    const solicitud: SolicitudAsignacion = {
      docenteId: data.docenteId || parseInt(data.id_docente),
      cursoId: data.cursoId || parseInt(data.id_curso),
      grupoId: data.grupoId || parseInt(data.id_grupo),
      tipoClase: data.tipoClase || data.tipo_clase,
      ambienteId: data.ambienteId || parseInt(data.id_ambiente),
      diaSemana: data.diaSemana || parseInt(data.dia_semana),
      horaInicio: data.horaInicio || data.hora_inicio,
      horaFin: data.horaFin || data.hora_fin,
      periodoId: data.periodoId || parseInt(data.id_periodo),
      asignacionId: data.asignacionId || data.id_asignacion,
    };

    // Ejecutar validaciones
    const resultado = await ValidadorHorario.validarAsignacion(solicitud);
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error en API validar:', error);
    return NextResponse.json({ 
      valido: false, 
      conflictos: [{
        tipo: 'ERROR_SISTEMA',
        mensaje: 'Error interno al procesar la validación',
        severidad: 'ERROR'
      }],
      tiempoValidacion: 0
    }, { status: 500 });
  }
}
