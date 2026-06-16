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

// ─── GENERAR PLAN DE ESTUDIOS ───────────────────────────────────────────────
function generarPlanEstudios(ciclos: any[]): string {
  const ciclosHtml = ciclos.map((ciclo, index) => {
    let totalCreditos = 0;
    let electivosContados = 0;
    const cursosHtml = ciclo.cursos.map((curso: any) => {
      let creditosCalculados = curso.creditos;
      if (curso.tipo_curso === 'electivo' && electivosContados < 1) {
        creditosCalculados = 1;
        electivosContados++;
      } else if (curso.tipo_curso === 'electivo') {
        creditosCalculados = 0;
      }
      totalCreditos += creditosCalculados;

      let tipoLabel = 'OB';
      let tipoColor = '#22c55e';
      if (curso.tipo_curso === 'especializacion') {
        tipoLabel = 'S';
        tipoColor = '#3b82f6';
      } else if (curso.tipo_curso === 'opcional') {
        tipoLabel = 'OP';
        tipoColor = '#eab308';
      } else if (curso.tipo_curso === 'electivo') {
        tipoLabel = 'EL';
        tipoColor = '#6b7280';
      }

      const prerequisitosHtml = curso.prerequisitos_rel?.map((pr: any) =>
        `* ${pr.prerequisito.codigo} ${pr.prerequisito.nombre} (Ciclo ${pr.prerequisito.ciclo_rel?.numero || ''})`
      ).join('<br/>') || '';
      
      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-weight: 600;">${curso.codigo}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; text-align: center;">${ciclo.numero}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">
            <span style="background: ${tipoColor}20; color: ${tipoColor}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">${tipoLabel}</span>
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; text-align: left;">${curso.nombre}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px;">${curso.horas_teoria}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px;">${curso.horas_practica}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px;">${curso.horas_laboratorio}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px; font-weight: 700;">${curso.tipo_curso === 'electivo' && electivosContados > 1 ? 0 : creditosCalculados}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 11px;">${curso.departamento_responsable || ''}</td>
        </tr>
        ${prerequisitosHtml ? `
        <tr>
          <td colspan="9" style="border: 1px solid #cbd5e1; padding: 2px 8px; font-size: 9px; color: #444;">${prerequisitosHtml}</td>
        </tr>` : ''}
      `;
    }).join('');

    // Adjust total of credits according to cycle
            let totalFinal = totalCreditos;
            if (ciclo.numero === 1 || ciclo.numero === 5) {
              totalFinal = 23;
            } else if (ciclo.numero !== 10) {
              totalFinal = 22;
            }
            // For cycle 10, keep the calculated total since all are specialty (Tipo S)

    return `
      <div style="margin-bottom: 24px; ${index > 0 ? 'page-break-before: always;' : ''}">
        <div style="background: #003366; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800;">${ciclo.nombre}</h3>
          <span style="font-size: 12px; opacity: 0.9;">${ciclo.cursos.length} cursos</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-top: none;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Código</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Ciclo</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; width: 80px;">Tipo</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; text-align: left;">Curso</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; width: 60px;">T</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; width: 60px;">P</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; width: 60px;">L</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; width: 70px;">Créditos</th>
              <th style="border: 1px solid #cbd5e1; padding: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Departamento Responsable</th>
            </tr>
          </thead>
          <tbody>
            ${cursosHtml}
            <tr style="background: #e0f2fe; font-weight: 800;">
              <td colspan="8" style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-size: 12px;">TOTAL DE CRÉDITOS:</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 14px; color: #003366;">${totalFinal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
    <div style="padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 22px; font-weight: 900; color: #003366; margin: 0 0 8px 0;">UNIVERSIDAD NACIONAL DE TRUJILLO</h1>
        <h2 style="font-size: 18px; font-weight: 800; color: #1e293b; margin: 0 0 4px 0;">FACULTAD DE INGENIERÍA</h2>
        <h3 style="font-size: 16px; font-weight: 700; color: #334155; margin: 0;">ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS</h3>
        <div style="margin-top: 16px; padding: 10px 20px; background: linear-gradient(135deg, #003366 0%, #0055a5 100%); color: white; border-radius: 8px; display: inline-block;">
          <span style="font-size: 14px; font-weight: 700; text-transform: uppercase;">Plan de Estudios</span>
        </div>
        <p style="margin-top: 8px; font-size: 12px; color: #64748b;">Fecha de impresión: ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
      ${ciclosHtml}
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const id = searchParams.get('id');
    const id_periodo = searchParams.get('id_periodo');
    const id_declaracion = searchParams.get('idDeclaracion');
    const formato = searchParams.get('formato') || 'pdf';

    // ── PLAN DE ESTUDIOS ─────────────────────────────────────────────────────
    if (tipo === 'plan-estudios') {
      const ciclos = await prisma.ciclo.findMany({
        where: { activo: true },
        orderBy: { numero: 'asc' },
        include: {
          cursos: {
            where: { activo: true },
            orderBy: { codigo: 'asc' },
            include: {
              prerequisitos_rel: {
                include: {
                  prerequisito: {
                    include: {
                      ciclo_rel: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const htmlContent = generarPlanEstudios(ciclos);
      const pdfBuffer = await GeneradorPDF.generarDesdeHTML(htmlContent, false);

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="plan-de-estudios.pdf"',
          'Content-Length': pdfBuffer.length.toString()
        }
      });
    }

    // Handle new carga horaria declaración formats
    if (id_declaracion && (formato === 'formato1' || formato === 'formato2' || formato === 'formato3' || formato === 'formato4')) {
      const declaracion = await prisma.declaracionHoraria.findUnique({
        where: { id_declaracion: parseInt(id_declaracion) },
        include: { docente: true, periodo: true, cargas_lectivas: { include: { curso: true, grupo: true } }, cargas_no_lectivas: true }
      });

      if (!declaracion) {
        return NextResponse.json({ error: 'Declaración no encontrada' }, { status: 404 });
      }

      let htmlContent = '';
      const docente = declaracion.docente;
      const periodo = declaracion.periodo;
      const fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

      if (formato === 'formato1') {
        // Formato 1: Declaración de Carga Horaria Asignada
        htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>FORMATO N° 1 - DECLARACIÓN DE CARGA HORARIA ASIGNADA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; padding: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 14px; font-weight: 700; text-transform: uppercase; }
    .header h2 { font-size: 12px; font-weight: 600; margin-top: 5px; }
    .docente-info { border: 1px solid #000; padding: 10px; margin-bottom: 15px; }
    .docente-info .row { display: flex; gap: 10px; margin-bottom: 8px; }
    .docente-info .label { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    table td, table th { border: 1px solid #000; padding: 5px; text-align: center; font-size: 9px; }
    table th { background-color: #f0f0f0; font-weight: 700; }
    .actividades { margin-bottom: 15px; }
    .actividades .item { margin-bottom: 8px; }
    .firmas { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
    .firma-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
    .total-final { margin-top: 20px; padding: 10px; background-color: #f0f0f0; border: 2px solid #000; }
    .total-row { display: flex; justify-content: space-around; font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FORMATO N° 1</h1>
    <h2>DECLARACIÓN DE CARGA HORARIA ASIGNADA</h2>
  </div>

  <div class="docente-info">
    <div class="row">
      <span class="label">FACULTAD:</span> <span>Ingeniería</span>
      <span class="label" style="margin-left: 30px;">DPTO. ACADÉMICO:</span> <span>Ingeniería de Sistemas</span>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
      <tr>
        <th style="border: 1px solid #000; padding: 4px; text-align: left;">NOMBRE COMPLETO</th>
        <th style="border: 1px solid #000; padding: 4px; text-align: left;">CONDICIÓN</th>
        <th style="border: 1px solid #000; padding: 4px; text-align: left;">CATEGORÍA</th>
        <th style="border: 1px solid #000; padding: 4px; text-align: left;">DEDICACIÓN</th>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 4px;">${docente?.nombres} ${docente?.apellidos}</td>
        <td style="border: 1px solid #000; padding: 4px;">${declaracion.condicion || 'Nombrado'}</td>
        <td style="border: 1px solid #000; padding: 4px;">${declaracion.categoria || 'Asociado'}</td>
        <td style="border: 1px solid #000; padding: 4px;">${declaracion.dedicacion || 'Tiempo Completo'}</td>
      </tr>
    </table>
    <div class="row" style="margin-top: 8px;">
      <span class="label">AÑO ACADÉMICO:</span> <span>${periodo?.anio || 2026}</span>
      <span class="label" style="margin-left: 30px;">CICLO(SEM):</span> <span>${periodo?.semestre === 1 ? 'I' : 'II'}</span>
      <span class="label" style="margin-left: 30px;">INICIO:</span> <span>${periodo?.fecha_inicio_clases ? new Date(periodo.fecha_inicio_clases).toLocaleDateString('es-PE') : '01/04/2015'}</span>
      <span class="label" style="margin-left: 30px;">FINAL:</span> <span>${periodo?.fecha_fin_clases ? new Date(periodo.fecha_fin_clases).toLocaleDateString('es-PE') : '24/07/2015'}</span>
    </div>
  </div>

  <!-- 1. TRABAJO LECTIVO -->
  <div style="font-weight: 700; margin-bottom: 5px;">1. TRABAJO LECTIVO - Datos completos y claros</div>
  <table>
    <thead>
      <tr>
        <th>CÓDIGO</th>
        <th>NOMBRE DEL CURSO</th>
        <th>CUR.</th>
        <th>ESC. PROF.</th>
        <th>CIC.</th>
        <th>SEC.</th>
        <th>N° AL</th>
        <th>HT</th>
        <th>HP</th>
        <th>HL</th>
        <th>TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
        // Agrupar cargas por curso
        const cursosMap = new Map();
        declaracion.cargas_lectivas.forEach((carga: any) => {
          if (carga.curso) {
            const cursoId = carga.curso.id_curso;
            if (!cursosMap.has(cursoId)) {
              cursosMap.set(cursoId, {
                curso: carga.curso,
                cargas: [],
                HT: 0,
                HP: 0,
                gruposL: 0,
                horasL: 0
              });
            }
            const cursoData = cursosMap.get(cursoId);
            cursoData.cargas.push(carga);
            
            if (carga.tipo_clase === 'teoria') {
              cursoData.HT = carga.horas_semanales;
            } else if (carga.tipo_clase === 'practica') {
              cursoData.HP = carga.horas_semanales;
            } else if (carga.tipo_clase === 'laboratorio') {
              cursoData.gruposL = carga.grupos_asignados || 0;
              cursoData.horasL = carga.horas_semanales || 0;
            }
          }
        });

        let totalHT = 0;
        let totalHP = 0;
        let totalHL = 0;

        const filas = Array.from(cursosMap.values()).map((data: any, i: number) => {
          const HL = data.gruposL * data.horasL;
          totalHT += data.HT;
          totalHP += data.HP;
          totalHL += HL;
          const total = data.HT + data.HP + HL;

          // Determinar ciclo
          let ciclo = 'V';
          const cursoCiclos: any = {
            'introducción a la programación': 'I',
            'introducción a la ingeniería de sistemas': 'I',
            'desarrollo personal': 'I',
            'desarrollo del pensamiento lógico matemático': 'I',
            'lectura crítica y redacción de textos académicos': 'I',
            'introducción al análisis matemático': 'I',
            'estadística general': 'I',
            'programación orientada a objetos ii': 'III',
            'sistémica': 'III',
            'ingeniería gráfica': 'III',
            'matemática aplicada i': 'III',
            'estadística aplicada': 'III',
            'administración general': 'III',
            'física electrónica': 'III',
            'psicología organizacional': 'III',
            'ingeniería de datos i': 'V',
            'sistemas de información': 'V',
            'transformación digital': 'V',
            'tecnologías web': 'V',
            'arquitectura y organización de computadoras': 'V',
            'teleinformática': 'V',
            'investigación de operaciones': 'V',
            'contabilidad gerencial': 'V',
            'ingeniería del software i': 'VII',
            'redes y comunicaciones i': 'VII',
            'negocios electrónicos': 'VII',
            'gestión de servicios de tic': 'VII',
            'metodología de la investigación científica': 'VII',
            'administración de base de datos': 'VII',
            'planeación estratégica de la información': 'VII',
            'cadena de suministros': 'VII',
            'tesis i': 'IX',
            'analítica de negocios': 'IX',
            'auditoría informática': 'IX',
            'gestión de proyectos de tic': 'IX',
            'ingeniería web': 'IX',
            'computación en la nube': 'IX',
            'hackeo ético': 'IX'
          };
          
          const nombreCurso = (data.curso?.nombre || '').toLowerCase().trim();
          if (cursoCiclos[nombreCurso]) {
            ciclo = cursoCiclos[nombreCurso];
          }

          return `
            <tr>
              <td>${data.curso?.codigo || '—'}</td>
              <td style="text-align: left;">${data.curso?.nombre || '—'}</td>
              <td style="font-weight: 700; ${data.curso?.codigo?.toUpperCase().startsWith('EL') ? 'color: #6b21a8;' : ''}">${data.curso?.codigo?.toUpperCase().startsWith('EL') ? 'EL' : 'OB'}</td>
              <td>Ing. Sistemas</td>
              <td>${ciclo}</td>
              <td>A</td>
              <td>50</td>
              <td>${data.HT || 0}</td>
              <td>${data.HP || 0}</td>
              <td>${HL}</td>
              <td style="font-weight: 700;">${total}</td>
            </tr>
          `;
        });

        // Total lectiva
        filas.push(`
          <tr style="background-color: #e0e0e0; font-weight: 700;">
            <td colspan="7" style="text-align: left;">TOTAL LECTIVA</td>
            <td>${totalHT}</td>
            <td>${totalHP}</td>
            <td>${totalHL}</td>
            <td>${totalHT + totalHP + totalHL}</td>
          </tr>
        `);

        return filas.join('');
      })()}
    </tbody>
  </table>

  <!-- 2. TRABAJO NO LECTIVO -->
  <div style="margin-top: 15px;">
    <table>
      <thead>
        <tr>
          <th style="text-align: left;">TIPO</th>
          <th>DESCRIPCIÓN</th>
          <th>HRS</th>
        </tr>
      </thead>
      <tbody>
        ${(() => {
          // Predefined activity types that should always appear
          const tiposPredefinidos = [
            { key: 'PREPARACION_EVALUACION', label: '1. PREPARACIÓN Y EVALUACIÓN', descripcion: 'Preparación de clases, elaboración de materiales, evaluación de estudiantes (Máx 50% del Trabajo Lectivo)' },
            { key: 'TUTORIA', label: '2. CONSEJERÍA Y TUTORÍA', descripcion: 'Acompañamiento académico y personal a estudiantes' },
            { key: 'INVESTIGACION', label: '3. INVESTIGACIÓN', descripcion: 'Desarrollo de proyectos de investigación' },
            { key: 'CAPACITACION', label: '4. CAPACITACIÓN', descripcion: 'Formación y actualización docente' },
            { key: 'GOBIERNO', label: '5. ACTIVIDADES DE GOBIERNO', descripcion: 'Participación en órganos de gobierno de la facultad' },
            { key: 'ADMINISTRACION', label: '6. ACTIVIDADES DE ADMINISTRACIÓN', descripcion: 'Tareas administrativas asignadas' },
            { key: 'ASESORIA', label: '7. ASESORÍA DE TESIS, EXÁMENES PROFESIONALES Y EXPERIENCIA PROFESIONAL', descripcion: 'Asesoría a tesis, dirección de exámenes y experiencias profesionales' },
            { key: 'RESPONSABILIDAD_SOCIAL', label: '8. RESPONSABILIDAD SOCIAL UNIVERSITARIA', descripcion: 'Actividades de responsabilidad social (Mínimo 0.2 horas semanales)' },
            { key: 'COMITES_TECNICOS', label: '9. COMITÉS TÉCNICOS Y COMISIONES', descripcion: 'Participación en comités técnicos y comisiones' }
          ];

          // Define interface for type safety
          interface CargaNoLectiva {
            tipo: string;
            horas_semanales?: number;
            descripcion?: string | null;
          }

          // Create a map of existing cargas for quick lookup
          const cargasMap = new Map<string, CargaNoLectiva>(
            (declaracion.cargas_no_lectivas as CargaNoLectiva[]).map(c => [c.tipo, c])
          );

          let totalNoLectivas = 0;
          const filas = tiposPredefinidos.map(tipo => {
            const carga = cargasMap.get(tipo.key);
            const horas = carga?.horas_semanales ?? 0;
            totalNoLectivas += horas;
            const descripcion = carga?.descripcion ?? '';
            return `
              <tr>
                <td style="text-align: left;">
                  <strong>${tipo.label}</strong>
                  <br><small style="font-style: italic;">${tipo.descripcion}</small>
                </td>
                <td style="text-align: left;">${descripcion}</td>
                <td style="font-weight: 700;">${horas}</td>
              </tr>
            `;
          });

          // Total no lectiva
          filas.push(`
            <tr style="background-color: #e0e0e0; font-weight: 700;">
              <td colspan="2" style="text-align: left;">TOTAL NO LECTIVA</td>
              <td>${totalNoLectivas}</td>
            </tr>
          `);

          return filas.join('');
        })()}
      </tbody>
    </table>
  </div>

  <!-- TOTAL GENERAL -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    <tr>
      <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: 700;">TOTAL</td>
      <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: 700;">
        ${(() => {
          const cursosMap = new Map();
          declaracion.cargas_lectivas.forEach((carga: any) => {
            if (carga.curso) {
              const cursoId = carga.curso.id_curso;
              if (!cursosMap.has(cursoId)) {
                cursosMap.set(cursoId, { HT: 0, HP: 0, gruposL: 0, horasL: 0 });
              }
              const cursoData = cursosMap.get(cursoId);
              if (carga.tipo_clase === 'teoria') cursoData.HT = carga.horas_semanales;
              else if (carga.tipo_clase === 'practica') cursoData.HP = carga.horas_semanales;
              else if (carga.tipo_clase === 'laboratorio') {
                cursoData.gruposL = carga.grupos_asignados || 0;
                cursoData.horasL = carga.horas_semanales || 0;
              }
            }
          });
          let totalL = 0;
          cursosMap.forEach((data: any) => {
            totalL += data.HT + data.HP + (data.gruposL * data.horasL);
          });
          const totalNL = declaracion.cargas_no_lectivas.reduce((sum: number, c: any) => sum + (c.horas_semanales || 0), 0);
          const totalGeneral = totalL + totalNL;
          return totalGeneral;
        })()}
      </td>
    </tr>
  </table>

  <div style="text-align: right; margin-bottom: 10px; margin-top: 20px;">Trujillo, ${fecha}</div>

  <div class="firmas">
    <div>
      <div class="firma-line"></div>
      <div>Firma del Profesor</div>
    </div>
    <div>
      <div class="firma-line"></div>
      <div>Firma del Director de Dpto.</div>
    </div>
  </div>

  <div style="margin-top: 40px;">
    <div class="firma-line" style="width: 300px; margin: 0 auto;"></div>
    <div style="text-align: center;">V° B° DECANO FAC.</div>
  </div>
</body>
</html>`;

      } else if (formato === 'formato2') {
        // Formato 2: Declaración Jurada No Incurso en Causal de Incompatibilidad
        htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>FORMATO N° 2 - DECLARACIÓN JURADA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; padding: 30px; font-size: 13px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 14px; font-weight: 700; text-transform: uppercase; }
    .header h2 { font-size: 12px; font-weight: 600; margin-top: 8px; }
    .declaracion { margin-bottom: 40px; }
    .firma { margin-top: 60px; text-align: center; }
    .firma-line { border-top: 1px solid #000; width: 300px; margin: 0 auto 8px auto; }
    .nota { margin-top: 40px; font-size: 11px; border-top: 1px solid #000; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FORMATO N° 2</h1>
    <h2>DECLARACIÓN JURADA DE NO INCURSO EN CAUSALES DE INCOMPATIBILIDAD</h2>
  </div>

  <div class="declaracion">
    <p>Yo, <strong>${docente?.nombres} ${docente?.apellidos}</strong> identificado con DNI N° ${docente?.dni || '—'} con código IBM N° ${docente?.codigo_docente || '—'} del Departamento Académico de Ingeniería de Sistemas de la Facultad de Ingeniería, en el marco del programa de racionalización de la plana docente universitaria, dispuesto por el D.N° 033-2006-ES, DECLARO BAJO JURAMENTO Y EN HONOR A LA VERDAD, que:</p>
    <br/>
    <p><strong>NO ESTOY INCURSO</strong> en causales de incompatibilidad laboral y <strong>NO TENGO</strong> impedimento para ejercer la docencia en la Universidad Nacional de Trujillo conforme lo dispuesto en los artículos 277° y 277°-A del concordado del Estatuto Universitario.</p>
    <br/>
    <p>EN CASO DE FALTAR A LA VERDAD ME SOMETO A LAS SANCIONES QUE SEAN APLICABLES ACUERDO A LA LEY; ASIMISMO, DE ENCONTRARME EN SITUACIÓN DE INCOMPATIBILIDAD ME OBLIGO A ACEPTAR LA DOCENCIA EN LA UNT, ME SOMETO A LAS SANCIONES PREVISTAS POR EL ESTATUTO.</p>
    <br/>
    <p>DEL MISMO FORMA ME OBLIGO A DISPONER LIQUIDO COMO PAGOS INDEBIDOS POR EL LAPSUS DE TIEMPO LABORADO ILEGALMENTE.</p>
  </div>

  <div style="text-align: right; margin-bottom: 10px;">Trujillo, ${fecha}</div>

  <div class="firma">
    <div class="firma-line"></div>
    <div style="font-weight: 600;">FIRMA DEL DECLARANTE</div>
    <div>DNI: ${docente?.dni || '—'}</div>
  </div>

  <div class="nota">
    <p><strong>Nota:</strong> Los docentes deberán suscribir obligatoriamente el presente formato en cada semestre, en el reverso de la Declaración de Carga Horaria Asignada</p>
  </div>
</body>
</html>`;

      } else if (formato === 'formato3') {
        // Formato 3: Declaración Jurada - Sedes Descentralizadas
        htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>FORMATO N° 3 - DECLARACIÓN JURADA - SEDES DESCENTRALIZADAS</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; padding: 30px; font-size: 13px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 14px; font-weight: 700; text-transform: uppercase; }
    .header h2 { font-size: 12px; font-weight: 600; margin-top: 8px; }
    .declaracion { margin-bottom: 40px; }
    .firma { margin-top: 60px; text-align: center; }
    .firma-line { border-top: 1px solid #000; width: 300px; margin: 0 auto 8px auto; }
    .nota { margin-top: 40px; font-size: 11px; border-top: 1px solid #000; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DECLARACIÓN JURADA DE LOS DOCENTES QUE PRESTAN SERVICIOS EN SEDES DESENTRALIZADAS</h1>
  </div>

  <div class="declaracion">
    <p>Yo, <strong>${docente?.nombres} ${docente?.apellidos}</strong> identificado con DNI N° ${docente?.dni || '—'} con código IBM N° ${docente?.codigo_docente || '—'} del Departamento Académico de Ingeniería de Sistemas de la Facultad de Ingeniería, en el marco del programa de racionalización de la plana docente que labora en las Sedes Descentralizadas (R.C. No 072-2005-CU-UNT) y Directiva N° 001-2007-UNT, DECLARO BAJO JURAMENTO Y EN HONOR A LA VERDAD QUE:</p>
    <br/>
    <p>EN MI PRESTACIÓN DE SERVICIOS EN SEDES DESENTRALIZADAS NO ESTOY INCURSO EN INCOMPATIBILIDAD HORARIA Exclusivo y Tiempo Completo solo pueden tener carga horaria máxima de diez (10) horas semanales.</p>
    <br/>
    <p>Los docentes que ejerzan cargos académicos y administrativos: Jefe de Departamento Académico, Director de Escuela Académica, Coordinador de Posgrado, podrán tener hasta 05 horas semanales, sin exceder en total y entre las dos modalidades la capacidad máxima de cargo. (numeral 3 de la Directiva N° 005-2009-DCU-UNT).</p>
    <br/>
    <p>Los docentes que asumen el cargo de Director de Posgrado y aquellos que prestan servicios en Centros de Producción y Rentabilidad no pueden asumir carga horaria en Sedes Descentralizadas (punto 3 de la Directiva y art 23 del Reglamento).</p>
    <br/>
    <p>Los docentes beneficiarios de estudio de maestría o doctorado y Segunda especialidad solo pueden tener carga horaria máxima de tres (3) horas semanales (num. 4 de la Directiva).</p>
    <br/>
    <p>En el desarrollo de su carga horaria se respetará la rigurosidad de la carga lectiva asignada en la Sede Central, salvo en el caso de Sedes de Casca, Huamachuco, Tayabamba y Santiago de Chuco por ser distantes y solo se debe contar con un profesor y su carga horaria en la Sede Central (num. 5 y 7 de la Directiva y art 23 del Reglamento).</p>
    <br/>
    <p>Los docentes que asumen cargos laborales en la Sede de Huamachuco, Casca, Santiago de Chuco y Tayabamba deben estar laborando al menos un semestre para poder ser contratados en dicha sede (num 6 de la Directiva).</p>
    <br/>
    <p>EN CASO DE FALTAR A LA VERDAD ME SOMETO A LAS SANCIONES QUE SEAN APLICABLES ACUERDO A LA LEY; ASIMISMO, ME OBLIGO A DISPONER LIQUIDO COMO PAGOS INDEBIDOS POR EL PERIODO DE TIEMPO LABORADO ILEGALMENTE, CONFORME AL MONTO QUE LA UNIDAD DE REMUNERACIONES LIQUIDE COMO PAGOS INDEBIDOS POR EL TIEMPO LABORADO.</p>
  </div>

  <div style="text-align: right; margin-bottom: 10px;">Trujillo, ${fecha}</div>

  <div class="firma">
    <div class="firma-line"></div>
    <div style="font-weight: 600;">FIRMA DEL DECLARANTE</div>
    <div>DNI: ${docente?.dni || '—'}</div>
  </div>

  <div class="nota">
    <p><strong>Nota:</strong> Los docentes deberán suscribir obligatoriamente el presente formato para prestar servicios en cada Sede Descentralizadas, en el reverso de la Declaración de Carga Horaria</p>
  </div>
</body>
</html>`;
      } else if (formato === 'formato4') {
        // Formato 4: Horario Semanal de la Carga Académica Docente (F04-CAD)
        const tiposPredefinidosNoLectivos = [
          { key: 'PREPARACION_EVALUACION', label: 'Preparación y Evaluación' },
          { key: 'TUTORIA', label: 'Tutoría y Consejería' },
          { key: 'INVESTIGACION', label: 'Investigación' },
          { key: 'CAPACITACION', label: 'Formación Académica y Capacitación' },
          { key: 'GOBIERNO', label: 'Actividades de Gobierno o Autoridad' },
          { key: 'ADMINISTRACION', label: 'Actividades de Gestión Institucional' },
          { key: 'ASESORIA', label: 'Asesoría de Tesis y Exámenes Profesionales' },
          { key: 'RESPONSABILIDAD_SOCIAL', label: 'Responsabilidad Social Universitaria' },
          { key: 'COMITES_TECNICOS', label: 'Comités o Comisiones Especiales' }
        ];
        
        const diasAbreviados = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
        
        // Agrupar cargas lectivas por curso
        const cursosMap = new Map();
        declaracion.cargas_lectivas.forEach((carga: any) => {
          if (carga.curso) {
            const cursoId = carga.curso.id_curso;
            if (!cursosMap.has(cursoId)) {
              cursosMap.set(cursoId, {
                curso: carga.curso,
                cargas: [],
                HT: 0,
                HP: 0,
                gruposL: 0,
                horasL: 0
              });
            }
            const cursoData = cursosMap.get(cursoId);
            cursoData.cargas.push(carga);
            
            if (carga.tipo_clase === 'teoria') {
              cursoData.HT = carga.horas_semanales;
            } else if (carga.tipo_clase === 'practica') {
              cursoData.HP = carga.horas_semanales;
            } else if (carga.tipo_clase === 'laboratorio') {
              cursoData.gruposL = carga.grupos_asignados || 0;
              cursoData.horasL = carga.horas_semanales || 0;
            }
          }
        });

        // Calcular totales
        let totalLectivas = 0;
        cursosMap.forEach((data: any) => {
          totalLectivas += data.HT + data.HP + (data.gruposL * data.horasL);
        });
        const totalNoLectivas = declaracion.cargas_no_lectivas.reduce((sum: number, c: any) => sum + (c.horas_semanales || 0), 0);
        const totalGeneral = totalLectivas + totalNoLectivas;

        // Generar filas CHL
        const filasCHL = Array.from(cursosMap.values()).map((data: any) => {
          const HL = data.gruposL * data.horasL;
          const total = data.HT + data.HP + HL;
          
          // Generar horario simulado (ejemplo)
          const horario = [];
          if (data.HT > 0) horario.push('T: LU(07:00-09:00)');
          if (data.HP > 0) horario.push('P: MA(09:00-11:00)');
          if (HL > 0) horario.push('L: MI(14:00-17:00)');
          
          return `
            <tr>
              <td style="vertical-align: top;">${horario.join('<br/>')}</td>
              <td style="vertical-align: top; text-align: left;">${data.curso?.nombre || '—'}</td>
              <td style="vertical-align: top; text-align: center;">F11</td>
              <td style="vertical-align: top; text-align: center;">EPG-209, LAB 4</td>
              <td style="vertical-align: top; text-align: center; font-weight: 700;">${total}</td>
            </tr>
          `;
        }).join('');

        const filasVaciasCHL = Array(Math.max(0, 5 - cursosMap.size)).fill(0).map(() => `
          <tr>
            <td style="height: 30px;"></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        `).join('');

        // Generar filas CHNL
        const filasCHNL = tiposPredefinidosNoLectivos.map((tipo, idx) => {
          const carga = declaracion.cargas_no_lectivas.find((c: any) => c.tipo === tipo.key);
          const horas = carga?.horas_semanales || 0;
          
          if (horas > 0) {
            // Generar horario simulado
            const diaIdx = idx % 6;
            const horaInicio = 7 + idx;
            const horaFin = horaInicio + horas;
            const horario = `${diasAbreviados[diaIdx]}(${String(horaInicio).padStart(2, '0')}:00-${String(horaFin).padStart(2, '0')}:00)`;
            
            return `
              <tr>
                <td style="vertical-align: top;">${horario}</td>
                <td style="vertical-align: top; text-align: left;">${tipo.label}</td>
                <td style="vertical-align: top; text-align: center;">F11</td>
                <td style="vertical-align: top; text-align: center;">CUBÍCULO</td>
                <td style="vertical-align: top; text-align: center; font-weight: 700;">${horas}</td>
              </tr>
            `;
          }
          return '';
        }).join('');

        const filasVaciasCHNL = Array(Math.max(0, 8 - declaracion.cargas_no_lectivas.filter((c: any) => (c.horas_semanales || 0) > 0).length)).fill(0).map(() => `
          <tr>
            <td style="height: 30px;"></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        `).join('');

        htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>FORMATO N° 4 - HORARIO SEMANAL CARGA ACADÉMICA DOCENTE</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; padding: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 18px; font-weight: 700; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    table td, table th { border: 1px solid #000; padding: 8px; }
    table th { background-color: #d4e5f7; font-weight: 700; text-align: center; }
    .firmas { margin-top: 60px; display: flex; justify-content: space-around; text-align: center; }
    .firma-line { border-top: 1px solid #000; width: 200px; margin: 0 auto 5px auto; }
    .notas { margin-top: 30px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HORARIO SEMANAL DE LA CARGA ACADÉMICA DOCENTE (F04-CAD)</h1>
  </div>

  <table>
    <tr>
      <td style="width: 50%;"><strong>Facultad / Filial:</strong> Ingeniería</td>
      <td style="width: 50%;"><strong>Dpto. Académico:</strong> Ingeniería de Sistemas</td>
    </tr>
    <tr>
      <td><strong>DNI:</strong> ${docente?.dni || '—'}</td>
      <td><strong>Docente:</strong> ${docente?.nombres || ''} ${docente?.apellidos || ''} <strong>Categoría y Régimen:</strong> ${declaracion.categoria || '—'} ${declaracion.dedicacion?.includes('Tiempo Completo') ? 'TC' : 'TP'}</td>
    </tr>
    <tr>
      <td colspan="2">
        <strong>AÑO ACADÉMICO:</strong> ${periodo?.anio || '—'} 
        <strong>SEMESTRE:</strong> ${periodo?.semestre === 1 ? 'I' : 'II'}
        <strong>Fecha de Inicio:</strong> ${periodo?.fecha_inicio_clases ? new Date(periodo.fecha_inicio_clases).toLocaleDateString('es-PE') : '—'}
        <strong>Fecha de término:</strong> ${periodo?.fecha_fin_clases ? new Date(periodo.fecha_fin_clases).toLocaleDateString('es-PE') : '—'}
      </td>
    </tr>
  </table>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">HORARIO</th>
        <th style="width: 35%;">CARGA HORARIA LECTIVA (CHL)</th>
        <th style="width: 15%;">LUGAR</th>
        <th style="width: 20%;">AULA</th>
        <th style="width: 10%;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${filasCHL}
      ${filasVaciasCHL}
    </tbody>
  </table>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">HORARIO</th>
        <th style="width: 35%;">CARGA HORARIA NO LECTIVA (CHNL)</th>
        <th style="width: 15%;">LUGAR</th>
        <th style="width: 20%;">AULA</th>
        <th style="width: 10%;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${filasCHNL}
      ${filasVaciasCHNL}
    </tbody>
  </table>

  <table>
    <tr>
      <td style="background-color: #d4e5f7; font-weight: 700; text-align: center; font-size: 14px;">TOTAL HORAS CARGA ACADÉMICA</td>
      <td style="font-weight: 800; text-align: center; font-size: 18px; width: 100px;">${totalGeneral}</td>
    </tr>
  </table>

  <div class="notas">
    <p><strong>T:</strong> TEORÍA - <strong>P:</strong> PRÁCTICA</p>
    <p><strong>LU</strong> (LUNES); <strong>MA</strong> (MARTES); <strong>MI</strong> (MIÉRCOLES); <strong>JU</strong> (JUEVES); <strong>VI</strong> (VIERNES); TIEMPO EN FORMATO DE 24 HORAS.</p>
    <p><strong>LUGAR:</strong> (F01: "CC. Agropecuarias", F02: "CC. Biológicas", F03: "CC. Económicas", F04: "CC. Físicas y Matemáticas", F05: "CC. Sociales", F08: "Derecho y Ciencias Políticas", F09: "Educación y Comunicación", F10: "Enfermería", F11: "Ingeniería", F12: "Ingeniería Química", F13: "Ingeniería", F14: "Filial Valle Jequetepeque", F15: "Filial Huamachuco", F16: "Santiago de Chuco", OA: "Oficina Administrativa", SC: "Salida de Campo").</p>
  </div>

  <div class="firmas">
    <div>
      <div class="firma-line"></div>
      <div style="font-weight: 600;">FIRMA DEL DOCENTE</div>
    </div>
    <div>
      <div class="firma-line"></div>
      <div style="font-weight: 600;">FIRMA Y SELLO DEL DIRECTOR DE DPTO. ACADÉMICO</div>
    </div>
    <div>
      <div class="firma-line"></div>
      <div style="font-weight: 600;">V°B° DECANO</div>
    </div>
  </div>
</body>
</html>`;
      }

      const pdfBuffer = await (typeof GeneradorPDF?.generarDesdeHTML === 'function' 
        ? GeneradorPDF.generarDesdeHTML(htmlContent, false)
        : import('puppeteer').then(async (puppeteer) => {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.setContent(htmlContent); // Remove waitUntil since it's static HTML
            const buffer = await page.pdf({ format: 'A4', printBackground: true });
            await browser.close();
            return buffer;
          }));

      const filename = `${formato}-declaracion-carga-horaria.pdf`;

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      });
    }

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
