import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const docentes = await prisma.docente.findMany({
      orderBy: { apellidos: 'asc' },
      include: {
        usuario: {
          select: {
            correo_electronico: true,
            rol: true
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

    // 2. Crear Usuario
    const contrasena_hash = await bcrypt.hash(data.contrasena || 'docente123', 10);
    const usuario = await prisma.usuario.create({
      data: {
        codigo: codigo_docente,
        nombres: data.nombres,
        apellidos: data.apellidos,
        correo_electronico: data.correo_electronico,
        contrasena_hash,
        rol: 'docente',
        activo: true
      }
    });

    // 3. Crear Docente vinculado al usuario
    const docente = await prisma.docente.create({
      data: {
        codigo_docente,
        nombres: data.nombres,
        apellidos: data.apellidos,
        correo_electronico: data.correo_electronico,
        telefono: data.telefono,
        categoria: data.categoria,
        especialidad: data.especialidad,
        grado_academico: data.grado_academico,
        fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
        id_usuario: usuario.id_usuario,
        activo: true
      }
    });

    return NextResponse.json(docente);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El código o correo ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear docente y usuario' }, { status: 500 });
  }
}
