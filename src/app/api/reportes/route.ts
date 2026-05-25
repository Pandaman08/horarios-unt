import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeneradorPDF } from '@/services/reportes/GeneradorPDF';
import { ServicioEstadisticas } from '@/services/reportes/ServicioEstadisticas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const id = searchParams.get('id');
    const id_periodo = searchParams.get('id_periodo');

    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    let htmlContent = '';
    let reportTitle = '';

    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(id_periodo) }
    });

    const generarCabeceraResumen = (titulo: string, valor: string, label: string, infoDerecha?: { label: string, valor: string }) => `
      <div class="highlight-card" style="padding: 15px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="background: #e0e7ff; color: #4338ca; padding: 8px 16px; border-radius: 8px; font-weight: 800; text-transform: uppercase;">
              ${titulo}
            </div>
            <div>
              <p style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin: 0;">${label}</p>
              <p style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0;">${valor}</p>
            </div>
          </div>
          ${infoDerecha ? `
            <div style="text-align: right;">
              <p style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin: 0;">${infoDerecha.label}</p>
              <p style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0;">${infoDerecha.valor}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    if (tipo === 'dia') {
      const diaIndex = parseInt(id!);
      const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const nombreDia = nombresDias[diaIndex] || 'Desconocido';
      
      const horarios = await prisma.horarioAsignado.findMany({
        where: { id_periodo: parseInt(id_periodo), dia_semana: diaIndex },
        include: { docente: true, curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true },
        orderBy: [{ hora_inicio: 'asc' }]
      });

      reportTitle = `Reporte de Horarios: ${nombreDia} (${periodo?.codigo || ''})`;
      htmlContent = generarCabeceraResumen(nombreDia, `${horarios.length} Clases Programadas`, "Resumen del Día", { label: "Periodo Académico", valor: periodo?.nombre || '' });
      
      htmlContent += `
        <div class="highlight-card">
          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 15%;">HORARIO</th>
                <th style="width: 8%; text-align: center;">CICLO</th>
                <th style="width: 25%;">CURSO / GRUPO</th>
                <th style="width: 20%;">DOCENTE</th>
                <th style="width: 17%;">AMBIENTE</th>
                <th style="width: 15%; text-align: center;">TIPO</th>
              </tr>
            </thead>
            <tbody>
              ${horarios.map(h => `
                <tr>
                  <td style="font-weight: 700; color: #003366; font-size: 12px;">${h.hora_inicio} - ${h.hora_fin}</td>
                  <td style="text-align: center;"><span style="background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso.ciclo_rel?.numero || '—'}</span></td>
                  <td><div style="font-weight: 700; color: #1e293b;">${h.curso.nombre}</div><div style="font-size: 9px; color: #64748b; font-weight: 600;">GRUPO: ${h.grupo.codigo_grupo}</div></td>
                  <td style="font-weight: 500; color: #334155; text-transform: uppercase; font-size: 11px;">${h.docente.nombres} ${h.docente.apellidos}</td>
                  <td><div style="font-weight: 600; color: #1e293b;">${h.ambiente.nombre}</div><div style="font-size: 9px; color: #64748b; text-transform: uppercase;">${h.ambiente.tipo.replace('_', ' ')}</div></td>
                  <td style="text-align: center;"><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${h.tipo_clase.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;

    } else if (tipo === 'docente') {
      const docente = await prisma.docente.findUnique({
        where: { id_docente: parseInt(id!) },
        include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) }, include: { curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true } } }
      });
      if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
      
      const totalHoras = docente.horarios_asignados.reduce((acc: number, h: any) => {
        const [h1, m1] = h.hora_inicio.split(':').map(Number);
        const [h2, m2] = h.hora_fin.split(':').map(Number);
        return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
      }, 0);

      reportTitle = `Horario Docente: ${docente.nombres} ${docente.apellidos}`;
      htmlContent = generarCabeceraResumen(docente.codigo_docente || 'DOC', `${docente.nombres} ${docente.apellidos}`, "Docente", { label: "Total Horas", valor: `${totalHoras} hrs` });
      
      htmlContent += `
        <div class="highlight-card">
          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 15%;">DÍA</th>
                <th style="width: 15%;">HORARIO</th>
                <th style="width: 8%; text-align: center;">CICLO</th>
                <th style="width: 30%;">CURSO / GRUPO</th>
                <th style="width: 17%;">AMBIENTE</th>
                <th style="width: 15%; text-align: center;">TIPO</th>
              </tr>
            </thead>
            <tbody>
              ${docente.horarios_asignados.sort((a,b)=>a.dia_semana-b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)).map(h => `
                <tr>
                  <td style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana]}</td>
                  <td style="color: #003366; font-weight: 700;">${h.hora_inicio} - ${h.hora_fin}</td>
                  <td style="text-align: center;"><span style="background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso.ciclo_rel?.numero || '—'}</span></td>
                  <td><div style="font-weight: 700;">${h.curso.nombre}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo.codigo_grupo}</div></td>
                  <td><div style="font-weight: 600;">${h.ambiente.nombre}</div></td>
                  <td style="text-align: center;"><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${h.tipo_clase.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;

    } else if (tipo === 'aula' || tipo === 'aulas_todas') {
      const ambientes = tipo === 'aula' 
        ? [await prisma.ambiente.findUnique({ where: { id_ambiente: parseInt(id!) }, include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) }, include: { curso: { include: { ciclo_rel: true } }, docente: true, grupo: true } } } })]
        : await prisma.ambiente.findMany({ include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) }, include: { curso: { include: { ciclo_rel: true } }, docente: true, grupo: true } } }, orderBy: { nombre: 'asc' } });
      
      reportTitle = tipo === 'aula' ? `Horario Ambiente` : `Consolidado de Ambientes`;
      htmlContent = ambientes.map(a => {
        if (!a) return '';
        const totalHoras = a.horarios_asignados.reduce((acc: number, h: any) => {
          const [h1, m1] = h.hora_inicio.split(':').map(Number);
          const [h2, m2] = h.hora_fin.split(':').map(Number);
          return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        }, 0);

        return `
          <div style="page-break-after: always;">
            ${generarCabeceraResumen(a.nombre, `${a.tipo.replace('_', ' ')}`, "Ambiente", { label: "Capacidad / Horas", valor: `${a.capacidad} est. / ${totalHoras} hrs` })}
            <div class="highlight-card">
              <table class="print-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">DÍA</th>
                    <th style="width: 15%;">HORARIO</th>
                    <th style="width: 8%; text-align: center;">CICLO</th>
                    <th style="width: 30%;">CURSO / GRUPO</th>
                    <th style="width: 17%;">DOCENTE</th>
                    <th style="width: 15%; text-align: center;">TIPO</th>
                  </tr>
                </thead>
                <tbody>
                  ${a.horarios_asignados.sort((a,b)=>a.dia_semana-b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)).map(h => `
                    <tr>
                      <td style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana]}</td>
                      <td style="color: #003366; font-weight: 700;">${h.hora_inicio} - ${h.hora_fin}</td>
                      <td style="text-align: center;"><span style="background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso.ciclo_rel?.numero || '—'}</span></td>
                      <td><div style="font-weight: 700;">${h.curso.nombre}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo.codigo_grupo}</div></td>
                      <td style="font-size: 11px; text-transform: uppercase;">${h.docente.nombres}</td>
                      <td style="text-align: center;"><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${h.tipo_clase.toUpperCase()}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      }).join('');

    } else if (tipo === 'ciclo' || tipo === 'ciclos_todos') {
      const ciclos = tipo === 'ciclo' ? [await prisma.ciclo.findUnique({ where: { id_ciclo: parseInt(id!) } })] : await prisma.ciclo.findMany({ orderBy: { numero: 'asc' } });
      reportTitle = tipo === 'ciclo' ? `Horario por Ciclo` : `Consolidado por Ciclos`;
      htmlContent = (await Promise.all(ciclos.map(async c => {
        if (!c) return '';
        const h = await prisma.horarioAsignado.findMany({ where: { id_periodo: parseInt(id_periodo), curso: { id_ciclo: c.id_ciclo } }, include: { docente: true, curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true }, orderBy:[{dia_semana:'asc'},{hora_inicio:'asc'}] });
        if(h.length === 0) return '';
        return `
          <div style="page-break-after: always;">
            ${generarCabeceraResumen(c.nombre, `${h.length} Clases Programadas`, "Ciclo Académico", { label: "Periodo", valor: periodo?.codigo || '' })}
            <div class="highlight-card">
              <table class="print-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">DÍA / HORA</th>
                    <th style="width: 30%;">CURSO / GRUPO</th>
                    <th style="width: 20%;">DOCENTE</th>
                    <th style="width: 17%;">AMBIENTE</th>
                    <th style="width: 18%; text-align: center;">TIPO</th>
                  </tr>
                </thead>
                <tbody>
                  ${h.map(clase => `
                    <tr>
                      <td><div style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][clase.dia_semana]}</div><div style="color: #003366; font-size: 11px; font-weight: 700;">${clase.hora_inicio} - ${clase.hora_fin}</div></td>
                      <td><div style="font-weight: 700;">${clase.curso.nombre}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${clase.grupo.codigo_grupo}</div></td>
                      <td style="font-size: 11px; text-transform: uppercase;">${clase.docente.nombres} ${clase.docente.apellidos}</td>
                      <td style="font-weight: 600;">${clase.ambiente.nombre}</td>
                      <td style="text-align: center;"><span class="badge" style="background: ${clase.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${clase.tipo_clase.toUpperCase()}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>`;
      }))).join('');

    } else if (tipo === 'reporte_general') {
      // Placeholder para la plantilla oficial que entregará el usuario
      reportTitle = 'Reporte General Consolidado';
      htmlContent = `
        <div class="highlight-card">
          <h2 style="text-align: center; color: #003366;">PLANTILLA OFICIAL EN DESARROLLO</h2>
          <p style="text-align: center; color: #64748b;">Esperando diseño final de la plantilla institucional...</p>
        </div>
      `;
    } else if (tipo === 'estadisticas' || tipo === 'consolidado') {
      const estadisticas = await ServicioEstadisticas.obtenerEstadisticasGestion(parseInt(id_periodo));
      if (!estadisticas) return NextResponse.json({ error: 'No hay datos de gestión' }, { status: 404 });

      const docentesConCarga = await prisma.docente.findMany({
        include: {
          horarios_asignados: {
            where: { id_periodo: parseInt(id_periodo) }
          }
        }
      });

      const cargaDocentes = docentesConCarga.map(d => {
        const horas = d.horarios_asignados.reduce((acc, h) => {
          const [h1, m1] = h.hora_inicio.split(':').map(Number);
          const [h2, m2] = h.hora_fin.split(':').map(Number);
          return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        }, 0);
        return { nombre: `${d.nombres} ${d.apellidos}`, horas };
      }).sort((a, b) => b.horas - a.horas);

      reportTitle = 'Reporte de Gestión Académica';
      htmlContent = `
        ${generarCabeceraResumen("GESTIÓN", "Métricas de Periodo", "Reporte", { label: "Estado", valor: "Consolidado" })}
        <div class="highlight-card">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border: 1px solid #bae6fd;">
              <p style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; margin: 0;">Total Asignaciones</p>
              <p style="font-size: 32px; font-weight: 800; margin: 10px 0 0 0;">${estadisticas.total_asignaciones}</p>
            </div>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0;">
              <p style="font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; margin: 0;">Promedio Horas</p>
              <p style="font-size: 32px; font-weight: 800; margin: 10px 0 0 0;">${estadisticas.media_horas} hrs</p>
            </div>
          </div>
          
          <h4 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; color: #475569;">Consolidado de Carga Horaria por Docente</h4>
          <table class="print-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th style="text-align: right;">Total Horas</th>
              </tr>
            </thead>
            <tbody>
              ${cargaDocentes.map(d => `
                <tr>
                  <td style="font-weight: 600;">${d.nombre}</td>
                  <td style="text-align: right; font-weight: 800; color: #0369a1;">${d.horas} hrs</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 25px;">
            <h4 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; color: #475569;">Observaciones Automáticas</h4>
            <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px;">
              ${estadisticas.observaciones.map((o: string) => `<li style="margin-bottom: 8px;">${o}</li>`).join('')}
            </ul>
          </div>
        </div>`;
    }

    const fullHTML = GeneradorPDF.wrapLayout(htmlContent, reportTitle);
    const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML);
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error: any) {
    console.error("ERROR_GENERACION_REPORTES:", error);
    return NextResponse.json({ error: 'Error al generar PDF', details: error.message }, { status: 500 });
  }
}
