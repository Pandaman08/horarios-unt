import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    const id_ambiente = searchParams.get('id_ambiente');
    const id_docente = searchParams.get('id_docente');

    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    // Verificar si hay ventanas de tiempo para este período (modo intervalo)
    const ventanas = await prisma.ventanaAtencion.count({
      where: { id_periodo: parseInt(id_periodo) }
    });

    const esModoIntervalo = ventanas > 0;

    // Lógica para filtrar horarios:
    // 1. En modo INTERVALO:
    //    - Mostrar TODOS los horarios CONFIRMADOS (de cualquier docente)
    //    - Mostrar los horarios temporales SOLO del docente actual
    // 2. En modo AUTOMÁTICO:
    //    - Mostrar todos los horarios con filtro de ambiente
    
    // Primero: OBTENER TODOS LOS HORARIOS CONFIRMADOS (estos no cambian y deben estar visibles para todos)
    const whereConfirmados: any = { 
      id_periodo: parseInt(id_periodo), 
      OR: [
        { estado: 'confirmado' },
        { estado: 'definitivo' }
      ]
    };
    
    if (id_ambiente) {
      whereConfirmados.id_ambiente = parseInt(id_ambiente);
    }
    
    // Segundo: OBTENER LOS HORARIOS TEMPORALES SOLO DEL DOCENTE ACTUAL
    const whereTemporales: any = { 
      id_periodo: parseInt(id_periodo),
      fecha_expiracion: { gt: new Date() }
    };
    
    if (esModoIntervalo && id_docente) {
      // En modo intervalo: SOLO temporales del docente actual
      whereTemporales.id_docente = parseInt(id_docente);
    } else {
      // En modo automático: todos los temporales, filtrados por ambiente
      if (id_ambiente) {
        whereTemporales.id_ambiente = parseInt(id_ambiente);
      }
      // Y también incluimos los del docente actual para que siempre los vea
      if (id_docente) {
        whereTemporales.OR = [
          { id_docente: parseInt(id_docente) },
          { id_ambiente: id_ambiente ? parseInt(id_ambiente) : undefined }
        ];
      }
    }

    // Obtener horarios CONFIRMADOS (estos son visibles para todos)
    const asignaciones = await prisma.horarioAsignado.findMany({
      where: whereConfirmados,
      include: {
        docente: true,
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    // Obtener horarios TEMPORALES (solo del docente actual en modo intervalo)
    const temporales = await prisma.seleccionTemporalHorario.findMany({
      where: whereTemporales,
      include: {
        docente: true,
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    return NextResponse.json({
      asignaciones,
      temporales
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 });
  }
}
