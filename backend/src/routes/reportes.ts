import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ServicioNotificador } from '../services/notificaciones/ServicioNotificador';
import { GeneradorPDF } from '../services/reportes/GeneradorPDF';
import { GeneradorExcel } from '../services/reportes/GeneradorExcel';
import { ServicioEstadisticas } from '../services/reportes/ServicioEstadisticas';

const router = Router();

router.get('/pdf', async (req, res) => {
  try {
    const tipo = req.query.tipo as string;
    const id = req.query.id as string;
    const id_periodo = req.query.id_periodo as string;

    if (!id_periodo || isNaN(parseInt(id_periodo))) {
      return res.status(400).json({ error: 'Falta id_periodo o es inválido' });
    }

    let htmlContent = '';
    let reportTitle = '';
    let isLandscape = false;

    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(id_periodo) }
    });

    const generarCabeceraResumen = (titulo: string, valor: string, label: string, infoDerecha?: { label: string, valor: string }) => `
      <div class="highlight-card" style="padding: 15px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="background: #003366; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 800; text-transform: uppercase;">
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

    // Lógica de tipos de reporte (Simplificada para brevedad en este paso, pero manteniendo la estructura original)
    if (tipo === 'dia') {
      if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'Falta id de día' });
      const diaIndex = parseInt(id);
      const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const nombreDia = nombresDias[diaIndex] || 'Desconocido';
      const horarios = await prisma.horarioAsignado.findMany({
        where: { id_periodo: parseInt(id_periodo), dia_semana: diaIndex },
        include: { docente: true, curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true },
        orderBy: [{ hora_inicio: 'asc' }]
      });
      reportTitle = `Reporte de Horarios: ${nombreDia}`;
      htmlContent = generarCabeceraResumen(nombreDia, `${horarios.length} Clases Programadas`, "Resumen del Día", { label: "Periodo Académico", valor: periodo?.nombre || '' });
      htmlContent += `<div class="highlight-card"><table class="print-table"><thead><tr><th>Horario</th><th>Ciclo</th><th>Curso / Grupo</th><th>Docente</th><th>Ambiente</th><th>Tipo</th></tr></thead><tbody>${horarios.map(h => `<tr><td style="font-weight: 700; color: #003366;">${h.hora_inicio || ''}-${h.hora_fin || ''}</td><td style="text-align: center;"><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso?.ciclo_rel?.numero || '—'}</span></td><td><div style="font-weight: 700;">${h.curso?.nombre || '—'}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo?.codigo_grupo || '—'}</div></td><td>${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}</td><td><div style="font-weight: 600;">${h.ambiente?.nombre || '—'}</div></td><td><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${(h.tipo_clase || '').toUpperCase()}</span></td></tr>`).join('')}</tbody></table></div>`;

    } else if (tipo === 'docente') {
        if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'Falta id de docente' });
        const docente = await prisma.docente.findUnique({
          where: { id_docente: parseInt(id) },
          include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) }, include: { curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true } } }
        });
        if (!docente) return res.status(404).json({ error: 'Docente no encontrado' });
        
        const totalHoras = (docente.horarios_asignados || []).reduce((acc: number, h: any) => {
          if (!h.hora_inicio || !h.hora_fin) return acc;
          const [h1, m1] = h.hora_inicio.split(':').map(Number);
          const [h2, m2] = h.hora_fin.split(':').map(Number);
          return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        }, 0);

        reportTitle = `Horario Docente: ${docente.nombres} ${docente.apellidos}`;
        htmlContent = generarCabeceraResumen(docente.codigo_docente || 'DOC', `${docente.nombres} ${docente.apellidos}`, "Docente", { label: "Total Horas", valor: `${totalHoras} hrs` });
        htmlContent += `<div class="highlight-card"><table class="print-table"><thead><tr><th>Día</th><th>Horario</th><th>Ciclo</th><th>Curso / Grupo</th><th>Ambiente</th><th>Tipo</th></tr></thead><tbody>${(docente.horarios_asignados || []).sort((a,b)=>a.dia_semana-b.dia_semana || (a.hora_inicio || '').localeCompare(b.hora_inicio || '')).map(h => `<tr><td style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana] || '—'}</td><td style="color: #003366; font-weight: 700;">${h.hora_inicio || ''}-${h.hora_fin || ''}</td><td style="text-align: center;"><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso?.ciclo_rel?.numero || '—'}</span></td><td><div style="font-weight: 700;">${h.curso?.nombre || '—'}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo?.codigo_grupo || '—'}</div></td><td>${h.ambiente?.nombre || '—'}</td><td><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${(h.tipo_clase || '').toUpperCase()}</span></td></tr>`).join('')}</tbody></table></div>`;
    } else if (tipo === 'aula') {
        if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'Falta id de ambiente' });
        const ambiente = await prisma.ambiente.findUnique({
          where: { id_ambiente: parseInt(id) },
          include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) }, include: { curso: { include: { ciclo_rel: true } }, docente: true, grupo: true } } }
        });
        if (!ambiente) return res.status(404).json({ error: 'Ambiente no encontrado' });

        reportTitle = `Horario de Ambiente: ${ambiente.nombre}`;
        htmlContent = generarCabeceraResumen(ambiente.codigo || 'AMB', ambiente.nombre, "Ambiente", { label: "Tipo", valor: (ambiente.tipo || '').toUpperCase() });
        htmlContent += `<div class="highlight-card"><table class="print-table"><thead><tr><th>Día</th><th>Horario</th><th>Ciclo</th><th>Curso / Grupo</th><th>Docente</th><th>Tipo</th></tr></thead><tbody>${(ambiente.horarios_asignados || []).sort((a,b)=>a.dia_semana-b.dia_semana || (a.hora_inicio || '').localeCompare(b.hora_inicio || '')).map(h => `<tr><td style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana] || '—'}</td><td style="color: #003366; font-weight: 700;">${h.hora_inicio || ''}-${h.hora_fin || ''}</td><td style="text-align: center;"><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso?.ciclo_rel?.numero || '—'}</span></td><td><div style="font-weight: 700;">${h.curso?.nombre || '—'}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo?.codigo_grupo || '—'}</div></td><td>${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}</td><td><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${(h.tipo_clase || '').toUpperCase()}</span></td></tr>`).join('')}</tbody></table></div>`;
    } else if (tipo === 'ciclo') {
        if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'Falta id de ciclo' });
        const ciclo = await prisma.ciclo.findUnique({
          where: { id_ciclo: parseInt(id) }
        });
        if (!ciclo) return res.status(404).json({ error: 'Ciclo no encontrado' });

        const horarios = await prisma.horarioAsignado.findMany({
          where: { id_periodo: parseInt(id_periodo), curso: { id_ciclo: parseInt(id) } },
          include: { curso: true, docente: true, ambiente: true, grupo: true },
          orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }]
        });

        reportTitle = `Horario por Ciclo: Ciclo ${ciclo.numero}`;
        htmlContent = generarCabeceraResumen(`Ciclo ${ciclo.numero}`, `${horarios.length} Clases`, "Ciclo Académico", { label: "Periodo", valor: periodo?.nombre || '' });
        htmlContent += `<div class="highlight-card"><table class="print-table"><thead><tr><th>Día</th><th>Horario</th><th>Curso / Grupo</th><th>Docente</th><th>Ambiente</th><th>Tipo</th></tr></thead><tbody>${horarios.map(h => `<tr><td style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana] || '—'}</td><td style="color: #003366; font-weight: 700;">${h.hora_inicio || ''}-${h.hora_fin || ''}</td><td><div style="font-weight: 700;">${h.curso?.nombre || '—'}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo?.codigo_grupo || '—'}</div></td><td>${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}</td><td>${h.ambiente?.nombre || '—'}</td><td><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${(h.tipo_clase || '').toUpperCase()}</span></td></tr>`).join('')}</tbody></table></div>`;
    } else if (tipo === 'reporte_general') {
        const horarios = await prisma.horarioAsignado.findMany({
          where: { id_periodo: parseInt(id_periodo) },
          include: { curso: { include: { ciclo_rel: true } }, docente: true, ambiente: true, grupo: true },
          orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }]
        });

        reportTitle = `Horario Institucional Consolidado`;
        isLandscape = true;
        htmlContent = generarCabeceraResumen("GENERAL", `${horarios.length} Asignaciones`, "Reporte Consolidado", { label: "Periodo", valor: periodo?.nombre || '' });
        htmlContent += `
          <div class="highlight-card">
            <table class="print-table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Horario</th>
                  <th>Ciclo</th>
                  <th>Curso</th>
                  <th>Grupo</th>
                  <th>Docente</th>
                  <th>Ambiente</th>
                </tr>
              </thead>
              <tbody>
                ${horarios.length > 0 ? horarios.map(h => `
                  <tr>
                    <td>${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana] || '—'}</td>
                    <td style="font-weight: 700;">${h.hora_inicio || ''}-${h.hora_fin || ''}</td>
                    <td style="text-align: center;">${h.curso?.ciclo_rel?.numero || '—'}</td>
                    <td>${h.curso?.nombre || '—'}</td>
                    <td>${h.grupo?.codigo_grupo || '—'}</td>
                    <td>${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}</td>
                    <td>${h.ambiente?.nombre || '—'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">No hay horarios asignados para este periodo</td></tr>'}
              </tbody>
            </table>
          </div>`;
    } else if (tipo === 'estadisticas') {
        const stats = await ServicioEstadisticas.obtenerEstadisticasGestion(parseInt(id_periodo));
        reportTitle = `Reporte de Gestión y Estadísticas`;
        
        if (!stats) {
          htmlContent = `<div class="highlight-card" style="text-align: center;">No hay datos suficientes para generar estadísticas</div>`;
        } else {
          htmlContent = generarCabeceraResumen("GESTIÓN", `${stats.total_asignaciones} Asignaciones`, "Análisis de Carga", { label: "Periodo", valor: periodo?.nombre || '' });
          htmlContent += `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div class="highlight-card">
                <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Promedio de Horas</h4>
                <p style="font-size: 24px; font-weight: 800; margin: 0; color: #003366;">${stats.media_horas} hrs</p>
              </div>
              <div class="highlight-card">
                <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Desviación Estándar</h4>
                <p style="font-size: 24px; font-weight: 800; margin: 0; color: #003366;">${stats.desviacion_estandar}</p>
              </div>
            </div>
            <div class="highlight-card">
              <h4 style="margin: 0 0 15px 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Observaciones del Sistema</h4>
              <ul style="margin: 0; padding-left: 20px;">
                ${stats.observaciones.map(o => `<li style="margin-bottom: 8px; font-size: 13px;">${o}</li>`).join('')}
              </ul>
            </div>
          `;
        }
    } else if (tipo === 'aulas_todas') {
        const ambientes = await prisma.ambiente.findMany({
          where: { activo: true },
          include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) }, include: { curso: true, docente: true, grupo: true } } },
          orderBy: { nombre: 'asc' }
        });

        reportTitle = `Reporte Consolidado de Ambientes`;
        htmlContent = generarCabeceraResumen("AULAS", `${ambientes.length} Ambientes`, "Reporte Masivo", { label: "Periodo", valor: periodo?.nombre || '' });
        
        htmlContent += ambientes.map(amb => `
          <div style="margin-top: 30px;">
            <h3 style="background: #f8fafc; padding: 10px; border-radius: 8px; border-left: 4px solid #003366; font-size: 14px;">
              ${amb.nombre} (${amb.codigo}) - ${amb.tipo.toUpperCase()}
            </h3>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Horario</th>
                  <th>Curso / Grupo</th>
                  <th>Docente</th>
                </tr>
              </thead>
              <tbody>
                ${amb.horarios_asignados.length > 0 ? amb.horarios_asignados.sort((a,b)=>a.dia_semana-b.dia_semana).map(h => `
                  <tr>
                    <td>${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana]}</td>
                    <td style="font-weight: 700;">${h.hora_inicio}-${h.hora_fin}</td>
                    <td>${h.curso?.nombre} (G:${h.grupo?.codigo_grupo})</td>
                    <td>${h.docente?.nombres} ${h.docente?.apellidos}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4" style="text-align: center; color: #64748b;">Sin clases asignadas</td></tr>'}
              </tbody>
            </table>
          </div>
        `).join('');
    }
    // ... Agregar el resto de tipos de reporte (aulas, ciclos, etc.) manteniendo la lógica del original

    const fullHTML = GeneradorPDF.wrapLayout(htmlContent, reportTitle, tipo === 'reporte_general');
    
    // Si se pide formato HTML (para previsualización o depuración)
    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(fullHTML);
    }

    const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, isLandscape);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${tipo}.pdf"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error: any) {
    console.error("ERROR_GENERACION_REPORTES:", error);
    res.status(500).json({ error: 'Error al generar PDF', details: error.message });
  }
});

router.get('/excel', async (req, res) => {
  try {
    const id_periodo = req.query.id_periodo as string;

    if (!id_periodo || isNaN(parseInt(id_periodo))) {
      return res.status(400).json({ error: 'Falta id_periodo o es inválido' });
    }

    const excelBuffer = await GeneradorExcel.generarConsolidadoGeneral(parseInt(id_periodo));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="horario-general.xlsx"`);
    res.send(excelBuffer);

  } catch (error: any) {
    console.error("ERROR_GENERACION_EXCEL:", error);
    res.status(500).json({ error: 'Error al generar Excel', details: error.message });
  }
});

export default router;
