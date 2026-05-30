import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GeneradorPDF } from '@/services/reportes/GeneradorPDF';
import { ServicioEstadisticas } from '@/services/reportes/ServicioEstadisticas';

// ─── PALETA DE COLORES POR CURSO ─────────────────────────────────────────────
const COLORES_CURSOS = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  { bg: '#fce7f3', border: '#ec4899', text: '#be185d' },
  { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
  { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9' },
  { bg: '#ffedd5', border: '#f97316', text: '#c2410c' },
  { bg: '#cffafe', border: '#06b6d4', text: '#0e7490' },
  { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
  { bg: '#f0fdf4', border: '#4ade80', text: '#166534' },
  { bg: '#fdf4ff', border: '#d946ef', text: '#86198f' },
];

// ─── HORAS DEL HORARIO ────────────────────────────────────────────────────────
const HORAS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function duracionHoras(inicio: string, fin: string): number {
  return (horaAMinutos(fin) - horaAMinutos(inicio)) / 60;
}

function colorPorCurso(index: number) {
  return COLORES_CURSOS[index % COLORES_CURSOS.length];
}

// ─── CONSTRUIR MAPA DE COLORES POR CURSO ────────────────────────────────────
function buildColorMap(horarios: any[]): Map<string, { color: any; index: number }> {
  const map = new Map<string, { color: any; index: number }>();
  let idx = 0;
  for (const h of horarios) {
    const key = `${h.id_curso}-${h.id_grupo ?? 'sin_grupo'}`;
    if (!map.has(key)) {
      map.set(key, { color: colorPorCurso(idx), index: idx });
      idx++;
    }
  }
  return map;
}

// ─── CSS GLOBAL PARA LOS REPORTES VISUALES ───────────────────────────────────
const CSS_VISUAL = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }

  .page-wrap { padding: 24px; max-width: 1200px; margin: 0 auto; }

  /* ── Cabecera ── */
  .report-header {
    background: linear-gradient(135deg, #003366 0%, #0055a5 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 16px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .report-header h1 { font-size: 20px; font-weight: 800; }
  .report-header .meta { font-size: 12px; opacity: .8; margin-top: 4px; }
  .report-header .badge-right {
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.3);
    border-radius: 10px;
    padding: 8px 16px;
    text-align: center;
  }
  .report-header .badge-right .val { font-size: 20px; font-weight: 900; }
  .report-header .badge-right .lbl { font-size: 10px; opacity: .8; text-transform: uppercase; letter-spacing: .05em; }

  /* ── Schedule Grid ── */
  .schedule-wrap {
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }

  .schedule-grid {
    display: grid;
    grid-template-columns: 130px repeat(6, 1fr);
    border-left: 1px solid #e2e8f0;
  }

  /* Cabecera días */
  .day-header {
    background: #0d9488;
    color: white;
    font-weight: 700;
    font-size: 12px;
    text-align: center;
    padding: 10px 4px;
    border-right: 1px solid rgba(255,255,255,.2);
    border-bottom: 2px solid #0f766e;
  }
  .day-header.hora-col {
    background: #f1f5f9;
    color: #64748b;
  }

  /* Filas de hora */
  .hora-label {
    background: #f8fafc;
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    padding: 0 6px;
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
  }

  .cell {
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #f1f5f9;
    padding: 2px;
    min-height: 36px;
    position: relative;
  }
  .cell:last-child { border-right: none; }

  /* Bloque de clase */
  .class-card {
    border-radius: 5px;
    padding: 3px 5px;
    height: 100%;
    min-height: 32px;
    border-left: 3px solid;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
  }
  .class-card .course-code {
    font-size: 10px;
    font-weight: 800;
    line-height: 1.2;
  }
  .class-card .course-sub {
    font-size: 9px;
    font-weight: 500;
    opacity: .85;
  }
  .class-card .course-extra {
    font-size: 9px;
    opacity: .7;
    display: none;
    margin-top: 2px;
  }

  /* ── Leyenda ── */
  .legend-wrap {
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 16px 20px;
    margin-bottom: 20px;
  }
  .legend-wrap h3 {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: .05em;
    margin-bottom: 12px;
  }
  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #334155;
  }
  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border-left: 3px solid;
    flex-shrink: 0;
  }

  /* ── Stats cards ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
  .stat-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 16px;
  }
  .stat-card .stat-val { font-size: 28px; font-weight: 900; color: #003366; }
  .stat-card .stat-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: .05em; margin-bottom: 4px; }

  /* ── Table básica para reportes de lista ── */
  .list-wrap {
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .list-table { width: 100%; border-collapse: collapse; }
  .list-table th {
    background: #f1f5f9;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: #475569;
    padding: 10px 12px;
    border-bottom: 2px solid #e2e8f0;
    text-align: left;
  }
  .list-table td {
    padding: 9px 12px;
    font-size: 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }
  .list-table tr:last-child td { border-bottom: none; }
  .list-table tr:hover td { background: #f8fafc; }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .03em;
  }
  .badge-teoria { background: #dbeafe; color: #1d4ed8; }
  .badge-practica { background: #ede9fe; color: #6d28d9; }
  .badge-lab { background: #dcfce7; color: #15803d; }

  .page-break { page-break-after: always; }

  @media print {
    body { background: white; }
    .page-wrap { padding: 12px; }
    .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .class-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .day-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

// ─── GENERAR CABECERA DEL REPORTE ────────────────────────────────────────────
function generarCabecera(titulo: string, subtitulo: string, periodoNombre: string, stats?: { label: string; valor: string }[]) {
  const statsHtml = stats?.map(s => `
    <div class="badge-right" style="margin-left:10px;">
      <div class="val">${s.valor}</div>
      <div class="lbl">${s.label}</div>
    </div>
  `).join('') ?? '';

  return `
    <div class="report-header">
      <div>
        <h1>${titulo}</h1>
        <div class="meta">${subtitulo} &nbsp;·&nbsp; ${periodoNombre}</div>
      </div>
      <div style="display:flex; align-items:center;">
        ${statsHtml}
      </div>
    </div>
  `;
}

// ─── GENERAR GRID VISUAL DE HORARIO ──────────────────────────────────────────
function generarGridHorario(horarios: any[], colorMap: Map<string, { color: any; index: number }>, mostrarDocente = false, mostrarAmbiente = true): string {
  // Cabecera días
  const headerHtml = `
    <div class="day-header hora-col">Hora</div>
    ${DIAS.map(d => `<div class="day-header">${d}</div>`).join('')}
  `;

  // Filas por hora
  const filasHtml = HORAS.map(hora => {
    const horaFin = `${String(parseInt(hora.split(':')[0]) + 1).padStart(2, '0')}:00`;
    const celdas = DIAS.map((_, diaIdx) => {
      const clasesEnCelda = horarios.filter(h => {
        if (h.dia_semana !== diaIdx || !h.hora_inicio || !h.hora_fin) return false;
        const inicioMin = horaAMinutos(h.hora_inicio);
        const horaActualMin = horaAMinutos(hora);
        return inicioMin === horaActualMin;
      });

      if (clasesEnCelda.length === 0) {
        return `<div class="cell"></div>`;
      }

      const claseHtml = clasesEnCelda.map(h => {
        const key = `${h.id_curso}-${h.id_grupo ?? 'sin_grupo'}`;
        const colorEntry = colorMap.get(key);
        const color = colorEntry?.color ?? COLORES_CURSOS[0];
        const duracion = h.hora_inicio && h.hora_fin ? duracionHoras(h.hora_inicio, h.hora_fin) : 1;
        const height = `${duracion * 36 + (duracion - 1)}px`;

        const nombre = h.curso?.nombre ?? h.curso?.codigo ?? '—';
        const cicloNum = h.curso?.ciclo_rel?.numero ?? '';
        const ambiente = h.ambiente?.nombre ?? '—';
        const docente = h.docente ? `${h.docente.nombres ?? ''} ${h.docente.apellidos ?? ''}`.trim() : '';

        const linea2 = mostrarDocente && docente ? docente : (cicloNum ? `${cicloNum}° Ciclo` : '');
        const linea3 = mostrarAmbiente ? ambiente : '';

        return `
          <div class="class-card" style="background:${color.bg}; border-left-color:${color.border}; color:${color.text}; min-height:${height};">
            <div class="course-code">${nombre.length > 14 ? nombre.substring(0, 13) + '…' : nombre}</div>
            ${linea2 ? `<div class="course-sub">${linea2}</div>` : ''}
            ${linea3 ? `<div class="course-extra">${linea3}</div>` : ''}
          </div>
        `;
      }).join('');

      return `<div class="cell">${claseHtml}</div>`;
    }).join('');

    return `
      <div class="hora-label">${hora} - ${horaFin}</div>
      ${celdas}
    `;
  }).join('');

  return `
    <div class="schedule-wrap">
      <div class="schedule-grid">
        ${headerHtml}
        ${filasHtml}
      </div>
    </div>
  `;
}

// ─── GENERAR LEYENDA ─────────────────────────────────────────────────────────
function generarLeyenda(horarios: any[], colorMap: Map<string, { color: any; index: number }>): string {
  const cursosVistos = new Map<string, { nombre: string; color: any }>();
  for (const h of horarios) {
    const key = `${h.id_curso}-${h.id_grupo ?? 'sin_grupo'}`;
    if (!cursosVistos.has(key)) {
      const entry = colorMap.get(key);
      const nombre = h.curso?.nombre ?? h.curso?.codigo ?? '—';
      cursosVistos.set(key, { nombre, color: entry?.color ?? COLORES_CURSOS[0] });
    }
  }

  if (cursosVistos.size === 0) return '';

  const itemsHtml = Array.from(cursosVistos.values()).map(c => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${c.color.bg}; border-left-color:${c.color.border};"></div>
      <span style="color:${c.color.text};">${c.nombre}</span>
    </div>
  `).join('');

  return `
    <div class="legend-wrap">
      <h3>Leyenda de Cursos</h3>
      <div class="legend-items">${itemsHtml}</div>
    </div>
  `;
}

// ─── GENERAR REPORTE ESTILO UNT (COMO REPORTE GENERAL) ─────────────────────
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
  const etiquetaPrimera = ambiente ? 'AMBIENTE' : 'CICLO';
  const valorPrimera = ambiente ?? cicloNumero ?? '—';
  const colorMap = buildColorMap(horarios);

  const cursosMap = new Map<string, any>();
  horarios.forEach((h: any) => {
    const key = `${h.id_curso}-${h.id_docente}-${h.id_grupo}`;
    if (!cursosMap.has(key)) {
      cursosMap.set(key, {
        docente: `${h.docente?.nombres ?? ''} ${h.docente?.apellidos ?? ''}`.trim(),
        asignatura: h.curso?.nombre ?? '—',
        T: h.curso?.horas_teoria ?? 0,
        P: h.curso?.horas_practica ?? 0,
        L: h.curso?.horas_laboratorio ?? 0,
        G: h.grupo?.codigo_grupo ?? '—',
        THoras: (h.curso?.horas_teoria ?? 0) + (h.curso?.horas_practica ?? 0) + (h.curso?.horas_laboratorio ?? 0),
        departamento: h.docente?.especialidad ?? 'Ing. de Sistemas',
      });
    }
  });
  const listaCursos = Array.from(cursosMap.values());

  const numColsTable = isDocente ? 8 : 9;

  const filasCursosHtml = listaCursos.map((c, i) => {
    const color = colorPorCurso(i);
    const celdas = [
      `<td style="border:1px solid #cbd5e1; text-align:center; font-size:8px; padding:1px;">${i + 1}</td>`,
      isDocente ? '' : `<td style="border:1px solid #cbd5e1; font-size:8px; padding:1px 3px;">${c.docente}</td>`,
      `<td style="border:1px solid #cbd5e1; font-size:8px; padding:1px 3px; color:${color.text}; font-weight:700;">${c.asignatura}</td>`,
      `<td style="border:1px solid #cbd5e1; text-align:center; font-size:8px;">${c.T}</td>`,
      `<td style="border:1px solid #cbd5e1; text-align:center; font-size:8px;">${c.P}</td>`,
      `<td style="border:1px solid #cbd5e1; text-align:center; font-size:8px;">${c.L}</td>`,
      `<td style="border:1px solid #cbd5e1; text-align:center; font-size:8px;">${c.G}</td>`,
      `<td style="border:1px solid #cbd5e1; text-align:center; font-size:8px; font-weight:800;">${c.THoras}</td>`,
      `<td style="border:1px solid #cbd5e1; text-align:center; font-size:8px;">${c.departamento}</td>`,
    ].filter(Boolean).join('');

    return `<tr style="background:${color.bg};">${celdas}</tr>`;
  }).join('');

  const filasVacias = Array(Math.max(0, 6 - listaCursos.length)).fill(0).map(() =>
    `<tr><td style="border:1px solid #cbd5e1; height:10px;" colspan="${numColsTable}"></td></tr>`
  ).join('');

  const filasMatriz = HORAS.map(hora => {
    if (hora === '13:00') return `
      <tr style="background:#f1f5f9; height:12px;">
        <td style="border:1px solid #cbd5e1; text-align:center; font-size:8px; font-weight:800;">1-2</td>
        <td colspan="6" style="border:1px solid #cbd5e1; text-align:center; font-size:8px; font-weight:800; letter-spacing:5px;">ALMUERZO</td>
        <td style="border:1px solid #cbd5e1; text-align:center; font-size:8px; font-weight:800;">1-2</td>
      </tr>`;
    const horaNum = parseInt(hora.split(':')[0]);
    const horaLabel = `${horaNum}-${horaNum + 1}`;
    const celdas = [0, 1, 2, 3, 4, 5].map(dia => {
      const clase = horarios.find((h: any) => {
        if (h.dia_semana !== dia || !h.hora_inicio || !h.hora_fin) return false;
        return horaAMinutos(h.hora_inicio) === horaAMinutos(hora);
      });
      if (clase) {
        const key = `${clase.id_curso}-${clase.id_grupo ?? 'sin_grupo'}`;
        const entry = colorMap.get(key);
        const color = entry?.color ?? COLORES_CURSOS[0];
        const cursoIdx = listaCursos.findIndex(c => c.asignatura === (clase.curso?.nombre ?? '—') && c.G === (clase.grupo?.codigo_grupo ?? '—'));
        const cicloClase = clase.curso?.ciclo_rel?.numero ?? '';
        return `<td style="border:1px solid #cbd5e1; background:${color.bg}; text-align:center; padding:1px; vertical-align:middle;">
          <div style="font-weight:800; font-size:10px; color:${color.text};">${cursoIdx + 1}</div>
          ${isDocente && cicloClase ? `<div style="font-size:8px; color:${color.text}; opacity:.9;">${cicloClase}° Ciclo</div>` : ''}
          <div style="font-size:8px; color:${color.text}; opacity:.8;">(${clase.ambiente?.nombre ?? '—'})</div>
        </td>`;
      }
      return `<td style="border:1px solid #cbd5e1;"></td>`;
    }).join('');
    return `<tr style="height:39px;">
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:8px; font-weight:800; background:#f8fafc;">${horaLabel}</td>
      ${celdas}
      <td style="border:1px solid #cbd5e1; text-align:center; font-size:8px; font-weight:800; background:#f8fafc;">${horaLabel}</td>
    </tr>`;
  }).join('');

  const tableHeaders = [
    `<th style="border:1px solid #1e4d80; font-size:8px; width:22px; padding:2px;">Nº</th>`,
    isDocente ? '' : `<th style="border:1px solid #1e4d80; font-size:8px; padding:2px;">PROFESOR</th>`,
    `<th style="border:1px solid #1e4d80; font-size:8px; padding:2px;">ASIGNATURA</th>`,
    `<th style="border:1px solid #1e4d80; font-size:8px; width:16px;">T</th>`,
    `<th style="border:1px solid #1e4d80; font-size:8px; width:16px;">P</th>`,
    `<th style="border:1px solid #1e4d80; font-size:8px; width:16px;">L</th>`,
    `<th style="border:1px solid #1e4d80; font-size:8px; width:16px;">G</th>`,
    `<th style="border:1px solid #1e4d80; font-size:8px; width:35px;">HRS</th>`,
    `<th style="border:1px solid #1e4d80; font-size:8px; width:90px;">DEPTO.</th>`,
  ].filter(Boolean).join('');

  return `
    <div style="padding:8px 12px; font-family:'Inter',sans-serif; ${paginaIndex > 0 ? 'page-break-before:always;' : ''}">
      ${isDocente ? `
        <div style="margin-bottom:6px; padding:6px 10px; background:#003366; color:white; border-radius:6px;">
          <div style="font-size:14px; font-weight:900; text-transform:uppercase;">DOCENTE: ${docenteNombre}</div>
        </div>
      ` : ''}
      <div style="display:flex; gap:10px; margin-bottom:8px; align-items:stretch;">
        <div style="width:280px; border:2px solid #003366; border-radius:6px; padding:8px; display:flex; flex-direction:column; justify-content:space-between;">
          <div style="text-align:center; margin-bottom:6px;">
            <div style="font-weight:900; font-size:11px;">UNIVERSIDAD NACIONAL DE TRUJILLO</div>
            <div style="font-weight:800; font-size:10px;">FACULTAD DE INGENIERÍA TRUJILLO</div>
          </div>
          <div>
            <div style="font-size:9.5px; border-bottom:1px solid #ddd; padding-bottom:1px;"><strong>ESCUELA:</strong> INGENIERÍA DE SISTEMAS</div>
            ${!isDocente ? `
              <div style="display:flex; justify-content:space-between; font-size:9.5px; border-bottom:1px solid #ddd; padding:1px 0;">
                <div><strong>${etiquetaPrimera}:</strong> ${valorPrimera}</div>
                <div><strong>SECCIÓN:</strong> A</div>
              </div>
            ` : `
              <div style="display:flex; justify-content:space-between; font-size:9.5px; border-bottom:1px solid #ddd; padding:1px 0;">
                <div><strong>SECCIÓN:</strong> A</div>
              </div>
            `}
            <div style="display:flex; justify-content:space-between; font-size:9.5px; border-bottom:1px solid #ddd; padding:1px 0;">
              <div><strong>AÑO:</strong> ${periodo?.anio ?? 2026}</div>
              <div><strong>SEMESTRE:</strong> ${periodo?.semestre === 1 ? 'I' : 'II'}</div>
            </div>
          </div>
          <div style="text-align:right; font-size:8.5px; font-weight:800; margin-top:6px; background:#f8fafc; padding:4px; border:1px solid #cbd5e1; border-radius:3px;">
            <div>Inicio: ${periodo?.fecha_inicio_clases?.toLocaleDateString('es-PE') ?? '—'}</div>
            <div>Término: ${periodo?.fecha_fin_clases?.toLocaleDateString('es-PE') ?? '—'}</div>
          </div>
        </div>
        <div style="flex:1;">
          <table style="width:100%; border-collapse:collapse; border:2px solid #003366; border-radius:8px; overflow:hidden;">
            <thead>
              <tr style="background:#003366; color:white;">
                ${tableHeaders}
              </tr>
            </thead>
            <tbody>${filasCursosHtml}${filasVacias}</tbody>
          </table>
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse; border:2px solid #003366; border-radius:6px; overflow:hidden; table-layout:fixed;">
        <thead>
          <tr style="background:#003366; color:white; height:20px;">
            <th style="border:1px solid #1e4d80; font-size:8px; width:55px;">HORA</th>
            ${DIAS.map(d => `<th style="border:1px solid #1e4d80; font-size:8px;">${d.toUpperCase()}</th>`).join('')}
            <th style="border:1px solid #1e4d80; font-size:8px; width:55px;">HORA</th>
          </tr>
        </thead>
        <tbody>${filasMatriz}</tbody>
      </table>
      <div style="margin-top:4px; font-size:7px; color:#64748b; text-align:right; font-style:italic;">
        Generado el ${new Date().toLocaleString('es-PE')} · Sistema de Gestión de Horarios UNT
      </div>
    </div>
  `;
}

// ─── LAYOUT COMPLETO ─────────────────────────────────────────────────────────
function wrapLayout(bodyHtml: string, titulo: string, landscape = false): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo}</title>
  <style>${CSS_VISUAL}</style>
</head>
<body>
  <div class="page-wrap">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const id = searchParams.get('id');
    const id_periodo = searchParams.get('id_periodo');
    const formato = searchParams.get('formato') || 'pdf';

    if (!id_periodo || isNaN(parseInt(id_periodo))) {
      return NextResponse.json({ error: 'Falta id_periodo o es inválido' }, { status: 400 });
    }

    let htmlContent = '';
    let reportTitle = '';
    let isLandscape = false;

    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(id_periodo) }
    });
    const periodoNombre = periodo?.nombre ?? '';

    // ── DÍA ──────────────────────────────────────────────────────────────────
    if (tipo === 'dia') {
      if (!id || isNaN(parseInt(id))) return NextResponse.json({ error: 'Falta id de día' }, { status: 400 });
      const diaIndex = parseInt(id);
      const nombreDia = DIAS[diaIndex] ?? 'Desconocido';
      const horarios = await prisma.horarioAsignado.findMany({
        where: { id_periodo: parseInt(id_periodo), dia_semana: diaIndex },
        include: { docente: true, curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true },
        orderBy: [{ hora_inicio: 'asc' }]
      });
      reportTitle = `Reporte de Horarios: ${nombreDia}`;

      const periodoSuffix = `${periodo?.anio ?? ''}-${periodo?.semestre === 1 ? 'I' : 'II'}`;

      const horariosSorted = [...horarios].sort((a, b) =>
        (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? '')
      );

      const content = `
        <style>
          .compact-header {
            display:flex; justify-content:space-between; align-items:center;
            padding:12px 0; margin-bottom:12px;
            border-bottom:2px solid #003366;
          }
          .compact-title {
            font-size:20px; font-weight:800; color:#003366; margin:0;
          }
          .compact-meta {
            font-size:12px; color:#64748b; text-align:right;
          }
          .compact-summary {
            display:flex; justify-content:space-between; align-items:center;
            padding:10px 16px; margin-bottom:12px;
            background:#f8fafc; border-radius:8px;
            border:1px solid #e2e8f0;
          }
          .compact-summary .day-badge {
            background:#003366; color:white; padding:6px 14px;
            border-radius:6px; font-weight:800; text-transform:uppercase;
            letter-spacing:.05em; font-size:11px;
          }
          .compact-summary .count {
            font-weight:900; font-size:18px; color:#003366;
          }
          .compact-summary .count-label {
            font-size:10px; color:#64748b; text-transform:uppercase;
            letter-spacing:.05em; font-weight:600;
          }
          .compact-table {
            width:100%; border-collapse:collapse;
          }
          .compact-table th {
            background:#003366; color:white; font-weight:700;
            font-size:10px; text-transform:uppercase; letter-spacing:.05em;
            padding:8px 10px; text-align:left;
          }
          .compact-table td {
            padding:8px 10px; font-size:11px;
            border-bottom:1px solid #e2e8f0;
            vertical-align:top;
          }
          .compact-table tr:last-child td { border-bottom:none; }
          .compact-badge {
            display:inline-block; padding:2px 8px;
            border-radius:4px; font-size:10px; font-weight:700;
            text-transform:uppercase; letter-spacing:.03em;
          }
          .badge-ciclo { background:#f1f5f9; color:#475569; }
          .badge-ambiente { background:#e2e8f0; color:#334155; }
          .badge-tipo { background:#dbeafe; color:#1d4ed8; }
        </style>

        <div class="compact-header">
          <div>
            <h1 class="compact-title">UNIVERSIDAD NACIONAL DE TRUJILLO</h1>
            <div style="font-size:12px; color:#64748b; font-weight:600;">Facultad de Ingeniería - Escuela de Ingeniería de Sistemas</div>
          </div>
          <div class="compact-meta">
            <div>Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}</div>
            <div style="font-weight:700; color:#003366;">${periodo?.nombre ?? ''}</div>
          </div>
        </div>

        <h2 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 12px 0;">
          REPORTE DE HORARIOS: ${nombreDia.toUpperCase()} (${periodoSuffix})
        </h2>

        <div class="compact-summary">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="day-badge">${nombreDia.toUpperCase()}</div>
            <div>
              <div class="count-label">Resumen del día</div>
              <div class="count">${horariosSorted.length} CLASES PROGRAMADAS</div>
            </div>
          </div>
        </div>

        <table class="compact-table">
          <thead>
            <tr>
              <th style="width:80px;">HORARIO</th>
              <th style="width:60px; text-align:center;">CICLO</th>
              <th>CURSO / GRUPO</th>
              <th>DOCENTE</th>
              <th style="width:120px;">AMBIENTE</th>
              <th style="width:70px;">TIPO</th>
            </tr>
          </thead>
          <tbody>
            ${horariosSorted.map((h: any) => {
        const ciclo = h.curso?.ciclo_rel?.numero ?? '—';
        const curso = h.curso?.nombre ?? '—';
        const grupo = h.grupo?.codigo_grupo ?? '—';
        const docente = h.docente ? `${h.docente.nombres ?? ''} ${h.docente.apellidos ?? ''}`.trim() : '—';
        const ambiente = h.ambiente?.nombre ?? '—';
        const tipo = h.tipo_clase ? h.tipo_clase.replace('_', ' ') : 'TEORÍA';
        return `
                <tr>
                  <td style="font-weight:800; color:#003366; font-size:12px;">
                    ${h.hora_inicio ?? '—'}<br/>
                    <span style="font-size:10px; color:#64748b; font-weight:500;">- ${h.hora_fin ?? ''}</span>
                  </td>
                  <td style="text-align:center;">
                    <span class="compact-badge badge-ciclo">${ciclo}</span>
                  </td>
                  <td>
                    <div style="font-weight:800; color:#0f172a;">${curso}</div>
                    <div style="font-size:10px; color:#64748b;">Grupo: ${grupo}</div>
                  </td>
                  <td style="font-weight:600; color:#334155;">${docente}</td>
                  <td>
                    <span class="compact-badge badge-ambiente">${ambiente}</span>
                  </td>
                  <td>
                    <span class="compact-badge badge-tipo">${tipo}</span>
                  </td>
                </tr>
              `;
      }).join('')}
          </tbody>
        </table>
      `;

      const fullHTML = GeneradorPDF.wrapLayout(content, reportTitle, true);
      const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, false);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="reporte-dia-${nombreDia.toLowerCase()}.pdf"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      });

      // ── DOCENTE ───────────────────────────────────────────────────────────────
    } else if (tipo === 'docente' || tipo === 'docente_propio') {
      let docenteId = id;
      if (tipo === 'docente_propio') {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id_usuario) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        const docenteData = await prisma.docente.findUnique({ where: { id_usuario: session.user.id_usuario } });
        if (!docenteData) return NextResponse.json({ error: 'Usuario no es docente' }, { status: 403 });
        docenteId = docenteData.id_docente.toString();
      }
      if (!docenteId || isNaN(parseInt(docenteId))) return NextResponse.json({ error: 'Falta id de docente' }, { status: 400 });

      const docente = await prisma.docente.findUnique({
        where: { id_docente: parseInt(docenteId) },
        include: {
          horarios_asignados: {
            where: { id_periodo: parseInt(id_periodo) },
            include: { curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true }
          }
        }
      });
      if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });


      isLandscape = true;
      reportTitle = `Horario Docente: ${docente.nombres} ${docente.apellidos}`;

      const fullHTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>${reportTitle}</title>
        <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; } body { font-family:'Inter',sans-serif; }
        @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
        </style></head><body>${generarReporteUNT({
        horarios: docente.horarios_asignados ?? [],
        titulo: reportTitle,
        subtitulo: docente.codigo_docente ?? '',
        periodo: periodo,
        docenteNombre: `${docente.nombres} ${docente.apellidos}`,
        paginaIndex: 0
      })}</body></html>`;
      const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, true);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-docente-${docenteId}.pdf"`, 'Content-Length': pdfBuffer.length.toString() }
      });

      // ── AULA / TODAS LAS AULAS ────────────────────────────────────────────────

    } else if (tipo === 'aula' || tipo === 'aulas_todas') {
      if (tipo === 'aula' && (!id || isNaN(parseInt(id)))) return NextResponse.json({ error: 'Falta id de ambiente' }, { status: 400 });

      let ambientesRaw: any[] = [];
      if (tipo === 'aula') {
        const a = await prisma.ambiente.findUnique({
          where: { id_ambiente: parseInt(id!) },
          include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) }, include: { curso: { include: { ciclo_rel: true } }, docente: true, grupo: true } } }
        });
        ambientesRaw = a ? [a] : [];
      } else {
        ambientesRaw = await prisma.ambiente.findMany({
          include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) }, include: { curso: { include: { ciclo_rel: true } }, docente: true, grupo: true } } },
          orderBy: { nombre: 'asc' }
        });
      }

      reportTitle = tipo === 'aula' ? 'Horario de Ambiente' : 'Consolidado de Ambientes';
      const ambientesConH = ambientesRaw.filter(a => a?.horarios_asignados?.length > 0);

      if (ambientesConH.length === 0) {
        const fullHTML = wrapLayout(`<div style="text-align:center; padding:40px; color:#64748b;">No hay horarios asignados en este período.</div>`, reportTitle, true);
        const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, true);
        return new Response(new Uint8Array(pdfBuffer), {
          headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`, 'Content-Length': pdfBuffer.length.toString() }
        });
      }

      const paginas = ambientesConH.map((a, idx) =>
        generarReporteUNT({
          horarios: a.horarios_asignados,
          titulo: a.nombre ?? 'Ambiente',
          subtitulo: `${(a.tipo ?? '').replace('_', ' ')} · Cap. ${a.capacidad ?? 0} est.`,
          periodo: periodo,
          ambiente: a.nombre ?? 'Ambiente',
          paginaIndex: idx
        })
      );

      const fullHTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>${reportTitle}</title>
        <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; } body { font-family:'Inter',sans-serif; }
        @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
        </style></head><body>${paginas.join('')}</body></html>`;
      const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, true);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`, 'Content-Length': pdfBuffer.length.toString() }
      });


      // ── CICLO / TODOS LOS CICLOS ──────────────────────────────────────────────
    } else if (tipo === 'ciclo' || tipo === 'ciclos_todos') {
      if (tipo === 'ciclo' && (!id || isNaN(parseInt(id)))) return NextResponse.json({ error: 'Falta id de ciclo' }, { status: 400 });

      const ciclosRaw = tipo === 'ciclo'
        ? [await prisma.ciclo.findUnique({ where: { id_ciclo: parseInt(id!) } })]
        : await prisma.ciclo.findMany({ orderBy: { numero: 'asc' } });

      reportTitle = tipo === 'ciclo' ? 'Horario por Ciclo' : 'Consolidado por Ciclos';
      const paginas: string[] = [];

      for (const ciclo of ciclosRaw) {
        if (!ciclo) continue;
        const horarios = await prisma.horarioAsignado.findMany({
          where: { id_periodo: parseInt(id_periodo), curso: { id_ciclo: ciclo.id_ciclo } },
          include: { docente: true, curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true },
        });
        if (!horarios.length) continue;
        paginas.push(
          generarReporteUNT({
            horarios: horarios,
            titulo: `Ciclo ${ciclo.numero} — ${ciclo.nombre ?? ''}`,
            subtitulo: `${horarios.length} clases`,
            periodo: periodo,
            cicloNumero: ciclo.numero,
            paginaIndex: paginas.length
          })
        );
      }

      if (paginas.length === 0) {
        const fullHTML = wrapLayout(`<div style="text-align:center; padding:40px; color:#64748b;">No hay horarios asignados en este período.</div>`, reportTitle, true);
        const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, true);
        return new Response(new Uint8Array(pdfBuffer), {
          headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`, 'Content-Length': pdfBuffer.length.toString() }
        });
      }

      const fullHTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>${reportTitle}</title>
        <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; } body { font-family:'Inter',sans-serif; }
        @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
        </style></head><body>${paginas.join('')}</body></html>`;
      const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, true);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`, 'Content-Length': pdfBuffer.length.toString() }
      });


      // ── REPORTE GENERAL (formato UNT, landscape) ──────────────────────────────
    } else if (tipo === 'reporte_general') {
      const ciclos = await prisma.ciclo.findMany({ orderBy: { numero: 'asc' } });
      const paginas: string[] = [];

      for (const ciclo of ciclos) {
        const horarios = await prisma.horarioAsignado.findMany({
          where: { id_periodo: parseInt(id_periodo), curso: { id_ciclo: ciclo.id_ciclo } },
          include: { docente: true, curso: true, ambiente: true, grupo: true },
          orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }]
        });
        if (!horarios.length) continue;
        paginas.push(
          generarReporteUNT({
            horarios: horarios,
            titulo: 'Horario Semestral Consolidado',
            subtitulo: `Ciclo ${ciclo.numero}`,
            periodo: periodo,
            cicloNumero: ciclo.numero,
            paginaIndex: paginas.length
          })
        );
      }

      reportTitle = 'Horario Semestral Consolidado';
      const fullHTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>${reportTitle}</title>
        <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; } body { font-family:'Inter',sans-serif; }
        @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
        </style></head><body>${paginas.join('')}</body></html>`;
      const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, true);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-general.pdf"`, 'Content-Length': pdfBuffer.length.toString() }
      });

      // ── LISTA: DOCENTES ───────────────────────────────────────────────────────
    } else if (tipo === 'reporte_docentes_lista') {
      const docentes = await prisma.docente.findMany({ orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }] });
      reportTitle = 'Catálogo de Docentes';
      htmlContent = generarCabecera('Catálogo de Docentes', `${docentes.length} catedráticos`, periodoNombre, [{ label: 'Docentes', valor: String(docentes.length) }]);
      htmlContent += `<div class="list-wrap"><table class="list-table">
        <thead><tr><th>Apellidos y Nombres</th><th>Código</th><th>Grado</th><th>Categoría</th><th>Modalidad</th><th>Correo</th></tr></thead>
        <tbody>${docentes.map((d: any) => `<tr>
          <td style="font-weight:700;">${d.apellidos ?? ''}, ${d.nombres ?? ''}</td>
          <td style="font-family:monospace; font-size:11px;">${d.codigo_docente ?? '—'}</td>
          <td style="font-size:11px;">${d.grado_academico ?? '—'}</td>
          <td><span class="badge" style="background:#f1f5f9; color:#475569;">${d.categoria ?? '—'}</span></td>
          <td><span class="badge badge-teoria">${d.modalidad ?? '—'}</span></td>
          <td style="font-size:10px; color:#64748b;">${d.correo_electronico ?? '—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;

      // ── LISTA: CURSOS ─────────────────────────────────────────────────────────
    } else if (tipo === 'reporte_cursos') {
      const cursos = await prisma.curso.findMany({ include: { ciclo_rel: true }, orderBy: [{ id_ciclo: 'asc' }, { nombre: 'asc' }] });
      reportTitle = 'Catálogo de Cursos';
      htmlContent = generarCabecera('Catálogo de Cursos', `${cursos.length} asignaturas`, periodoNombre, [{ label: 'Cursos', valor: String(cursos.length) }]);
      htmlContent += `<div class="list-wrap"><table class="list-table">
        <thead><tr><th>Ciclo</th><th>Código</th><th>Asignatura</th><th style="text-align:center;">T</th><th style="text-align:center;">P</th><th style="text-align:center;">L</th><th style="text-align:center;">Total</th></tr></thead>
        <tbody>${cursos.map((c: any) => `<tr>
          <td style="text-align:center;"><span class="badge" style="background:#f1f5f9;">${c.ciclo_rel?.numero ?? '—'}</span></td>
          <td style="font-family:monospace; font-weight:600;">${c.codigo ?? '—'}</td>
          <td style="font-weight:700;">${c.nombre ?? '—'}</td>
          <td style="text-align:center;">${c.horas_teoria ?? 0}</td>
          <td style="text-align:center;">${c.horas_practica ?? 0}</td>
          <td style="text-align:center;">${c.horas_laboratorio ?? 0}</td>
          <td style="text-align:center; font-weight:800; color:#003366;">${(c.horas_teoria ?? 0) + (c.horas_practica ?? 0) + (c.horas_laboratorio ?? 0)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;

      // ── LISTA: AMBIENTES ──────────────────────────────────────────────────────
    } else if (tipo === 'reporte_ambientes') {
      const ambientes = await prisma.ambiente.findMany({ orderBy: { nombre: 'asc' } });
      reportTitle = 'Catálogo de Ambientes Académicos';
      htmlContent = generarCabecera('Catálogo de Ambientes Académicos', `${ambientes.length} espacios`, periodoNombre, [{ label: 'Ambientes', valor: String(ambientes.length) }]);
      htmlContent += `<div class="list-wrap"><table class="list-table">
        <thead><tr><th>Nombre / Código</th><th>Tipo</th><th style="text-align:center;">Capacidad</th><th>Pabellón / Piso</th></tr></thead>
        <tbody>${ambientes.map((a: any) => `<tr>
          <td><div style="font-weight:700;">${a.nombre ?? '—'}</div><div style="font-size:9px; color:#64748b;">CÓD: ${a.codigo ?? '—'}</div></td>
          <td><span class="badge" style="background:#f1f5f9; color:#475569;">${(a.tipo ?? '').toUpperCase().replace('_', ' ')}</span></td>
          <td style="text-align:center; font-weight:700;">${a.capacidad ?? 0} est.</td>
          <td>${a.pabellon ?? '-'} / ${a.piso ?? '-'}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;

      // ── LISTA: PERIODOS ───────────────────────────────────────────────────────
    } else if (tipo === 'reporte_periodos') {
      const periodos = await prisma.periodoAcademico.findMany({ orderBy: { anio: 'desc' } });
      reportTitle = 'Catálogo de Periodos Académicos';
      htmlContent = generarCabecera('Catálogo de Periodos Académicos', `${periodos.length} registrados`, periodoNombre, [{ label: 'Periodos', valor: String(periodos.length) }]);
      htmlContent += `<div class="list-wrap"><table class="list-table">
        <thead><tr><th>Código</th><th>Nombre</th><th>Año / Sem.</th><th>Estado</th><th>Inicio / Fin</th></tr></thead>
        <tbody>${periodos.map((p: any) => `<tr>
          <td style="font-weight:700; color:#003366;">${p.codigo ?? '—'}</td>
          <td>${p.nombre ?? '—'}</td>
          <td style="text-align:center;">${p.anio ?? ''} - ${p.semestre === 1 ? 'I' : 'II'}</td>
          <td><span class="badge" style="background:#f1f5f9;">${(p.estado ?? '').toUpperCase()}</span></td>
          <td style="font-size:11px;">${p.fecha_inicio?.toLocaleDateString() ?? '—'} al ${p.fecha_fin?.toLocaleDateString() ?? '—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;

      // ── ESTADÍSTICAS ──────────────────────────────────────────────────────────
    } else if (tipo === 'estadisticas' || tipo === 'consolidado') {
      const estadisticas = await ServicioEstadisticas.obtenerEstadisticasGestion(parseInt(id_periodo));
      if (!estadisticas) return NextResponse.json({ error: 'No hay datos de gestión' }, { status: 404 });

      const docentesConCarga = await prisma.docente.findMany({ include: { horarios_asignados: { where: { id_periodo: parseInt(id_periodo) } } } });
      const cargaDocentes = docentesConCarga.map((d: any) => {
        const horas = (d.horarios_asignados || []).reduce((acc: number, h: any) => {
          if (!h.hora_inicio || !h.hora_fin) return acc;
          try { return acc + duracionHoras(h.hora_inicio, h.hora_fin); } catch { return acc; }
        }, 0);
        return { nombre: `${d.nombres} ${d.apellidos}`, horas };
      }).sort((a: any, b: any) => b.horas - a.horas);

      reportTitle = 'Gestión Académica';
      htmlContent = generarCabecera('Reporte de Gestión Académica', 'Consolidado del periodo', periodoNombre);
      htmlContent += `<div class="stats-grid">
        <div class="stat-card"><div class="stat-lbl">Total Asignaciones</div><div class="stat-val">${estadisticas.total_asignaciones}</div></div>
        <div class="stat-card"><div class="stat-lbl">Promedio Horas</div><div class="stat-val">${estadisticas.media_horas}h</div></div>
      </div>`;
      htmlContent += `<div class="list-wrap"><table class="list-table">
        <thead><tr><th>Docente</th><th style="text-align:right;">Total Horas</th></tr></thead>
        <tbody>${cargaDocentes.map((d: any) => `<tr>
          <td style="font-weight:600;">${d.nombre}</td>
          <td style="text-align:right; font-weight:800; color:#003366;">${d.horas} hrs</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
      if (estadisticas.observaciones?.length) {
        htmlContent += `<div class="list-wrap" style="padding:20px;">
          <h4 style="font-size:12px; text-transform:uppercase; color:#64748b; margin-bottom:12px;">Observaciones</h4>
          <ul style="padding-left:18px; color:#334155; font-size:13px;">${estadisticas.observaciones.map((o: string) => `<li style="margin-bottom:8px;">${o}</li>`).join('')}</ul>
        </div>`;
      }
    }


    const fullHTML = wrapLayout(htmlContent, reportTitle, isLandscape);
    const pdfBuffer = await GeneradorPDF.generarDesdeHTML(fullHTML, isLandscape);
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error: any) {
    console.error('ERROR_GENERACION_REPORTES:', error);
    return NextResponse.json({ error: 'Error al generar PDF', details: error.message }, { status: 500 });
  }
}
