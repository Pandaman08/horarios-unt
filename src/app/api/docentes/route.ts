import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamentoId');
    const facultadId = searchParams.get('facultadId');

    const where: any = {};
    if (departamentoId) {
      where.departamentoId = departamentoId;
    }
    if (facultadId) {
      where.facultadId = facultadId;
    }

    const docentes = await prisma.docente.findMany({
      where,
      orderBy: { apellidos: 'asc' },
      include: {
        usuario: {
          select: {
            correo_electronico: true,
            rol: true
          }
        },
        facultad: true,
        departamento: true,
        docente_cursos: {
          include: {
            curso: true
          }
        }
      }
    });
    return NextResponse.json(docentes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener docentes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 1. Generar código si no viene
    let codigo_docente = data.codigo_docente;
    if (!codigo_docente) {
      const lastDocente = await prisma.docente.findFirst({
        orderBy: { id_docente: 'desc' },
        select: { codigo_docente: true }
      });
      let nextNumber = 1;
      if (lastDocente && lastDocente.codigo_docente) {
        const match = lastDocente.codigo_docente.match(/\d+$/);
        if (match) nextNumber = parseInt(match[0]) + 1;
      }
      const year = new Date().getFullYear().toString().slice(-2);
      codigo_docente = `D${year}${nextNumber.toString().padStart(4, '0')}`;
    }

    // Process enum fields: convert empty string to null
    const processEnum = (value: string | null | undefined) => value && value.trim() !== "" ? value : null;

    // 2. Crear Docente sin Usuario
    const docente = await prisma.docente.create({
      data: {
        codigo_docente,
        nombres: data.nombres,
        apellidos: data.apellidos,
        correo_electronico: data.correo_electronico,
        telefono: data.telefono,
        especialidad: data.especialidad,
        grado_academico: data.grado_academico,
        fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
        activo: true,
        facultadId: data.facultadId,
        departamentoId: data.departamentoId,
        // New fields
        condicion: processEnum(data.condicion) as any,
        categoriaDocente: data.categoriaDocente,
        regimenDedicacion: data.condicion === 'ORDINARIO' ? processEnum(data.regimenDedicacion) as any : null,
        tipoContrato: data.condicion === 'CONTRATADO' ? processEnum(data.tipoContrato) as any : null,
        tipoExtraordinario: data.condicion === 'EXTRAORDINARIO' ? processEnum(data.tipoExtraordinario) as any : null,
        esInvestigadorAcreditado: data.esInvestigadorAcreditado || false,
        nivelRenacyt: data.nivelRenacyt || null,
        sancionActiva: data.sancionActiva || false,
        sancionHasta: data.sancionHasta ? new Date(data.sancionHasta) : null,
        dni: data.dni
      }
    });

    return NextResponse.json(docente);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El código o correo ya existe' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Error al crear docente: ' + error.message }, { status: 500 });
  }
}
