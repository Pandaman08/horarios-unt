import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeneradorPDF } from '@/services/reportes/GeneradorPDF';
import { ServicioEstadisticas } from '@/services/reportes/ServicioEstadisticas';

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
      const totalHoras = docente.horarios_asignados.reduce((acc: number, h: any) => {
        const [h1, m1] = h.hora_inicio.split(':').map(Number);
        const [h2, m2] = h.hora_fin.split(':').map(Number);
        return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
      }, 0);
      const totalAlumnos = docente.horarios_asignados.reduce((acc: number, h: any) => {
        return acc + (h.grupo?.cantidad_matriculados || 0);
      }, 0);

      htmlContent = `
        <div class="highlight-card mb-8">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div class="flex items-center gap-4">
              <div class="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-mono font-bold tracking-wider text-sm border border-indigo-200">
                ${docente.codigo_docente}
              </div>
              <div>
                <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">Modalidad y Categoría</p>
                <p class="text-lg font-semibold text-slate-800">${docente.modalidad.toUpperCase()} - ${docente.categoria.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
            <div class="flex gap-4 text-right">
              <div class="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-lg">
                <p class="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Horas Dictadas</p>
                <p class="text-xl font-black text-slate-800">${totalHoras}</p>
              </div>
              <div class="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
                <p class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total Alumnos</p>
                <p class="text-xl font-black text-slate-800">${totalAlumnos}</p>
              </div>
            </div>
          </div>
          <table class="print-table w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Día</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Horario</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Curso</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Grupo</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Ambiente</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Tipo</th>
              </tr>
            </thead>
            <tbody>
              ${docente.horarios_asignados.sort((a: any, b: any) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)).map((h: any, index: number) => `
                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">
                  <td class="p-3 font-semibold text-slate-800 whitespace-nowrap border-b border-slate-100">${['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][h.dia_semana]}</td>
                  <td class="p-3 font-mono text-indigo-600 font-medium whitespace-nowrap border-b border-slate-100">${h.hora_inicio} - ${h.hora_fin}</td>
                  <td class="p-3 font-medium border-b border-slate-100 text-slate-700">${h.curso.nombre}</td>
                  <td class="p-3 whitespace-nowrap border-b border-slate-100"><span class="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">${h.grupo.codigo_grupo}</span></td>
                  <td class="p-3 whitespace-nowrap border-b border-slate-100 text-slate-700">${h.ambiente.nombre}</td>
                  <td class="p-3 whitespace-nowrap border-b border-slate-100">
                    <span class="inline-block px-2 py-1 rounded-full text-xs font-bold capitalize ${h.tipo_clase === 'teoria' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
          h.tipo_clase === 'practica' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
            'bg-purple-100 text-purple-700 border border-purple-200'
        }">
                      ${h.tipo_clase}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
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
      const totalHorasAmbiente = ambiente.horarios_asignados.reduce((acc: number, h: any) => {
        const [h1, m1] = h.hora_inicio.split(':').map(Number);
        const [h2, m2] = h.hora_fin.split(':').map(Number);
        return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
      }, 0);

      htmlContent = `
        <div class="highlight-card mb-8">
          <div class="grid grid-cols-3 gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tipo de Ambiente</p>
              <p class="text-lg font-semibold text-slate-800 capitalize flex items-center">
                <span class="w-3 h-3 rounded-full mr-2 ${ambiente.tipo === 'laboratorio' ? 'bg-purple-500' : 'bg-blue-500'}"></span>
                ${ambiente.tipo.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Capacidad Máxima</p>
              <p class="text-lg font-semibold text-slate-800">${ambiente.capacidad} <span class="text-sm font-normal text-slate-500">estudiantes</span></p>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Horas Ocupadas</p>
              <p class="text-lg font-black text-emerald-600">${totalHorasAmbiente} <span class="text-sm font-normal text-slate-500">hrs</span></p>
            </div>
          </div>
          <table class="print-table w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Día</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Horario</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Curso</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Docente</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Grupo</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Tipo</th>
                <th class="p-3 text-left font-bold text-slate-600 text-sm uppercase border-b-2 border-slate-200">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              ${ambiente.horarios_asignados.sort((a: any, b: any) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)).map((h: any, index: number) => {
                const matriculados = h.grupo?.cantidad_matriculados || 0;
                const porcentaje = Math.round((matriculados / ambiente.capacidad) * 100);
                const ocupacionColor = porcentaje > 90 ? 'text-red-600' : porcentaje > 70 ? 'text-amber-600' : 'text-emerald-600';
                return `
                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">
                  <td class="p-3 font-semibold text-slate-800 whitespace-nowrap border-b border-slate-100">${['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][h.dia_semana]}</td>
                  <td class="p-3 font-mono text-indigo-600 font-medium whitespace-nowrap border-b border-slate-100">${h.hora_inicio} - ${h.hora_fin}</td>
                  <td class="p-3 font-medium border-b border-slate-100 text-slate-700">${h.curso.nombre}</td>
                  <td class="p-3 whitespace-nowrap border-b border-slate-100 text-slate-700">${h.docente.nombres} ${h.docente.apellidos}</td>
                  <td class="p-3 whitespace-nowrap border-b border-slate-100"><span class="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">${h.grupo.codigo_grupo}</span></td>
                  <td class="p-3 whitespace-nowrap border-b border-slate-100">
                    <span class="inline-block px-2 py-1 rounded-full text-xs font-bold capitalize ${h.tipo_clase === 'teoria' ? 'bg-blue-100 text-blue-700 border border-blue-200' : h.tipo_clase === 'practica' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-purple-100 text-purple-700 border border-purple-200'}">
                      ${h.tipo_clase}
                    </span>
                  </td>
                  <td class="p-3 whitespace-nowrap border-b border-slate-100">
                    <span class="font-bold ${ocupacionColor}">${matriculados} / ${ambiente.capacidad}</span>
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (tipo === 'consolidado') {
      const docentes = await prisma.docente.findMany({
        where: {
          horarios_asignados: {
            some: { id_periodo: parseInt(id_periodo) }
          }
        },
        include: {
          horarios_asignados: {
            where: { id_periodo: parseInt(id_periodo) },
            include: { curso: true }
          }
        }
      });

      reportTitle = `Consolidado de carga horaria`;
      htmlContent = `
        <div class="highlight-card mb-8">
          <p class="text-slate-500 mb-6 font-medium">Este reporte muestra el total de horas académicas asignadas a cada docente en el periodo actual, agrupadas para facilitar la revisión de carga.</p>
          <table class="print-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Modalidad</th>
                <th>Cursos Diferentes</th>
                <th class="text-right">Total Horas Asignadas</th>
              </tr>
            </thead>
            <tbody>
              ${docentes.map((d: any) => {
        const totalHoras = d.horarios_asignados.reduce((acc: number, h: any) => {
          const [h1, m1] = h.hora_inicio.split(':').map(Number);
          const [h2, m2] = h.hora_fin.split(':').map(Number);
          return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        }, 0);
        const cursosDistintos = new Set(d.horarios_asignados.map((h: any) => h.id_curso)).size;
        return `
                  <tr>
                    <td class="font-bold text-slate-800 whitespace-nowrap">${d.nombres} ${d.apellidos}</td>
                    <td class="capitalize font-medium text-slate-600 whitespace-nowrap">${d.modalidad}</td>
                    <td class="whitespace-nowrap"><span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">${cursosDistintos} cursos</span></td>
                    <td class="text-right font-black text-slate-900 whitespace-nowrap">${totalHoras} hrs</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (tipo === 'conflictos') {
      const conflictos = await prisma.conflictoHorario.findMany({
        where: { id_periodo: parseInt(id_periodo) },
        orderBy: { fecha_deteccion: 'desc' }
      });

      reportTitle = `Conflictos de horario`;

      if (conflictos.length === 0) {
        htmlContent = `
          <div class="bg-emerald-50 p-8 rounded-2xl border border-emerald-200 text-center shadow-sm">
            <svg style="width: 64px; height: 64px;" class="text-emerald-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-emerald-800 font-bold text-xl mb-2">¡Todo en orden!</p>
            <p class="text-emerald-600 font-medium">No se han registrado cruces ni conflictos de horario en este periodo. La asignación académica se está desarrollando sin problemas.</p>
          </div>
        `;
      } else {
        htmlContent = `
          <div class="highlight-card mb-8">
            <p class="text-slate-500 mb-6 font-medium">Registro de todos los incidentes, cruces de aulas y docentes detectados durante la asignación de horarios.</p>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Tipo de Conflicto</th>
                  <th>Descripción Detallada</th>
                  <th class="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${conflictos.map((c: any) => `
                  <tr>
                    <td class="whitespace-nowrap font-mono text-xs font-medium text-slate-500">${new Date(c.fecha_deteccion).toLocaleString('es-PE')}</td>
                    <td class="capitalize font-bold text-slate-700 whitespace-nowrap">${c.tipo_conflicto.replace(/_/g, ' ')}</td>
                    <td class="text-sm font-medium text-slate-600">${c.descripcion}</td>
                    <td class="text-center whitespace-nowrap">
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${c.resuelto ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'
          }">
                        ${c.resuelto ? 'Resuelto' : 'No Resuelto'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } else if (tipo === 'estadisticas') {
      const estadisticas = await ServicioEstadisticas.obtenerEstadisticasGestion(parseInt(id_periodo));
      if (!estadisticas) return NextResponse.json({ error: 'No hay datos' }, { status: 404 });

      reportTitle = `Estadísticas finales`;
      htmlContent = `
        <div class="highlight-card mb-8">
          <h2 class="text-xl font-bold mb-6 text-slate-800 border-b border-slate-200 pb-3 flex items-center">
            <svg style="width: 24px; height: 24px;" class="mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Métricas de Carga Horaria
          </h2>
          
          <div class="grid grid-cols-2 gap-6 mb-8">
            <div class="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
              <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Total Asignaciones</p>
              <p class="text-4xl font-black text-slate-900">${estadisticas.total_asignaciones}</p>
            </div>
            <div class="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
              <p class="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Promedio General</p>
              <p class="text-4xl font-black text-slate-900">${estadisticas.media_horas} <span class="text-lg text-slate-500 font-medium tracking-normal">hrs</span></p>
            </div>
          </div>

          <table class="print-table mb-8">
            <thead>
              <tr>
                <th>Métrica Estadística</th>
                <th class="text-right">Valor Registrado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="font-semibold text-slate-800">Mediana</span> <span class="text-slate-500 text-xs ml-1">(Punto medio)</span></td>
                <td class="text-right font-bold text-slate-800">${estadisticas.mediana_horas} hrs</td>
              </tr>
              <tr>
                <td><span class="font-semibold text-slate-800">Desviación Estándar</span> <span class="text-slate-500 text-xs ml-1">(Dispersión)</span></td>
                <td class="text-right font-bold text-slate-800">${estadisticas.desviacion_estandar} hrs</td>
              </tr>
              <tr>
                <td><span class="font-semibold text-slate-800">Mínimo Registrado</span></td>
                <td class="text-right font-bold text-slate-800">${estadisticas.min_horas} hrs</td>
              </tr>
              <tr>
                <td><span class="font-semibold text-slate-800">Máximo Registrado</span></td>
                <td class="text-right font-bold text-slate-800">${estadisticas.max_horas} hrs</td>
              </tr>
            </tbody>
          </table>
          
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center text-sm uppercase tracking-wider">
              <svg style="width: 20px; height: 20px;" class="mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Observaciones Automáticas
            </h3>
            <ul class="list-disc pl-5 text-slate-700 space-y-2">
              ${estadisticas.observaciones.map((o: string) => `<li>${o}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    } else {
      return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 });
    }

    const fullHTML = GeneradorPDF.wrapLayout(htmlContent, reportTitle);
    
    // Si el usuario añade ?format=html a la URL, devolvemos el HTML directamente
    const format = searchParams.get('format');
    if (format === 'html') {
      return new Response(fullHTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("El buffer del PDF está vacío");
    }

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error: any) {
    console.error("ERROR_GENERACION_REPORTES:", error);
    return NextResponse.json({ 
      error: 'Error al generar PDF', 
      details: error.message 
    }, { status: 500 });
  }
}
