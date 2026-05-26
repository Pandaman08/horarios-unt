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

    if (tipo === 'dia') {
      const diaIndex = parseInt(id!);
      const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const nombreDia = nombresDias[diaIndex] || 'Desconocido';
      const horarios = await prisma.horarioAsignado.findMany({
        where: { id_periodo: parseInt(id_periodo), dia_semana: diaIndex },
        include: { docente: true, curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true },
        orderBy: [{ hora_inicio: 'asc' }]
      });
      reportTitle = `Reporte de Horarios: ${nombreDia}`;
      htmlContent = generarCabeceraResumen(nombreDia, `${horarios.length} Clases Programadas`, "Resumen del Día", { label: "Periodo Académico", valor: periodo?.nombre || '' });
      htmlContent += `<div class="highlight-card"><table class="print-table"><thead><tr><th>Horario</th><th>Ciclo</th><th>Curso / Grupo</th><th>Docente</th><th>Ambiente</th><th>Tipo</th></tr></thead><tbody>${horarios.map(h => `<tr><td style="font-weight: 700; color: #003366;">${h.hora_inicio}-${h.hora_fin}</td><td style="text-align: center;"><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso.ciclo_rel?.numero || '—'}</span></td><td><div style="font-weight: 700;">${h.curso.nombre}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo.codigo_grupo}</div></td><td>${h.docente.nombres} ${h.docente.apellidos}</td><td><div style="font-weight: 600;">${h.ambiente.nombre}</div></td><td><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${h.tipo_clase.toUpperCase()}</span></td></tr>`).join('')}</tbody></table></div>`;

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
      htmlContent += `<div class="highlight-card"><table class="print-table"><thead><tr><th>Día</th><th>Horario</th><th>Ciclo</th><th>Curso / Grupo</th><th>Ambiente</th><th>Tipo</th></tr></thead><tbody>${docente.horarios_asignados.sort((a,b)=>a.dia_semana-b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)).map(h => `<tr><td style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana]}</td><td style="color: #003366; font-weight: 700;">${h.hora_inicio}-${h.hora_fin}</td><td style="text-align: center;"><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso.ciclo_rel?.numero || '—'}</span></td><td><div style="font-weight: 700;">${h.curso.nombre}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo.codigo_grupo}</div></td><td>${h.ambiente.nombre}</td><td><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${h.tipo_clase.toUpperCase()}</span></td></tr>`).join('')}</tbody></table></div>`;

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
        return `<div style="page-break-after: always;">${generarCabeceraResumen(a.nombre, `${a.tipo.replace('_', ' ')}`, "Ambiente", { label: "Capacidad / Horas", valor: `${a.capacidad} est. / ${totalHoras} hrs` })}<div class="highlight-card"><table class="print-table"><thead><tr><th>Día</th><th>Horario</th><th>Ciclo</th><th>Curso / Grupo</th><th>Docente</th><th>Tipo</th></tr></thead><tbody>${a.horarios_asignados.sort((a,b)=>a.dia_semana-b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)).map(h => `<tr><td style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana]}</td><td style="color: #003366; font-weight: 700;">${h.hora_inicio}-${h.hora_fin}</td><td style="text-align: center;"><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${h.curso.ciclo_rel?.numero || '—'}</span></td><td><div style="font-weight: 700;">${h.curso.nombre}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${h.grupo.codigo_grupo}</div></td><td>${h.docente.nombres}</td><td><span class="badge" style="background: ${h.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${h.tipo_clase.toUpperCase()}</span></td></tr>`).join('')}</tbody></table></div></div>`;
      }).join('');

    } else if (tipo === 'ciclo' || tipo === 'ciclos_todos') {
      const ciclos = tipo === 'ciclo' ? [await prisma.ciclo.findUnique({ where: { id_ciclo: parseInt(id!) } })] : await prisma.ciclo.findMany({ orderBy: { numero: 'asc' } });
      reportTitle = tipo === 'ciclo' ? `Horario por Ciclo` : `Consolidado por Ciclos`;
      htmlContent = (await Promise.all(ciclos.map(async c => {
        if (!c) return '';
        const h = await prisma.horarioAsignado.findMany({ where: { id_periodo: parseInt(id_periodo), curso: { id_ciclo: c.id_ciclo } }, include: { docente: true, curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true }, orderBy:[{dia_semana:'asc'},{hora_inicio:'asc'}] });
        if(h.length === 0) return '';
        return `<div style="page-break-after: always;">${generarCabeceraResumen(c.nombre, `${h.length} Clases Programadas`, "Ciclo Académico", { label: "Periodo", valor: periodo?.codigo || '' })}<div class="highlight-card"><table class="print-table"><thead><tr><th>Día / Hora</th><th>Curso / Grupo</th><th>Docente</th><th>Ambiente</th><th>Tipo</th></tr></thead><tbody>${h.map(clase => `<tr><td><div style="font-weight: 700;">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][clase.dia_semana]}</div><div style="color: #003366; font-size: 11px; font-weight: 700;">${clase.hora_inicio}-${clase.hora_fin}</div></td><td><div style="font-weight: 700;">${clase.curso.nombre}</div><div style="font-size: 9px; color: #64748b;">GRUPO: ${clase.grupo.codigo_grupo}</div></td><td>${clase.docente.nombres} ${clase.docente.apellidos}</td><td>${clase.ambiente.nombre}</td><td style="text-align: center;"><span class="badge" style="background: ${clase.tipo_clase === 'teoria' ? '#e0f2fe; color: #0369a1;' : '#f3e8ff; color: #7e22ce;'}">${clase.tipo_clase.toUpperCase()}</span></td></tr>`).join('')}</tbody></table></div></div>`;
      }))).join('');

    } else if (tipo === 'reporte_docentes_lista') {
      const docentes = await prisma.docente.findMany({
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
      });
      reportTitle = 'Reporte General de Docentes';
      htmlContent = `${generarCabeceraResumen("DOCENTES", `${docentes.length} Catedráticos`, "Plana Docente", { label: "Facultad", valor: "Ingeniería" })}
        <div class="highlight-card">
          <table class="print-table">
            <thead>
              <tr>
                <th>Apellidos y Nombres</th>
                <th>Código</th>
                <th>Grado</th>
                <th>Categoría</th>
                <th>Modalidad</th>
                <th>Correo</th>
              </tr>
            </thead>
            <tbody>
              ${docentes.map(d => `
                <tr>
                  <td><div style="font-weight: 700;">${d.apellidos}, ${d.nombres}</div></td>
                  <td style="font-family: monospace;">${d.codigo_docente || '—'}</td>
                  <td style="font-size: 10px;">${d.grado_academico || '—'}</td>
                  <td><span class="badge" style="background: #f1f5f9;">${d.categoria}</span></td>
                  <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${d.modalidad}</span></td>
                  <td style="font-size: 10px; color: #64748b;">${d.correo_electronico || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;

    } else if (tipo === 'reporte_cursos') {
      const cursos = await prisma.curso.findMany({
        include: { ciclo_rel: true },
        orderBy: [{ id_ciclo: 'asc' }, { nombre: 'asc' }]
      });
      reportTitle = 'Reporte de Cursos y Asignaturas';
      htmlContent = `${generarCabeceraResumen("CURSOS", `${cursos.length} Asignaturas`, "Catálogo de Cursos", { label: "Periodo", valor: periodo?.codigo || '' })}
        <div class="highlight-card">
          <table class="print-table">
            <thead>
              <tr>
                <th>Ciclo</th>
                <th>Código</th>
                <th>Asignatura</th>
                <th style="text-align: center;">T</th>
                <th style="text-align: center;">P</th>
                <th style="text-align: center;">L</th>
                <th style="text-align: center;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${cursos.map(c => `
                <tr>
                  <td style="text-align: center;"><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #e2e8f0;">${c.ciclo_rel?.numero || '—'}</span></td>
                  <td style="font-family: monospace; font-weight: 600;">${c.codigo_curso || '—'}</td>
                  <td><div style="font-weight: 700;">${c.nombre}</div></td>
                  <td style="text-align: center;">${c.horas_teoria || 0}</td>
                  <td style="text-align: center;">${c.horas_practica || 0}</td>
                  <td style="text-align: center;">${c.horas_laboratorio || 0}</td>
                  <td style="text-align: center; font-weight: 800; color: #003366;">${(c.horas_teoria || 0) + (c.horas_practica || 0) + (c.horas_laboratorio || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;

    } else if (tipo === 'reporte_ambientes') {
      const ambientes = await prisma.ambiente.findMany({
        orderBy: { nombre: 'asc' }
      });
      reportTitle = 'Reporte de Ambientes Académicos';
      htmlContent = `${generarCabeceraResumen("AMBIENTES", `${ambientes.length} Espacios`, "Infraestructura", { label: "Facultad", valor: "Ingeniería" })}
        <div class="highlight-card">
          <table class="print-table">
            <thead>
              <tr>
                <th>Nombre / Código</th>
                <th>Tipo</th>
                <th style="text-align: center;">Capacidad</th>
                <th>Pabellón / Piso</th>
              </tr>
            </thead>
            <tbody>
              ${ambientes.map(a => `
                <tr>
                  <td><div style="font-weight: 700;">${a.nombre}</div><div style="font-size: 9px; color: #64748b;">CÓD: ${a.codigo}</div></td>
                  <td><span class="badge" style="background: #f1f5f9; color: #475569;">${a.tipo.toUpperCase().replace('_', ' ')}</span></td>
                  <td style="text-align: center; font-weight: 700;">${a.capacidad} est.</td>
                  <td>${a.pabellon || '-'} / ${a.piso || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;

    } else if (tipo === 'reporte_periodos') {
      const periodos = await prisma.periodoAcademico.findMany({
        orderBy: { anio: 'desc' }
      });
      reportTitle = 'Reporte de Periodos Académicos';
      htmlContent = `${generarCabeceraResumen("PERIODOS", `${periodos.length} Registrados`, "Historial Académico")}
        <div class="highlight-card">
          <table class="print-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre del Periodo</th>
                <th>Año / Sem.</th>
                <th>Estado</th>
                <th>Inicio / Fin</th>
              </tr>
            </thead>
            <tbody>
              ${periodos.map(p => `
                <tr>
                  <td style="font-weight: 700; color: #003366;">${p.codigo}</td>
                  <td>${p.nombre}</td>
                  <td style="text-align: center;">${p.anio} - ${p.semestre === 1 ? 'I' : 'II'}</td>
                  <td><span class="badge" style="background: #f1f5f9;">${p.estado.toUpperCase()}</span></td>
                  <td style="font-size: 11px;">${p.fecha_inicio.toLocaleDateString()} al ${p.fecha_fin.toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;

    } else if (tipo === 'reporte_general') {
      isLandscape = true;
      const ciclos = await prisma.ciclo.findMany({ orderBy: { numero: 'asc' } });
      const paginas = [];

      for (const ciclo of ciclos) {
        const horarios = await prisma.horarioAsignado.findMany({
          where: { id_periodo: parseInt(id_periodo), curso: { id_ciclo: ciclo.id_ciclo } },
          include: { docente: true, curso: true, ambiente: true, grupo: true },
          orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }]
        });

        if (horarios.length === 0) continue;

        // Agrupar cursos para la tabla superior
        const cursosMap = new Map();
        horarios.forEach(h => {
          const key = `${h.id_curso}-${h.id_docente}-${h.id_grupo}`;
          if (!cursosMap.has(key)) {
            cursosMap.set(key, {
              docente: `${h.docente.nombres} ${h.docente.apellidos}`,
              asignatura: h.curso.nombre,
              T: h.curso.horas_teoria || 0,
              P: h.curso.horas_practica || 0,
              L: h.curso.horas_laboratorio || 0,
              G: h.grupo.codigo_grupo,
              THoras: (h.curso.horas_teoria || 0) + (h.curso.horas_practica || 0) + (h.curso.horas_laboratorio || 0),
              departamento: h.docente.departamento || "Ing. de Sistemas"
            });
          }
        });

        const listaCursos = Array.from(cursosMap.values());
        const colores = ['#bfdbfe', '#fecaca', '#bbf7d0', '#fef08a', '#fed7aa', '#ddd6fe', '#bae6fd', '#fbcfe8', '#e2e8f0'];
        
        const filasCursosHtml = listaCursos.map((c, i) => `
          <tr style="background: ${colores[i % colores.length]}44;">
            <td style="border: 1px solid black; text-align: center; font-size: 8.5px; padding: 2px;">${i + 1}</td>
            <td style="border: 1px solid black; text-align: left; font-size: 8.5px; padding: 2px 5px;">${c.docente}</td>
            <td style="border: 1px solid black; text-align: left; font-size: 8.5px; padding: 2px 5px;">${c.asignatura}</td>
            <td style="border: 1px solid black; text-align: center; font-size: 8.5px;">${c.T}</td>
            <td style="border: 1px solid black; text-align: center; font-size: 8.5px;">${c.P}</td>
            <td style="border: 1px solid black; text-align: center; font-size: 8.5px;">${c.L}</td>
            <td style="border: 1px solid black; text-align: center; font-size: 8.5px;">${c.G}</td>
            <td style="border: 1px solid black; text-align: center; font-size: 8.5px; font-weight: bold;">${c.THoras}</td>
            <td style="border: 1px solid black; text-align: center; font-size: 8.5px; padding: 2px;">${c.departamento}</td>
          </tr>
        `).join('');

        const filasVacias = Array(Math.max(0, 11 - listaCursos.length)).fill(0).map(() => `
          <tr><td style="border: 1px solid black; height: 16px;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td><td style="border: 1px solid black;"></td></tr>
        `).join('');

        // Matriz de horario
        const horas = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
        const labelsHoras = ["7-8", "8-9", "9-10", "10-11", "11-12", "12-1", "1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8"];
        const dias = [0, 1, 2, 3, 4, 5];

        const filasMatriz = horas.map((hora, idx) => {
          if (hora === "13:00") { // Almuerzo
            return `
              <tr style="background: #f1f5f9; height: 15px;">
                <td style="border: 1px solid black; text-align: center; font-size: 9px; font-weight: 800; border-top: 1.5px solid black; border-bottom: 1.5px solid black;">1-2</td>
                <td colspan="6" style="border: 1px solid black; text-align: center; font-size: 9px; font-weight: 800; letter-spacing: 5px; border-top: 1.5px solid black; border-bottom: 1.5px solid black;">ALMUERZO</td>
                <td style="border: 1px solid black; text-align: center; font-size: 9px; font-weight: 800; border-top: 1.5px solid black; border-bottom: 1.5px solid black;">1-2</td>
              </tr>`;
          }

          const celdas = dias.map(dia => {
            // Buscar si hay una clase que empiece en esta hora o que la incluya
            const clase = horarios.find(h => {
              const [h_inicio] = h.hora_inicio.split(':').map(Number);
              const [h_fin] = h.hora_fin.split(':').map(Number);
              const h_actual = parseInt(hora.split(':')[0]);
              return h.dia_semana === dia && h_actual >= h_inicio && h_actual < h_fin;
            });

            if (clase) {
              const cursoIdx = listaCursos.findIndex(c => c.asignatura === clase.curso.nombre && c.G === clase.grupo.codigo_grupo);
              const color = colores[cursoIdx % colores.length];
              return `<td style="border: 1px solid black; background: ${color}; text-align: center; padding: 2px; vertical-align: middle;">
                <div style="font-weight: 800; font-size: 11px; line-height: 1;">${cursoIdx + 1}</div>
                <div style="font-size: 7.5px; font-weight: 600;">(${clase.ambiente.nombre})</div>
              </td>`;
            }
            return `<td style="border: 1px solid black;"></td>`;
          }).join('');

          return `<tr style="height: 32px;">
            <td style="border: 1px solid black; text-align: center; font-size: 9px; font-weight: 800; background: #f8fafc;">${labelsHoras[idx]}</td>
            ${celdas}
            <td style="border: 1px solid black; text-align: center; font-size: 9px; font-weight: 800; background: #f8fafc;">${labelsHoras[idx]}</td>
          </tr>`;
        }).join('');

        paginas.push(`
          <div style="padding: 10px 20px; font-family: 'Inter', sans-serif; position: relative; ${ciclo !== ciclos[ciclos.length - 1] ? 'page-break-after: always;' : ''}">
            <div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: stretch;">
              <!-- Box Informativo Izquierda -->
              <div style="width: 320px; border: 2px solid black; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="text-align: center; margin-bottom: 10px;">
                  <div style="font-weight: 900; font-size: 12px; line-height: 1.2;">UNIVERSIDAD NACIONAL DE TRUJILLO</div>
                  <div style="font-weight: 800; font-size: 11px; line-height: 1.2;">FACULTAD DE INGENIERÍA TRUJILLO</div>
                </div>
                
                <div style="space-y: 6px;">
                  <div style="font-size: 10.5px; border-bottom: 1px solid #ddd; padding-bottom: 2px;">
                    <span style="font-weight: 900;">ESCUELA:</span> 
                    <span style="color: #000; font-weight: 700; margin-left: 5px;">INGENIERÍA DE SISTEMAS</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 10.5px; border-bottom: 1px solid #ddd; padding: 2px 0;">
                    <div><span style="font-weight: 900;">CICLO:</span> <span style="font-weight: 700; margin-left: 5px;">${ciclo.numero}</span></div>
                    <div style="margin-right: 20px;"><span style="font-weight: 900;">SECCIÓN:</span> <span style="font-weight: 700; margin-left: 5px;">A</span></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 10.5px; border-bottom: 1px solid #ddd; padding: 2px 0;">
                    <div><span style="font-weight: 900;">AÑO ACADÉMICO:</span> <span style="font-weight: 700; margin-left: 5px;">${periodo?.anio || '2026'}</span></div>
                    <div style="margin-right: 20px;"><span style="font-weight: 900;">SEMESTRE:</span> <span style="font-weight: 700; margin-left: 5px;">${periodo?.semestre === 1 ? 'I' : 'II'}</span></div>
                  </div>
                </div>
                
                <div style="text-align: right; font-size: 9.5px; font-weight: 800; margin-top: 10px; background: #f8fafc; padding: 5px; border: 1px solid black;">
                  <div style="margin-bottom: 3px;">Inicio del Ciclo : <span style="text-decoration: underline;">${periodo?.fecha_inicio_clases?.toLocaleDateString('es-PE') || '13-04-2026'}</span></div>
                  <div>Término del Ciclo : <span style="text-decoration: underline;">${periodo?.fecha_fin_clases?.toLocaleDateString('es-PE') || '08-08-2026'}</span></div>
                </div>
              </div>
              
              <!-- Tabla de Docentes Derecha -->
              <div style="flex: 1;">
                <table style="width: 100%; border-collapse: collapse; border: 2px solid black;">
                  <thead>
                    <tr style="background: #f1f5f9;">
                      <th style="border: 1px solid black; font-size: 9px; width: 25px; padding: 4px;">Nº</th>
                      <th style="border: 1px solid black; font-size: 9px; text-align: center; padding: 4px;">PROFESOR</th>
                      <th style="border: 1px solid black; font-size: 9px; text-align: center; padding: 4px;">ASIGNATURA</th>
                      <th style="border: 1px solid black; font-size: 9px; width: 18px;">T</th>
                      <th style="border: 1px solid black; font-size: 9px; width: 18px;">P</th>
                      <th style="border: 1px solid black; font-size: 9px; width: 18px;">L</th>
                      <th style="border: 1px solid black; font-size: 9px; width: 18px;">G</th>
                      <th style="border: 1px solid black; font-size: 9px; width: 40px;">T. HRS</th>
                      <th style="border: 1px solid black; font-size: 9px; width: 100px;">DEPTO.</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filasCursosHtml}
                    ${filasVacias}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Matriz de Horario -->
            <table style="width: 100%; border-collapse: collapse; border: 2px solid black; table-layout: fixed;">
              <thead>
                <tr style="background: #f1f5f9; height: 28px;">
                  <th style="border: 1px solid black; font-size: 10px; width: 65px; font-weight: 900;">HORA</th>
                  <th style="border: 1px solid black; font-size: 10px; font-weight: 900;">LUNES</th>
                  <th style="border: 1px solid black; font-size: 10px; font-weight: 900;">MARTES</th>
                  <th style="border: 1px solid black; font-size: 10px; font-weight: 900;">MIÉRCOLES</th>
                  <th style="border: 1px solid black; font-size: 10px; font-weight: 900;">JUEVES</th>
                  <th style="border: 1px solid black; font-size: 10px; font-weight: 900;">VIERNES</th>
                  <th style="border: 1px solid black; font-size: 10px; font-weight: 900;">SÁBADO</th>
                  <th style="border: 1px solid black; font-size: 10px; width: 65px; font-weight: 900;">HORA</th>
                </tr>
              </thead>
              <tbody>
                ${filasMatriz}
              </tbody>
            </table>
            
            <div style="margin-top: 10px; font-size: 8px; color: #666; text-align: right; font-style: italic;">
              Generado el ${new Date().toLocaleString('es-PE')} - Sistema de Gestión de Horarios UNT
            </div>
          </div>
        `);
      }
      htmlContent = paginas.join('');
      reportTitle = 'Horario Semestral Consolidado';

    } else if (tipo === 'estadisticas' || tipo === 'consolidado') {
      const estadisticas = await ServicioEstadisticas.obtenerEstadisticasGestion(parseInt(id_periodo));
      if (!estadisticas) return NextResponse.json({ error: 'No hay datos de gestión' }, { status: 404 });
      const docentesConCarga = await prisma.docente.findMany({ include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) } } } });
      const cargaDocentes = docentesConCarga.map(d => {
        const horas = d.horarios_asignados.reduce((acc, h) => {
          const [h1, m1] = h.hora_inicio.split(':').map(Number);
          const [h2, m2] = h.hora_fin.split(':').map(Number);
          return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        }, 0);
        return { nombre: `${d.nombres} ${d.apellidos}`, horas };
      }).sort((a, b) => b.horas - a.horas);
      reportTitle = 'Reporte de Gestión Académica';
      htmlContent = `${generarCabeceraResumen("GESTIÓN", "Métricas de Periodo", "Reporte", { label: "Estado", valor: "Consolidado" })}<div class="highlight-card"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;"><div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border: 1px solid #bae6fd;"><p style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; margin: 0;">Total Asignaciones</p><p style="font-size: 32px; font-weight: 800; margin: 10px 0 0 0;">${estadisticas.total_asignaciones}</p></div><div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0;"><p style="font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; margin: 0;">Promedio Horas</p><p style="font-size: 32px; font-weight: 800; margin: 10px 0 0 0;">${estadisticas.media_horas} hrs</p></div></div><h4 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; color: #475569;">Consolidado de Carga Horaria por Docente</h4><table class="print-table"><thead><tr><th>Docente</th><th style="text-align: right;">Total Horas</th></tr></thead><tbody>${cargaDocentes.map(d => `<tr><td style="font-weight: 600;">${d.nombre}</td><td style="text-align: right; font-weight: 800; color: #0369a1;">${d.horas} hrs</td></tr>`).join('')}</tbody></table><div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 25px;"><h4 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; color: #475569;">Observaciones Automáticas</h4><ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px;">${estadisticas.observaciones.map((o: string) => `<li style="margin-bottom: 8px;">${o}</li>`).join('')}</ul></div></div>`;
    }

    const fullHTML = GeneradorPDF.wrapLayout(htmlContent, reportTitle, tipo === 'reporte_general');
    const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, isLandscape);
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
