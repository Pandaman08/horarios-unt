import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Tipo inferido para DocenteCurso con curso y grupos
type DocenteCursoWithGrupos = Prisma.DocenteCursoGetPayload<{
  include: {
    curso: {
      include: {
        grupos: true;
      };
    };
  };
}>;

// Tipos para asignaciones
type HorarioAsignadoType = Prisma.HorarioAsignadoGetPayload<object>;

type SeleccionTemporalType =
  Prisma.SeleccionTemporalHorarioGetPayload<object>;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id_periodo = searchParams.get('id_periodo');
    const id_docente_manual = searchParams.get('id_docente_manual');

    if (!id_periodo) {
      return NextResponse.json(
        { error: 'Falta id_periodo' },
        { status: 400 }
      );
    }

    const periodoId = parseInt(id_periodo, 10);

    if (isNaN(periodoId)) {
      return NextResponse.json(
        { error: 'id_periodo debe ser un número válido' },
        { status: 400 }
      );
    }

    let docenteId: number;

    // Admin u operador
    if (
      id_docente_manual &&
      (
        session.user.rol === 'administrador_sistema' ||
        session.user.rol === 'operador_horarios'
      )
    ) {
      const parsedDocenteId = parseInt(id_docente_manual, 10);

      if (isNaN(parsedDocenteId)) {
        return NextResponse.json(
          { error: 'id_docente_manual debe ser un número válido' },
          { status: 400 }
        );
      }

      docenteId = parsedDocenteId;
    } else {
      const docente = await prisma.docente.findFirst({
        where: {
          id_usuario: String(session.user.id_usuario),
        },
      });

      if (!docente) {
        return NextResponse.json(
          { error: 'Docente no encontrado' },
          { status: 404 }
        );
      }

      docenteId = docente.id_docente;
    }

    // Cursos asignados
    const cursosAsignados: DocenteCursoWithGrupos[] =
      await prisma.docenteCurso.findMany({
        where: {
          id_docente: docenteId,
          activo: true,
        },
        include: {
          curso: {
            include: {
              grupos: {
                where: {
                  id_periodo: periodoId,
                  activo: true,
                },
              },
            },
          },
        },
      });

    // Filtrar cursos con grupos
    const cursosConGrupos: DocenteCursoWithGrupos[] =
      cursosAsignados.filter(
        (dc: DocenteCursoWithGrupos) =>
          dc.curso.grupos.length > 0
      );

    // Eliminar duplicados
    const uniqueKeys: string[] = Array.from(
      new Set(
        cursosConGrupos.map(
          (c: DocenteCursoWithGrupos) =>
            `${c.id_curso}-${c.tipo_clase.toLowerCase()}`
        )
      )
    );

    const uniqueCursos: DocenteCursoWithGrupos[] =
      uniqueKeys
        .map((key: string) => {
          const [id, tipo] = key.split('-');

          return cursosConGrupos.find(
            (c: DocenteCursoWithGrupos) =>
              c.id_curso === parseInt(id, 10) &&
              c.tipo_clase.toLowerCase() === tipo
          );
        })
        .filter(
          (
            c
          ): c is DocenteCursoWithGrupos =>
            c !== undefined
        );

    // Calcular progreso
    const progreso = await Promise.all(
      uniqueCursos.map(
        async (dc: DocenteCursoWithGrupos) => {
          const asignaciones: HorarioAsignadoType[] =
            await prisma.horarioAsignado.findMany({
              where: {
                id_docente: docenteId,
                id_curso: dc.id_curso,
                tipo_clase: dc.tipo_clase,
                id_periodo: periodoId,
              },
            });

          const temporales: SeleccionTemporalType[] =
            await prisma.seleccionTemporalHorario.findMany({
              where: {
                id_docente: docenteId,
                id_curso: dc.id_curso,
                tipo_clase: dc.tipo_clase,
                id_periodo: periodoId,
                fecha_expiracion: {
                  gt: new Date(),
                },
              },
            });

          let minutosTotales = 0;

          const calcularMinutos = (
            hInicio: string | null,
            hFin: string | null
          ): number => {
            if (!hInicio || !hFin) return 0;

            const [h1, m1] = hInicio
              .split(':')
              .map(Number);

            const [h2, m2] = hFin
              .split(':')
              .map(Number);

            return (h2 * 60 + m2) - (h1 * 60 + m1);
          };

          asignaciones.forEach(
            (a: HorarioAsignadoType) => {
              minutosTotales += calcularMinutos(
                a.hora_inicio,
                a.hora_fin
              );
            }
          );

          temporales.forEach(
            (t: SeleccionTemporalType) => {
              minutosTotales += calcularMinutos(
                t.hora_inicio,
                t.hora_fin
              );
            }
          );

          let horasRequeridas = 0;

          const tipo = dc.tipo_clase.toLowerCase();

          if (tipo.includes('teoria')) {
            horasRequeridas =
              dc.curso.horas_teoria ?? 0;
          } else if (
            tipo.includes('laboratorio')
          ) {
            horasRequeridas =
              dc.curso.horas_laboratorio ?? 0;
          } else if (
            tipo.includes('practica') ||
            tipo.includes('práctica')
          ) {
            horasRequeridas =
              dc.curso.horas_practica ?? 0;
          }

          return {
            id_curso: dc.id_curso,
            nombre: dc.curso.nombre,
            codigo: dc.curso.codigo,
            tipo_clase: dc.tipo_clase,
            horas_requeridas: horasRequeridas,
            horas_asignadas: minutosTotales / 60,
            confirmado: asignaciones.length > 0,
          };
        }
      )
    );

    return NextResponse.json(progreso);
  } catch (error) {
    console.error('Error en mis-cursos:', error);

    return NextResponse.json(
      { error: 'Error al obtener progreso' },
      { status: 500 }
    );
  }
}