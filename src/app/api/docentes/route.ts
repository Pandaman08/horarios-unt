import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      include: {
        docente_cursos: {
          include: {
            curso: true
          }
        },
        usuario: {
          select: {
            id_usuario: true,
            codigo: true,
            correo_electronico: true
          }
        }
      },
      orderBy: [
        { modalidad: 'asc' }, // nombrado < contratado (depende del orden alfabético, ajustar si es necesario)
        { categoria: 'asc' }, // principal < asociado < auxiliar < jefe_practica
        { antiguedad: 'desc' }
      ]
    });
    return NextResponse.json(docentes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener docentes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Iniciar transacción para crear Usuario y Docente
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el Usuario para el Docente
      const password = data.contrasena || data.codigo_docente; // Password por defecto es su código si no se envía
      const contrasena_hash = await bcrypt.hash(password, 10);
      
      const usuario = await tx.usuario.create({
        data: {
          codigo: data.codigo_docente,
          nombres: data.nombres,
          apellidos: data.apellidos,
          correo_electronico: data.correo_electronico,
          contrasena_hash,
          rol: 'docente',
          activo: true
        }
      });

      // 2. Crear el Docente vinculado al Usuario
      const docente = await tx.docente.create({
        data: {
          id_usuario: usuario.id_usuario,
          codigo_docente: data.codigo_docente,
          nombres: data.nombres,
          apellidos: data.apellidos,
          modalidad: data.modalidad,
          categoria: data.categoria,
          dedicacion: data.dedicacion,
          antiguedad: parseInt(data.antiguedad) || 0,
          fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
          correo_electronico: data.correo_electronico,
          telefono: data.telefono,
          grado_academico: data.grado_academico,
          especialidad: data.especialidad,
          horas_maximas_semanales: parseInt(data.horas_maximas_semanales) || 40,
          activo: true
        }
      });

      return docente;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El código o correo ya está en uso' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear docente y usuario' }, { status: 500 });
  }
}
