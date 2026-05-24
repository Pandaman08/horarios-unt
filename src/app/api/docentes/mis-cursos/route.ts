import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    const id_docente_manual = searchParams.get('id_docente_manual');
    
    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    let docenteId: number;

    if (id_docente_manual && (session.user.rol === 'administrador_sistema' || session.user.rol === 'operador_horarios')) {
      docenteId = parseInt(id_docente_manual);
    } else {
      const docente = await prisma.docente.findFirst({
        where: { id_usuario: parseInt(session.user.id_usuario) }
      });
      if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
      docenteId = docente.id_docente;
    }

    const cursosAsignados = await prisma.docenteCurso.findMany({
      where: { id_docente: docenteId, activo: true },
      include: { curso: true }
    });

    // Eliminar posibles duplicados lógicos en la respuesta (por inconsistencias previas)
    const uniqueCursos = Array.from(new Set(cursosAsignados.map(c => `${c.id_curso}-${c.tipo_clase.toLowerCase()}`)))
      .map(key => {
        const [id, tipo] = key.split('-');
        return cursosAsignados.find(c => c.id_curso === parseInt(id) && c.tipo_clase.toLowerCase() === tipo);
      }).filter(Boolean);

    const progreso = await Promise.all(uniqueCursos.map(async (dc: any) => {
      // 1. Asignaciones confirmadas (Estas deben contarse)
      const asignaciones = await prisma.horarioAsignado.findMany({
        where: {
          id_docente: docenteId,
          id_curso: dc.id_curso,
          tipo_clase: dc.tipo_clase,
          id_periodo: parseInt(id_periodo)
        }
      });

      // 2. Selecciones temporales vigentes (Estas también para el progreso en tiempo real)
      const temporales = await prisma.seleccionTemporalHorario.findMany({
        where: {
          id_docente: docenteId,
          id_curso: dc.id_curso,
          tipo_clase: dc.tipo_clase,
          id_periodo: parseInt(id_periodo),
          fecha_expiracion: { gt: new Date() }
        }
      });

      let minutosTotales = 0;
      
      const calcularMinutos = (hInicio: string | null, hFin: string | null) => {
        if (!hInicio || !hFin) return 0;
        const [h1, m1] = hInicio.split(':').map(Number);
        const [h2, m2] = hFin.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
      };

      asignaciones.forEach(a => minutosTotales += calcularMinutos(a.hora_inicio, a.hora_fin));
      temporales.forEach(t => minutosTotales += calcularMinutos(t.hora_inicio, t.hora_fin));

      // Determinar horas requeridas según el tipo de clase
      let horasRequeridas = 0;
      const tipo = dc.tipo_clase.toLowerCase();
      if (tipo.includes('teoria')) horasRequeridas = dc.curso.horas_teoria;
      else if (tipo.includes('laboratorio')) horasRequeridas = dc.curso.horas_laboratorio;
      else if (tipo.includes('practica')) horasRequeridas = dc.curso.horas_practica;
      else if (tipo.includes('práctica')) horasRequeridas = dc.curso.horas_practica;

      return {
        id_curso: dc.id_curso,
        nombre: dc.curso.nombre,
        codigo: dc.curso.codigo,
        tipo_clase: dc.tipo_clase,
        horas_requeridas: horasRequeridas,
        horas_asignadas: minutosTotales / 60,
        confirmado: asignaciones.length > 0 // Añadimos flag para saber si ya hay algo definitivo
      };
    }));

    return NextResponse.json(progreso);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener progreso' }, { status: 500 });
  }
}
