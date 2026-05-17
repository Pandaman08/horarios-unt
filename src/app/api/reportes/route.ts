import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeneradorPDF } from '@/services/reportes/GeneradorPDF';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // docente, aula, gestion
    const id = searchParams.get('id'); // id_docente o id_ambiente
    const id_periodo = searchParams.get('id_periodo');

    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    let htmlContent = '';
    let reportTitle = '';

    if (tipo === 'docente') {
      const docente = await prisma.docente.findUnique({
        where: { id_docente: parseInt(id!) },
        include: {
          horarios_asignados: {
            where: { id_periodo: parseInt(id_periodo) },
            include: { curso: true, ambiente: true, grupo: true }
          }
        }
      });
      if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });

      reportTitle = `Horario del Docente: ${docente.nombres} ${docente.apellidos}`;
      htmlContent = `
        <div class="mb-6">
          <p><strong>Código:</strong> ${docente.codigo_docente}</p>
          <p><strong>Modalidad:</strong> ${docente.modalidad.toUpperCase()} - ${docente.categoria.replace('_', ' ').toUpperCase()}</p>
        </div>
        <table class="w-full print-table">
          <thead>
            <tr>
              <th>Día</th>
              <th>Horario</th>
              <th>Curso</th>
              <th>Grupo</th>
              <th>Ambiente</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            ${docente.horarios_asignados.sort((a,b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)).map(h => `
              <tr>
                <td>${['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][h.dia_semana]}</td>
                <td>${h.hora_inicio} - ${h.hora_fin}</td>
                <td>${h.curso.nombre}</td>
                <td>${h.grupo.codigo_grupo}</td>
                <td>${h.ambiente.nombre}</td>
                <td class="capitalize">${h.tipo_clase}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (tipo === 'aula') {
      const ambiente = await prisma.ambiente.findUnique({
        where: { id_ambiente: parseInt(id!) },
        include: {
          horarios_asignados: {
            where: { id_periodo: parseInt(id_periodo) },
            include: { curso: true, docente: true, grupo: true }
          }
        }
      });
      if (!ambiente) return NextResponse.json({ error: 'Ambiente no encontrado' }, { status: 404 });

      reportTitle = `Horario del Ambiente: ${ambiente.nombre}`;
      htmlContent = `
        <div class="mb-6">
          <p><strong>Tipo:</strong> ${ambiente.tipo.toUpperCase()}</p>
          <p><strong>Capacidad:</strong> ${ambiente.capacidad} personas</p>
        </div>
        <table class="w-full print-table">
          <thead>
            <tr>
              <th>Día</th>
              <th>Horario</th>
              <th>Curso</th>
              <th>Docente</th>
              <th>Grupo</th>
            </tr>
          </thead>
          <tbody>
            ${ambiente.horarios_asignados.sort((a,b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)).map(h => `
              <tr>
                <td>${['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][h.dia_semana]}</td>
                <td>${h.hora_inicio} - ${h.hora_fin}</td>
                <td>${h.curso.nombre}</td>
                <td>${h.docente.nombres} ${h.docente.apellidos}</td>
                <td>${h.grupo.codigo_grupo}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 });
    }

    const fullHTML = GeneradorPDF.wrapLayout(htmlContent, reportTitle);
    const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 });
  }
}
