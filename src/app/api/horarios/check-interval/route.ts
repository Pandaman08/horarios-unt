import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const periodoActivo = await prisma.periodoAcademico.findFirst({
      where: { activo: true },
      orderBy: { id_periodo: 'desc' }
    });

    if (!periodoActivo) {
      return NextResponse.json({ 
        tieneAcceso: true, 
        soloLectura: false,
        mensaje: 'No hay período activo' 
      });
    }

    const horariosGenerados = await prisma.horarioAsignado.count({
      where: { id_periodo: periodoActivo.id_periodo }
    });

    if (horariosGenerados === 0) {
      return NextResponse.json({ 
        tieneAcceso: true, 
        soloLectura: false,
        mensaje: 'No hay horarios generados aún' 
      });
    }

    if (session.user.rol === 'docente') {
      const docente = await prisma.docente.findFirst({
        where: { id_usuario: session.user.id_usuario }
      });

      if (!docente) {
        return NextResponse.json({ tieneAcceso: false, mensaje: 'Docente no encontrado' });
      }

      const horariosPendientes = await prisma.horarioAsignado.findMany({
        where: {
          id_docente: docente.id_docente,
          id_periodo: periodoActivo.id_periodo,
          estado: 'pendiente'
        }
      });

      const horariosConfirmados = await prisma.horarioAsignado.findMany({
        where: {
          id_docente: docente.id_docente,
          id_periodo: periodoActivo.id_periodo,
          estado: { in: ['confirmado', 'definitivo'] }
        }
      });

      let segundosRestantes = null;
      let mensaje = '';
      let soloLectura = false;

      // Primero checar la ventana (siempre!)
      const docentes = await prisma.docente.findMany({
        where: { 
          activo: true,
          declaraciones_horarias: {
            some: {
              id_periodo: periodoActivo.id_periodo,
              estado: "APROBADO"
            }
          }
        }
      });

      const prioridadCategoria = ["jefe_practica", "auxiliar", "asociado", "principal"];
      const docentesOrdenados = [...docentes].sort((a, b) => {
        if (a.modalidad === "nombrado" && b.modalidad !== "nombrado") return -1;
        if (b.modalidad === "nombrado" && a.modalidad !== "nombrado") return 1;
        
        const catA = prioridadCategoria.indexOf(a.categoria);
        const catB = prioridadCategoria.indexOf(b.categoria);
        if (catA !== catB) return catB - catA;
        
        if (a.fecha_ingreso && b.fecha_ingreso) {
          return new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime();
        }
        return 0;
      });

      const indexDocente = docentesOrdenados.findIndex((d: any) => d.id_docente === docente.id_docente);
      const ventanas = await prisma.ventanaAtencion.findMany({
        where: { id_periodo: periodoActivo.id_periodo },
        orderBy: { orden_prioridad: 'asc' }
      });

      if (indexDocente !== -1 && ventanas.length > indexDocente) {
        const ventanaDocente = ventanas[indexDocente];
        const ahora = new Date();
        const fechaInicio = new Date(ventanaDocente.fecha);
        const [horasInicio, minutosInicio] = ventanaDocente.hora_inicio.split(':').map(Number);
        const [horasFin, minutosFin] = ventanaDocente.hora_fin.split(':').map(Number);
        
        fechaInicio.setHours(horasInicio, minutosInicio, 0, 0);
        const fechaFin = new Date(fechaInicio);
        fechaFin.setHours(horasFin, minutosFin, 0, 0);

        if (ahora < fechaInicio) {
          mensaje = `Tu ventana empieza a las ${ventanaDocente.hora_inicio}`;
          soloLectura = true;
          segundosRestantes = null;
        } else if (ahora >= fechaInicio && ahora <= fechaFin) {
          mensaje = 'Es tu turno! Edita tu horario';
          soloLectura = false;
          segundosRestantes = Math.floor((fechaFin.getTime() - ahora.getTime()) / 1000);
        } else {
          mensaje = 'Tu ventana ya terminó';
          soloLectura = true;
          segundosRestantes = 0;
        }
      } else {
        mensaje = 'No tienes ventana asignada';
        soloLectura = true;
        segundosRestantes = null;
      }

      // Ahora checar horarios confirmados
      if (horariosConfirmados.length > 0 && horariosPendientes.length === 0 && segundosRestantes === 0) {
        return NextResponse.json({ 
          tieneAcceso: true, 
          soloLectura: true,
          mensaje: 'Viendo horario confirmado' 
        });
      }

      // Si no hay horarios generados aún, pero es su ventana, permitir editar
      if (horariosGenerados === 0) {
        return NextResponse.json({ 
          tieneAcceso: true, 
          soloLectura: soloLectura,
          mensaje: mensaje || 'Selecciona tus horarios',
          modo: 'edicion',
          segundos_restantes: segundosRestantes
        });
      }

      if (horariosPendientes.length > 0) {
        return NextResponse.json({ 
          tieneAcceso: true, 
          soloLectura: soloLectura,
          mensaje: mensaje,
          modo: 'edicion',
          segundos_restantes: segundosRestantes
        });
      }

      return NextResponse.json({ 
        tieneAcceso: true, 
        soloLectura: soloLectura,
        mensaje: mensaje || 'Horario confirmado automáticamente',
        segundos_restantes: segundosRestantes
      });
    }

    return NextResponse.json({ tieneAcceso: true });

  } catch (error) {
    console.error('Error en check-interval:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
