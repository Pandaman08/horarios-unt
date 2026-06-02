import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeneradorPDF } from '@/services/reportes/GeneradorPDF';

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────────────
const HORAS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const COLORES_CURSOS = [
  { bg: '#e0f2fe', text: '#0369a1' }, { bg: '#fce7f3', text: '#be185d' },
  { bg: '#fef3c7', text: '#b45309' }, { bg: '#dcfce7', text: '#15803d' },
  { bg: '#f3e8ff', text: '#7e22ce' }, { bg: '#ffedd5', text: '#c2410c' },
  { bg: '#e0e7ff', text: '#4338ca' }, { bg: '#f1f5f9', text: '#334155' },
];

// ─── UTILIDADES ──────────────────────────────────────────────────────────────
function horaAMinutos(hora: string | null): number {
  if (!hora || !hora.includes(':')) return 0;
  const [h, m] = hora.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function duracionHoras(inicio: string, fin: string): number {
  const diff = horaAMinutos(fin) - horaAMinutos(inicio);
  return Math.max(1, Math.round(diff / 60));
}

// ─── GENERADOR DE HTML ──────────────────────────────────────────────────────
function generarReporteUNT(options: {
  horarios: any[];
  titulo: string;
  subtitulo: string;
  periodo: any;
  cicloNumero?: number;
  ambiente?: string;
  docenteNombre?: string;
  paginaIndex?: number;
}): string {
  const { horarios, titulo, subtitulo, periodo, cicloNumero, ambiente, docenteNombre, paginaIndex = 0 } = options;
  const isDocente = !!docenteNombre;

  // 1. Mapa de Cursos para la cabecera
  const cursosMap = new Map();
  horarios.forEach((h: any) => {
    const key = `${h.id_curso}-${h.id_docente}-${h.id_grupo}`;
    const duracion = duracionHoras(h.hora_inicio, h.hora_fin);
    
    if (!cursosMap.has(key)) {
      cursosMap.set(key, {
        docente: `${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}`.trim() || '—',
        asignatura: h.curso?.nombre || '—',
        T: h.tipo_clase === 'teoria' ? duracion : 0,
        P: h.tipo_clase === 'practica' ? duracion : 0,
        L: h.tipo_clase === 'laboratorio' ? duracion : 0,
        G: h.grupo?.codigo_grupo || '—',
        THoras: duracion,
        departamento: h.docente?.especialidad || 'Ing. de Sistemas',
        color: COLORES_CURSOS[cursosMap.size % COLORES_CURSOS.length]
      });
    } else {
      const current = cursosMap.get(key);
      if (h.tipo_clase === 'teoria') current.T += duracion;
      else if (h.tipo_clase === 'practica') current.P += duracion;
      else if (h.tipo_clase === 'laboratorio') current.L += duracion;
      current.THoras += duracion;
    }
  });
  const listaCursosCabecera = Array.from(cursosMap.values());

  // 2. Generar filas de la tabla de cursos
  const filasCursosHtml = listaCursosCabecera.map((c, i) => `
    <tr style="background:${c.color.bg}; height:12px;">
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px;">${i + 1}</td>
      ${isDocente ? '' : `<td style="border:1px solid #cbd5e1; font-size:7px; padding:0 2px;">${c.docente}</td>`}
      <td style="border:1px solid #cbd5e1; font-size:7px; padding:0 2px; color:${c.color.text}; font-weight:700;">${c.asignatura}</td>
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px;">${c.T}</td>
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px;">${c.P}</td>
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px;">${c.L}</td>
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px;">${c.G}</td>
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px; font-weight:800;">${c.THoras}</td>
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px;">${c.departamento}</td>
    </tr>`).join('');

  // 3. Generar la Matriz de Horarios
  const omitirCeldas = new Set();
  const filasMatriz = HORAS.map((hora, i) => {
    if (hora === '13:00') {
      return `<tr style="background:#f1f5f9; height:10px;">
        <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px; font-weight:800;">1-2</td>
        <td colspan="6" style="border:1px solid #cbd5e1; text-align:center; font-size:7px; font-weight:800; letter-spacing:5px;">ALMUERZO</td>
        <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px; font-weight:800;">1-2</td>
      </tr>`;
    }

    const horaLabel = `${parseInt(hora)}-${parseInt(hora) + 1}`;
    const celdasDia = [0, 1, 2, 3, 4, 5].map(dia => {
      const key = `${dia}-${hora}`;
      if (omitirCeldas.has(key)) return '';

      const clases = horarios.filter(h => 
        h.dia_semana === dia && 
        horaAMinutos(h.hora_inicio) <= horaAMinutos(hora) && 
        horaAMinutos(h.hora_fin) > horaAMinutos(hora)
      );

      if (clases.length === 0) return `<td style="border:1px solid #cbd5e1;"></td>`;

      // Si hay clases, agrupamos o dividimos
      const esInicio = clases.some(h => h.hora_inicio === hora);
      if (!esInicio) return ''; // Debería haber sido omitido por un rowspan previo

      // Determinamos la duración máxima de este bloque (para agrupar incluso si son varias)
      const duracionMaxima = Math.max(...clases.map(h => duracionHoras(h.hora_inicio, h.hora_fin)));
      
      // Marcar slots para omitir en el futuro
      for (let j = 1; j < duracionMaxima; j++) {
        const hFutura = HORAS[i + j];
        if (hFutura) omitirCeldas.add(`${dia}-${hFutura}`);
      }

      // Caso 1: Clase única (Rowspan Real para ancho 100%)
      if (clases.length === 1) {
        const h = clases[0];
        const infoCurso = cursosMap.get(`${h.id_curso}-${h.id_docente}-${h.id_grupo}`);
        const color = infoCurso?.color || COLORES_CURSOS[0];
        const cursoNum = listaCursosCabecera.findIndex(c => c.asignatura === h.curso?.nombre && c.G === h.grupo?.codigo_grupo) + 1;
        const tipoClase = h.tipo_clase === 'teoria' ? 'Teo.' : (h.tipo_clase === 'practica' ? 'Prác.' : 'Lab.');

        return `<td rowspan="${duracionMaxima}" style="border:1px solid #cbd5e1; background:${color.bg}; vertical-align:middle; text-align:center; padding:1px;">
          <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%;">
            <div style="font-weight:900; font-size:9px; color:${color.text};">${cursoNum}</div>
            <div style="font-size:6px; color:${color.text}; opacity:.8; margin:0px 0;">(${h.ambiente?.nombre || '—'})</div>
            <div style="font-size:6px; color:${color.text}; font-weight:800; text-transform:uppercase;">${tipoClase}</div>
          </div>
        </td>`;
      }

      // Caso 2: Clases paralelas (Divisiones)
      return `<td rowspan="${duracionMaxima}" style="border:1px solid #cbd5e1; padding:0; vertical-align:top;">
        <div style="display:flex; height:100%; width:100%;">
          ${clases.map((h, idx) => {
            const infoCurso = cursosMap.get(`${h.id_curso}-${h.id_docente}-${h.id_grupo}`);
            const color = infoCurso?.color || COLORES_CURSOS[0];
            const cursoNum = listaCursosCabecera.findIndex(c => c.asignatura === h.curso?.nombre && c.G === h.grupo?.codigo_grupo) + 1;
            const tipoClase = h.tipo_clase === 'teoria' ? 'T' : (h.tipo_clase === 'practica' ? 'P' : 'L');
            return `<div style="flex:1; background:${color.bg}; ${idx < clases.length - 1 ? 'border-right:1px solid #cbd5e1;' : ''} display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; overflow:hidden; padding:1px;">
              <div style="font-weight:900; font-size:8px; color:${color.text};">${cursoNum}</div>
              <div style="font-size:5px; color:${color.text}; opacity:.8;">(${h.ambiente?.nombre?.substring(0,6) || '—'})</div>
              <div style="font-size:5px; color:${color.text}; font-weight:bold;">${tipoClase}</div>
            </div>`;
          }).join('')}
        </div>
      </td>`;
    }).join('');

    return `<tr style="height:32px;">
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px; font-weight:800; background:#f8fafc;">${horaLabel}</td>
      ${celdasDia}
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:7px; font-weight:800; background:#f8fafc;">${horaLabel}</td>
    </tr>`;
  }).join('');

  const numColsHeader = isDocente ? 8 : 9;
  const etiquetaPrimera = ambiente ? 'AMBIENTE' : 'CICLO';
  const valorPrimera = ambiente ?? cicloNumero ?? '—';

  return `
    <div style="padding:10px; font-family:'Inter', sans-serif; height: 100%; ${paginaIndex > 0 ? 'page-break-before:always;' : ''}">
      <div style="display:flex; gap:10px; margin-bottom:10px; align-items: stretch;">
        <div style="width:310px; border:2px solid #003366; border-radius:10px; padding:8px; display:flex; flex-direction:column; gap:0;">
          <div style="text-align:center; font-weight:900; font-size:12px; color:#000; margin-bottom:1px; text-transform:uppercase; letter-spacing:0.3px;">UNIVERSIDAD NACIONAL DE TRUJILLO</div>
          <div style="text-align:center; font-weight:900; font-size:11px; color:#000; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.2px;">FACULTAD DE INGENIERÍA TRUJILLO</div>
          
          <div style="border-bottom: 1px solid #cbd5e1; padding: 2px 0; font-size:9px; color:#000; display:flex; justify-content:space-between;">
            <span style="font-weight:800;">ESCUELA:</span>
            <span>INGENIERÍA DE SISTEMAS</span>
          </div>
          
          <div style="border-bottom: 1px solid #cbd5e1; padding: 2px 0; font-size:9px; color:#000; display:flex; justify-content:space-between;">
            <div><span style="font-weight:800;">${etiquetaPrimera}:</span> ${valorPrimera}</div>
            <div><span style="font-weight:800;">SECCIÓN:</span> A</div>
          </div>
          
          <div style="padding: 2px 0; font-size:9px; color:#000; display:flex; justify-content:space-between; margin-bottom:4px;">
            <div><span style="font-weight:800;">AÑO:</span> ${periodo?.anio || 2026}</div>
            <div><span style="font-weight:800;">SEMESTRE:</span> ${periodo?.semestre === 1 ? 'I' : 'II'}</div>
          </div>
          
          <div style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:6px; padding:4px 8px; margin-top:auto;">
            <div style="font-size:9px; text-align:right; color:#000; font-weight:700;">
              Inicio: ${periodo?.fecha_inicio_clases?.toLocaleDateString('es-PE') || '—'}
            </div>
            <div style="font-size:9px; text-align:right; color:#000; font-weight:700;">
              Término: ${periodo?.fecha_fin_clases?.toLocaleDateString('es-PE') || '—'}
            </div>
          </div>
        </div>
        <div style="flex:1;">
          <table style="width:100%; border-collapse:collapse; border:2px solid #003366; height:100%;">
            <thead>
              <tr style="background:#003366; color:white; font-size:8px; height:20px;">
                <th style="width:20px; border:1px solid #003366;">Nº</th> 
                ${isDocente ? '' : '<th style="border:1px solid #003366;">PROFESOR</th>'} 
                <th style="border:1px solid #003366;">ASIGNATURA</th> 
                <th style="width:18px; border:1px solid #003366;">T</th> 
                <th style="width:18px; border:1px solid #003366;">P</th> 
                <th style="width:18px; border:1px solid #003366;">L</th> 
                <th style="width:22px; border:1px solid #003366;">G</th> 
                <th style="width:28px; border:1px solid #003366;">HRS</th> 
                <th style="border:1px solid #003366;">DEPTO.</th>
              </tr>
            </thead>
            <tbody>${filasCursosHtml}</tbody>
          </table>
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse; border:2px solid #003366; table-layout:fixed;">
        <thead>
          <tr style="background:#003366; color:white; font-size:8px; height:22px;">
            <th style="width:55px; border:1px solid #003366;">HORA</th> 
            ${DIAS.map(d => `<th style="border:1px solid #003366;">${d.toUpperCase()}</th>`).join('')} 
            <th style="width:55px; border:1px solid #003366;">HORA</th>
          </tr>
        </thead>
        <tbody>${filasMatriz}</tbody>
      </table>
    </div>`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const id = searchParams.get('id');
    const id_periodo = searchParams.get('id_periodo');

    if (tipo === 'reporte_general' && id_periodo) {
      const periodoIdNum = parseInt(id_periodo);
      if (isNaN(periodoIdNum)) return NextResponse.json({ error: 'ID de periodo inválido' }, { status: 400 });

      const ciclos = await prisma.ciclo.findMany({ orderBy: { numero: 'asc' } });
      const periodo = await prisma.periodoAcademico.findUnique({ where: { id_periodo: periodoIdNum } });
      
      const htmlPages = [];
      for (const ciclo of ciclos) {
        const horarios = await prisma.horarioAsignado.findMany({
          where: { 
            id_periodo: periodoIdNum,
            OR: [
              { curso: { id_ciclo: ciclo.id_ciclo } },
              { grupo: { id_ciclo: ciclo.id_ciclo } }
            ]
          },
          include: { curso: true, ambiente: true, docente: true, grupo: true }
        });
        if (horarios.length > 0) {
          htmlPages.push(generarReporteUNT({
            horarios, titulo: `HORARIO: ${ciclo.nombre}`, subtitulo: '', periodo, cicloNumero: ciclo.numero, paginaIndex: htmlPages.length
          }));
        }
      }

      if (htmlPages.length === 0) {
        return NextResponse.json({ error: 'No hay horarios asignados para este periodo' }, { status: 404 });
      }

      const htmlFinal = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
              * { box-sizing: border-box; }
              body { margin: 0; padding: 0; background: white; font-family: 'Inter', sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #cbd5e1; padding: 0; }
              @media print {
                .page-break { page-break-after: always; }
              }
            </style>
          </head>
          <body>${htmlPages.join('')}</body>
        </html>
      `;

      const pdfBuffer = await GeneradorPDF.generarDesdeHTML(htmlFinal, true);

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Horario_Institucional_Sistemas.pdf"'
        }
      });
    }

    // Casos individuales (ciclo, docente, ambiente) simplificados para estabilidad
    if ((tipo === 'ciclo' || tipo === 'docente' || tipo === 'ambiente') && id && id_periodo) {
      const periodoIdNum = parseInt(id_periodo);
      const targetIdNum = parseInt(id);
      if (isNaN(periodoIdNum) || isNaN(targetIdNum)) return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });

      const where: any = { id_periodo: periodoIdNum };
      if (tipo === 'ciclo') {
        where.OR = [
          { curso: { id_ciclo: targetIdNum } },
          { grupo: { id_ciclo: targetIdNum } }
        ];
      }
      else if (tipo === 'docente') where.id_docente = targetIdNum;
      else if (tipo === 'ambiente') where.id_ambiente = targetIdNum;

      const horarios = await prisma.horarioAsignado.findMany({
        where, include: { curso: true, ambiente: true, docente: true, grupo: true }
      });
      const periodo = await prisma.periodoAcademico.findUnique({ where: { id_periodo: periodoIdNum } });

      let titulo = 'REPORTE';
      let cicloNumero = undefined;
      if (tipo === 'ciclo') {
        const ciclo = await prisma.ciclo.findUnique({ where: { id_ciclo: targetIdNum } });
        titulo = `HORARIO: ${ciclo?.nombre || 'CICLO'}`;
        cicloNumero = ciclo?.numero;
      }

      const htmlContent = generarReporteUNT({ horarios, titulo, subtitulo: '', periodo, cicloNumero });
      
      const htmlFinal = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
              * { box-sizing: border-box; }
              body { margin: 0; padding: 0; background: white; font-family: 'Inter', sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #cbd5e1; padding: 0; }
            </style>
          </head>
          <body>${htmlContent}</body>
        </html>
      `;

      const pdfBuffer = await GeneradorPDF.generarDesdeHTML(htmlFinal, tipo === 'ciclo' || tipo === 'ambiente');

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`
        }
      });
    }

    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno', details: error.message }, { status: 500 });
  }
}
