import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rolMap: Record<string, string> = {
      administrador_sistema: "Administrador del Sistema",
      director_escuela: "Director de Escuela",
      coordinador_academico: "Coordinador Académico",
      operador_horarios: "Operador de Horarios",
      docente: "Docente",
    };

    return NextResponse.json({
      name: session.user.name,
      email: session.user.email,
      rol: rolMap[session.user.rol] || session.user.rol,
      rolCode: session.user.rol,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
  }
}
