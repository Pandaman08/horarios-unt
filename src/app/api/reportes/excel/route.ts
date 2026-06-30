import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

// ─────────────────────────────────────────────────────────────────────────────
// PALETA (espejo exacto del PDF)
// ─────────────────────────────────────────────────────────────────────────────
const PASTEL = [
  'FFbfdbfe', 'FFfecaca', 'FFbbf7d0', 'FFfef08a',
  'FFfed7aa', 'FFddd6fe', 'FFbae6fd', 'FFfbcfe8', 'FFe2e8f0',
];
const TEXTO = [
  'FF1d4ed8', 'FFb91c1c', 'FF15803d', 'FF854d0e',
  'FF9a3412', 'FF6d28d9', 'FF0369a1', 'FF9d174d', 'FF475569',
];

const NAVY     = 'FF003366';
const NAVY2    = 'FF0a4a8a';
const NAVY3    = 'FF0a3a6a';
const SLATE50  = 'FFF8FAFC';
const SLATE100 = 'FFF1F5F9';
const SLATE200 = 'FFE2E8F0';
const WHITE    = 'FFFFFFFF';
const TEXTDARK = 'FF1e293b';
const TEXTMID  = 'FF475569';

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT — 14 columnas
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_COLS = 14;
const ALL_L = 1;
const ALL_R = 14;

const COL_WIDTHS: Record<number, number> = {
   1:  6,
   2:  9,
   3:  9,
   4:  9,
   5:  9,
   6:  9,
   7:  9,
   8:  9,
   9:  9,
  10:  8,
  11:  8,
  12:  8,
  13:  7,
  14: 12,
};

const G_HORA_L = 1;
const G_DAYS: [number, number][] = [
  [2,  3], [4,  5], [6,  7], [8,  9], [10, 11], [12, 13],
];
const G_HORA_R = 14;

const BT_NUM     = 1;
const BT_PROF    = [2,  4]  as [number, number];
const BT_ASIG    = [5,  8]  as [number, number];
const BT_T       = 9;
const BT_P       = 10;
const BT_L       = 11;
const BT_G       = 12;
const BT_HRS     = 13;
const BT_DEPT    = [14, 14] as [number, number];

const W_PROF_BT = 27;
const W_ASIG_BT = 36;
const W_DEPT_BT = 12;

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const fill = (argb: string): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const bThin  = (argb = 'FFCBD5E1') => ({ style: 'thin' as ExcelJS.BorderStyle, color: { argb } });
const bMed   = (argb = 'FF94A3B8') => ({ style: 'medium' as ExcelJS.BorderStyle, color: { argb } });
const bThick = (argb = NAVY)       => ({ style: 'medium' as ExcelJS.BorderStyle, color: { argb } });

const ctr: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };
const lft: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle' };
const rgt: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle' };

function wc(
  ws: ExcelJS.Worksheet, row: number, col: number,
  opts: {
    value?:    ExcelJS.CellValue;
    mergeEnd?: number;
    bg?:       string;
    color?:    string;
    bold?:     boolean;
    italic?:   boolean;
    size?:     number;
    align?:    Partial<ExcelJS.Alignment>;
    border?:   Partial<ExcelJS.Borders>;
    wrap?:     boolean;
  } = {}
) {
  if (opts.mergeEnd && opts.mergeEnd > col) ws.mergeCells(row, col, row, opts.mergeEnd);
  const cell = ws.getCell(row, col);
  if (opts.value !== undefined) cell.value = opts.value;
  if (opts.bg)    cell.fill = fill(opts.bg);
  if (opts.color || opts.bold || opts.italic || opts.size) {
    cell.font = {
      name: 'Arial', bold: opts.bold ?? false, italic: opts.italic ?? false,
      size: opts.size ?? 9, color: { argb: opts.color ?? TEXTDARK },
    };
  }
  if (opts.align) cell.alignment = opts.wrap ? { ...opts.align, wrapText: true } : opts.align;
  if (opts.border) cell.border = opts.border;
  return cell;
}

function outerBorder(
  ws: ExcelJS.Worksheet,
  r1: number, r2: number, c1: number, c2: number,
  b: ReturnType<typeof bMed> = bThick(),
) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = ws.getCell(r, c);
      const prev = cell.border ?? {};
      cell.border = {
        top:    r === r1 ? b : prev.top,
        bottom: r === r2 ? b : prev.bottom,
        left:   c === c1 ? b : prev.left,
        right:  c === c2 ? b : prev.right,
      };
    }
  }
}

function calcRowHeight(
  texts: { text: string; colWidthChars: number }[],
  fontSize = 8, minHeight = 16, padding = 5,
): number {
  const lineHeight = fontSize * 1.35;
  let maxLines = 1;
  for (const { text, colWidthChars } of texts) {
    if (!text) continue;
    const charsPerLine = Math.max(1, Math.floor(colWidthChars * 0.85));
    const segments = text.split('\n');
    let lines = 0;
    for (const seg of segments) lines += Math.max(1, Math.ceil(seg.length / charsPerLine));
    maxLines = Math.max(maxLines, lines);
  }
  return Math.max(minHeight, maxLines * lineHeight + padding);
}

// ─────────────────────────────────────────────────────────────────────────────
// HORARIO DOCENTE — matriz semanal (lectiva + no lectiva), una sola hoja
// ─────────────────────────────────────────────────────────────────────────────
const DIA_MAP: Record<string, number> = { LU: 0, MA: 1, MI: 2, JU: 3, VI: 4, SA: 5, DO: 6 };

const MATRIZ_COLORES = [
  { bg: 'FFdbeafe', text: 'FF1d4ed8' },
  { bg: 'FFf3e8ff', text: 'FF7c3aed' },
  { bg: 'FFfef3c7', text: 'FFd97706' },
  { bg: 'FFd1fae5', text: 'FF059669' },
  { bg: 'FFfce7f3', text: 'FFdb2777' },
  { bg: 'FFcffafe', text: 'FF0891b2' },
  { bg: 'FFffedd5', text: 'FFea580c' },
];
const NO_LECTIVA_COLOR = { bg: 'FFffe4e6', text: 'FFe11d48' };

const RANGOS_HORARIOS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
];
const RANGOS_LABELS = [
  '7-8', '8-9', '9-10', '10-11', '11-12', '12-1',
  '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8',
];
const DIAS_MATRIZ = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

interface HorarioMatrizItem {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  curso_nombre: string;
  curso_codigo: string;
  ambiente_codigo: string;
  ciclo_nombre: string;
  tipo_clase: string;
  is_no_lectiva: boolean;
  leyendaKey: string;
  leyendaNumero: number;
}

interface CursoLeyendaItem {
  key: string;
  numero: number;
  codigo: string;
  nombre: string;
  ciclo: string;
  grupo: string;
  teoria: number;
  practica: number;
  laboratorio: number;
  color: { bg: string; text: string };
}

interface NoLectivaLeyendaItem {
  numero: number;
  tipo: string;
  descripcion: string;
  horasSemanales: number;
}

async function cargarHorariosDocenteCompleto(
  id_docente: number,
  id_periodo: number,
): Promise<{
  docente: any;
  horarios: HorarioMatrizItem[];
  cursosLeyenda: CursoLeyendaItem[];
  noLectivasLeyenda: NoLectivaLeyendaItem[];
}> {
  const docente = await prisma.docente.findUnique({ where: { id_docente } });
  if (!docente) throw new Error('Docente no encontrado');

  const lectivos = await prisma.horarioAsignado.findMany({
    where: { id_docente, id_periodo },
    include: {
      curso: { include: { ciclo_rel: true } },
      grupo: true,
      ambiente: true,
    },
    orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
  });

  const cursosMap = new Map<string, CursoLeyendaItem>();
  for (const h of lectivos) {
    const key = `${h.id_curso}-${h.id_grupo}`;
    if (!cursosMap.has(key)) {
      const idx = cursosMap.size;
      const colores = MATRIZ_COLORES[idx % MATRIZ_COLORES.length];
      cursosMap.set(key, {
        key,
        numero: idx + 1,
        codigo: h.curso.codigo,
        nombre: h.curso.nombre,
        ciclo: h.curso.ciclo_rel
          ? (h.curso.ciclo_rel.nombre || `${h.curso.ciclo_rel.numero}°`)
          : '—',
        grupo: h.grupo.codigo_grupo,
        teoria: h.curso.horas_teoria ?? 0,
        practica: h.curso.horas_practica ?? 0,
        laboratorio: h.curso.horas_laboratorio ?? 0,
        color: colores,
      });
    }
  }
  const cursosLeyenda = Array.from(cursosMap.values());

  const horarios: HorarioMatrizItem[] = lectivos.map((h: (typeof lectivos)[number]) => {
    const key = `${h.id_curso}-${h.id_grupo}`;
    const leyenda = cursosMap.get(key)!;
    return {
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      curso_nombre: h.curso.nombre,
      curso_codigo: h.curso.codigo,
      ambiente_codigo: h.ambiente.codigo,
      ciclo_nombre: h.curso.ciclo_rel?.nombre ?? '',
      tipo_clase: h.tipo_clase,
      is_no_lectiva: false,
      leyendaKey: key,
      leyendaNumero: leyenda.numero,
    };
  });

  const declaracion = await prisma.declaracionHoraria.findUnique({
    where: { id_docente_id_periodo: { id_docente, id_periodo } },
    include: { cargas_no_lectivas: { include: { horarios: true } } },
  });

  const cargasNL = declaracion?.cargas_no_lectivas ?? [];

  const noLectivasLeyenda: NoLectivaLeyendaItem[] = cargasNL.map(
    (carga: (typeof cargasNL)[number], idx: number) => ({
      numero: idx + 1,
      tipo: String(carga.tipo).replace(/_/g, ' '),
      descripcion: carga.descripcion || String(carga.tipo).replace(/_/g, ' '),
      horasSemanales: carga.horas_semanales ?? 0,
    }),
  );

  for (const [idx, carga] of cargasNL.entries()) {
    for (const h of carga.horarios ?? []) {
      horarios.push({
        dia_semana: DIA_MAP[h.dia?.toString().toUpperCase()] ?? 0,
        hora_inicio: h.horaInicio,
        hora_fin: h.horaFin,
        curso_nombre: carga.descripcion || String(carga.tipo).replace(/_/g, ' '),
        curso_codigo: 'NL',
        ambiente_codigo: '',
        ciclo_nombre: String(carga.tipo).replace(/_/g, ' '),
        tipo_clase: 'No lectiva',
        is_no_lectiva: true,
        leyendaKey: `nl-${carga.id_carga_no_lectiva}`,
        leyendaNumero: idx + 1,
      });
    }
  }

  return { docente, horarios, cursosLeyenda, noLectivasLeyenda };
}

function horaEnRango(horaSlot: string, inicio: string, fin: string): boolean {
  const toMin = (h: string) => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + (mm || 0);
  };
  const slot = toMin(horaSlot);
  return slot >= toMin(inicio) && slot < toMin(fin);
}

function generarTablasLeyendaDocente(
  ws: ExcelJS.Worksheet,
  startRow: number,
  totalCols: number,
  cursosLeyenda: CursoLeyendaItem[],
  noLectivasLeyenda: NoLectivaLeyendaItem[],
): number {
  let R = startRow;
  const hdrBorder: Partial<ExcelJS.Borders> = { bottom: bThin(WHITE), right: bThin(WHITE) };
  const hdrOpts = { bg: NAVY3, color: WHITE, bold: true, size: 7.5 };
  const cellBorder: Partial<ExcelJS.Borders> = { bottom: bThin(), right: bThin() };

  // ── Tabla carga lectiva ──────────────────────────────────────────────────
  const tblLectStart = R;
  wc(ws, R, 1, {
    value: 'DETALLE DE CARGA LECTIVA',
    mergeEnd: totalCols, bg: NAVY, color: WHITE, bold: true, size: 9, align: ctr,
    border: { bottom: bMed(WHITE) },
  });
  ws.getRow(R).height = 17; R++;

  wc(ws, R, 1,  { ...hdrOpts, value: 'Nº',        align: ctr, border: hdrBorder });
  wc(ws, R, 2,  { ...hdrOpts, value: 'CÓDIGO',    align: ctr, border: hdrBorder });
  wc(ws, R, 3,  { ...hdrOpts, value: 'ASIGNATURA', mergeEnd: 4, align: lft, border: hdrBorder });
  wc(ws, R, 5,  { ...hdrOpts, value: 'CICLO',     align: ctr, border: hdrBorder });
  wc(ws, R, 6,  { ...hdrOpts, value: 'GRUPO',     align: ctr, border: hdrBorder });
  wc(ws, R, 7,  { ...hdrOpts, value: 'T / P / L', align: ctr, border: hdrBorder });
  ws.getRow(R).height = 14; R++;

  const filasLectivas = Math.max(cursosLeyenda.length, 1);
  for (let i = 0; i < filasLectivas; i++) {
    const curso = cursosLeyenda[i];
    if (curso) {
      const rowH = calcRowHeight([{ text: curso.nombre, colWidthChars: 28 }], 7.5, 14, 3);
      ws.getRow(R).height = rowH;
      wc(ws, R, 1, {
        value: curso.numero, bg: curso.color.bg, color: curso.color.text,
        bold: true, size: 8, align: ctr, border: cellBorder,
      });
      wc(ws, R, 2, {
        value: curso.codigo, bg: curso.color.bg, color: curso.color.text,
        bold: true, size: 7.5, align: ctr, border: cellBorder,
      });
      wc(ws, R, 3, {
        value: curso.nombre, bg: curso.color.bg, color: curso.color.text,
        size: 7.5, align: lft, border: cellBorder, wrap: true, mergeEnd: 4,
      });
      wc(ws, R, 5, {
        value: curso.ciclo, bg: curso.color.bg, color: curso.color.text,
        size: 7.5, align: ctr, border: cellBorder, wrap: true,
      });
      wc(ws, R, 6, {
        value: curso.grupo, bg: curso.color.bg, color: curso.color.text,
        bold: true, size: 8, align: ctr, border: cellBorder,
      });
      wc(ws, R, 7, {
        value: `${curso.teoria} / ${curso.practica} / ${curso.laboratorio}`,
        bg: curso.color.bg, color: curso.color.text,
        bold: true, size: 7.5, align: ctr, border: cellBorder,
      });
    } else {
      ws.getRow(R).height = 13;
      wc(ws, R, 1, { value: '—', bg: SLATE50, color: TEXTMID, size: 7.5, align: ctr, border: cellBorder });
      wc(ws, R, 2, { value: '—', bg: SLATE50, color: TEXTMID, size: 7.5, align: ctr, border: cellBorder });
      wc(ws, R, 3, {
        value: 'Sin carga lectiva registrada', mergeEnd: totalCols,
        bg: SLATE50, color: TEXTMID, italic: true, size: 7.5, align: ctr, border: cellBorder,
      });
    }
    R++;
  }
  outerBorder(ws, tblLectStart, R - 1, 1, totalCols, bThick());

  for (let c = 1; c <= totalCols; c++) ws.getCell(R, c).fill = fill(SLATE50);
  ws.getRow(R).height = 5; R++;

  // ── Tabla carga no lectiva ───────────────────────────────────────────────
  const tblNLStart = R;
  wc(ws, R, 1, {
    value: 'DETALLE DE CARGA NO LECTIVA',
    mergeEnd: totalCols, bg: NAVY, color: WHITE, bold: true, size: 9, align: ctr,
    border: { bottom: bMed(WHITE) },
  });
  ws.getRow(R).height = 17; R++;

  wc(ws, R, 1, { ...hdrOpts, value: 'Nº',           align: ctr, border: hdrBorder });
  wc(ws, R, 2, { ...hdrOpts, value: 'TIPO',         align: ctr, border: hdrBorder });
  wc(ws, R, 3, { ...hdrOpts, value: 'DESCRIPCIÓN',  mergeEnd: 5, align: lft, border: hdrBorder });
  wc(ws, R, 6, { ...hdrOpts, value: 'HRS/SEM',      mergeEnd: totalCols, align: ctr, border: hdrBorder });
  ws.getRow(R).height = 14; R++;

  const filasNL = Math.max(noLectivasLeyenda.length, 1);
  for (let i = 0; i < filasNL; i++) {
    const nl = noLectivasLeyenda[i];
    if (nl) {
      const rowH = calcRowHeight([{ text: nl.descripcion, colWidthChars: 42 }], 7.5, 14, 3);
      ws.getRow(R).height = rowH;
      wc(ws, R, 1, {
        value: nl.numero, bg: NO_LECTIVA_COLOR.bg, color: NO_LECTIVA_COLOR.text,
        bold: true, size: 8, align: ctr, border: cellBorder,
      });
      wc(ws, R, 2, {
        value: nl.tipo, bg: NO_LECTIVA_COLOR.bg, color: NO_LECTIVA_COLOR.text,
        size: 7.5, align: ctr, border: cellBorder, wrap: true,
      });
      wc(ws, R, 3, {
        value: nl.descripcion, bg: NO_LECTIVA_COLOR.bg, color: NO_LECTIVA_COLOR.text,
        size: 7.5, align: lft, border: cellBorder, wrap: true, mergeEnd: 5,
      });
      wc(ws, R, 6, {
        value: nl.horasSemanales, bg: NO_LECTIVA_COLOR.bg, color: NO_LECTIVA_COLOR.text,
        bold: true, size: 8, align: ctr, border: cellBorder, mergeEnd: totalCols,
      });
    } else {
      ws.getRow(R).height = 13;
      wc(ws, R, 1, {
        value: '—', bg: SLATE50, color: TEXTMID, size: 7.5, align: ctr, border: cellBorder,
      });
      wc(ws, R, 2, {
        value: '—', bg: SLATE50, color: TEXTMID, size: 7.5, align: ctr, border: cellBorder,
      });
      wc(ws, R, 3, {
        value: 'Sin carga no lectiva registrada', mergeEnd: totalCols,
        bg: SLATE50, color: TEXTMID, italic: true, size: 7.5, align: ctr, border: cellBorder,
      });
    }
    R++;
  }
  outerBorder(ws, tblNLStart, R - 1, 1, totalCols, bThick());

  return R;
}

function generarHojaMatrizDocente(
  ws: ExcelJS.Worksheet,
  docente: any,
  periodo: any,
  horarios: HorarioMatrizItem[],
  cursosLeyenda: CursoLeyendaItem[],
  noLectivasLeyenda: NoLectivaLeyendaItem[],
) {
  const TOTAL_COLS_MATRIZ = 7;
  const COL_WIDTHS_MATRIZ: Record<number, number> = {
    1: 12, 2: 22, 3: 22, 4: 22, 5: 22, 6: 22, 7: 22,
  };
  for (const [col, w] of Object.entries(COL_WIDTHS_MATRIZ)) {
    ws.getColumn(Number(col)).width = w;
  }

  const colorPorKey = (key: string, isNoLectiva: boolean) => {
    if (isNoLectiva) return NO_LECTIVA_COLOR;
    return cursosLeyenda.find((c) => c.key === key)?.color ?? MATRIZ_COLORES[0];
  };

  const horasTotales = horarios.reduce((sum, h) => {
    const start = Number.parseInt(h.hora_inicio.split(':')[0], 10);
    const end = Number.parseInt(h.hora_fin.split(':')[0], 10);
    return sum + Math.max(0, end - start);
  }, 0);

  let R = 1;
  const sem = periodo?.semestre === 1 ? 'I' : 'II';
  const nombreDocente = `${docente.nombres} ${docente.apellidos}`;

  wc(ws, R, 1, {
    value: 'UNIVERSIDAD NACIONAL DE TRUJILLO — FACULTAD DE INGENIERÍA TRUJILLO',
    mergeEnd: TOTAL_COLS_MATRIZ, bg: NAVY, color: WHITE, bold: true, size: 11, align: ctr,
  });
  ws.getRow(R).height = 22; R++;

  wc(ws, R, 1, {
    value: `HORARIO SEMANAL DEL DOCENTE — ${nombreDocente.toUpperCase()}`,
    mergeEnd: TOTAL_COLS_MATRIZ, bg: NAVY2, color: WHITE, bold: true, size: 10, align: ctr,
  });
  ws.getRow(R).height = 18; R++;

  wc(ws, R, 1, {
    value: `Periodo: ${periodo?.nombre ?? ''}  •  Año ${periodo?.anio ?? ''} — Sem. ${sem}  •  ${cursosLeyenda.length} curso(s) lectivo(s)  •  ${noLectivasLeyenda.length} actividad(es) no lectiva(s)  •  ${horasTotales} h en matriz`,
    mergeEnd: TOTAL_COLS_MATRIZ, bg: SLATE100, color: TEXTMID, bold: true, size: 8, align: ctr,
    border: { bottom: bThin() },
  });
  ws.getRow(R).height = 16; R++;

  for (let c = 1; c <= TOTAL_COLS_MATRIZ; c++) ws.getCell(R, c).fill = fill(SLATE50);
  ws.getRow(R).height = 4; R++;

  const gridHeaderR = R;
  wc(ws, R, 1, {
    value: 'HORA', bg: NAVY, color: WHITE, bold: true, size: 9, align: ctr,
    border: { right: bThin(WHITE), bottom: bMed(WHITE) },
  });
  for (let d = 0; d < 6; d++) {
    wc(ws, R, d + 2, {
      value: DIAS_MATRIZ[d], bg: NAVY, color: WHITE, bold: true, size: 9, align: ctr,
      border: { right: bThin(WHITE), bottom: bMed(WHITE) },
    });
  }
  ws.getRow(R).height = 18; R++;

  for (let idx = 0; idx < RANGOS_HORARIOS.length; idx++) {
    const hora = RANGOS_HORARIOS[idx];
    const label = RANGOS_LABELS[idx];
    const esAlm = hora === '13:00';
    ws.getRow(R).height = esAlm ? 14 : 36;

    wc(ws, R, 1, {
      value: label, bg: SLATE100, color: NAVY, bold: true, size: 8, align: ctr,
      border: { bottom: bThin(), right: bThin() },
    });

    if (esAlm) {
      wc(ws, R, 2, {
        value: '—   A L M U E R Z O   —', mergeEnd: TOTAL_COLS_MATRIZ,
        bg: SLATE100, color: TEXTMID, bold: true, italic: true, size: 8, align: ctr,
        border: { top: bMed(), bottom: bMed(), right: bThin() },
      });
    } else {
      for (let d = 0; d < 6; d++) {
        const bloque = horarios.find(
          (h) => h.dia_semana === d && horaEnRango(hora, h.hora_inicio, h.hora_fin),
        );
        if (bloque) {
          const colores = colorPorKey(bloque.leyendaKey, bloque.is_no_lectiva);
          const linea1 = bloque.is_no_lectiva
            ? `NL-${bloque.leyendaNumero}`
            : `${bloque.leyendaNumero} · ${bloque.ambiente_codigo}`;
          const linea2 = bloque.is_no_lectiva
            ? bloque.curso_nombre
            : bloque.ciclo_nombre;
          const linea3 = bloque.is_no_lectiva ? bloque.ciclo_nombre : bloque.curso_codigo;
          wc(ws, R, d + 2, {
            value: `${linea1}\n${linea2}\n${linea3}`,
            bg: colores.bg, color: colores.text, bold: true, size: 8,
            align: { horizontal: 'center', vertical: 'middle', wrapText: true },
            border: { bottom: bThin(), right: bThin() },
          });
        } else {
          wc(ws, R, d + 2, {
            value: '', bg: WHITE, align: ctr,
            border: { bottom: bThin(), right: bThin() },
          });
        }
      }
    }
    R++;
  }

  const gridEnd = R - 1;
  outerBorder(ws, gridHeaderR, gridEnd, 1, TOTAL_COLS_MATRIZ, bThick());

  for (let c = 1; c <= TOTAL_COLS_MATRIZ; c++) ws.getCell(R, c).fill = fill(SLATE50);
  ws.getRow(R).height = 6; R++;

  R = generarTablasLeyendaDocente(ws, R, TOTAL_COLS_MATRIZ, cursosLeyenda, noLectivasLeyenda);

  for (let c = 1; c <= TOTAL_COLS_MATRIZ; c++) ws.getCell(R, c).fill = fill(SLATE50);
  ws.getRow(R).height = 4; R++;

  wc(ws, R, 1, {
    value: `Generado el ${new Date().toLocaleString('es-PE')} · Sistema de Gestión de Horarios UNT`,
    mergeEnd: TOTAL_COLS_MATRIZ, bg: SLATE50, color: TEXTMID, italic: true, size: 7, align: rgt,
  });
  ws.getRow(R).height = 12;
}

async function generarExcelHorarioDocente(
  id_docente: number,
  id_periodo: number,
  periodo: any,
): Promise<{ buffer: ExcelJS.Buffer; filename: string }> {
  const { docente, horarios, cursosLeyenda, noLectivasLeyenda } =
    await cargarHorariosDocenteCompleto(id_docente, id_periodo);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Gestión de Horarios UNT';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Mi Horario', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.15, footer: 0.15 },
    },
    views: [{ showGridLines: false }],
  });

  generarHojaMatrizDocente(ws, docente, periodo, horarios, cursosLeyenda, noLectivasLeyenda);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Mi_Horario_${docente.apellidos}_${docente.nombres}_${periodo?.codigo ?? 'docente'}.xlsx`;
  return { buffer, filename };
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    const tipo = searchParams.get('tipo');
    const departamentoId = searchParams.get('departamentoId');
    let id_docente = searchParams.get('id_docente') ? parseInt(searchParams.get('id_docente')!) : undefined;
    const id_ambiente = searchParams.get('id_ambiente') ? parseInt(searchParams.get('id_ambiente')!) : undefined;
    const id_ciclo = searchParams.get('id_ciclo') ? parseInt(searchParams.get('id_ciclo')!) : undefined;

    if (tipo === 'docente_propio') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id_usuario) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }
      const docenteData = await prisma.docente.findUnique({
        where: { id_usuario: session.user.id_usuario },
      });
      if (!docenteData) {
        return NextResponse.json({ error: 'Usuario no es docente' }, { status: 403 });
      }
      id_docente = docenteData.id_docente;
    }

    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(id_periodo) },
    });

    // Horario individual del docente: matriz semanal en una sola hoja
    if (id_docente && !id_ambiente && !id_ciclo) {
      const { buffer, filename } = await generarExcelHorarioDocente(
        id_docente,
        parseInt(id_periodo),
        periodo,
      );
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Determinar qué ciclos procesar
    let ciclos: any[] = [];
    if (id_ciclo) {
      const ciclo = await prisma.ciclo.findUnique({ where: { id_ciclo } });
      if (ciclo) ciclos = [ciclo];
    } else {
      ciclos = await prisma.ciclo.findMany({ orderBy: { numero: 'asc' } });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Horarios UNT';
    workbook.created = new Date();

    const fmt  = (d?: Date | null) => d ? new Date(d).toLocaleDateString('es-PE') : '—';
    const fIni = fmt(periodo?.fecha_inicio_clases);
    const fFin = fmt(periodo?.fecha_fin_clases);
    const sem  = periodo?.semestre === 1 ? 'I' : 'II';
    const pNom = periodo?.nombre  ?? '';
    const pAno = String(periodo?.anio ?? '');
    const pCod = periodo?.codigo  ?? '';

    const HORAS       = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
    const LABEL_HORAS = ['7-8','8-9','9-10','10-11','11-12','12-1','1-2','2-3','3-4','4-5','5-6','6-7','7-8'];
    const DIAS_NOMBRE = ['LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];

    for (const ciclo of ciclos) {
      const where: any = {
        id_periodo: parseInt(id_periodo),
        curso: { id_ciclo: ciclo.id_ciclo }
      };
      if (departamentoId) {
        where.OR = [
          { docente: { departamentoId } },
          { ambiente: { departamentoId } },
          { curso: { departamentoId } }
        ];
      }
      if (id_docente) where.id_docente = id_docente;
      if (id_ambiente) where.id_ambiente = id_ambiente;

      const horarios = await prisma.horarioAsignado.findMany({
        where,
        include: { docente: true, curso: true, ambiente: true, grupo: true },
        orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
      });
      if (horarios.length === 0) continue;

      // Construir cursosMap
      const cursosMap = new Map<string, any>();
      for (const h of horarios) {
        const key = `${h.id_curso}-${h.id_docente}-${h.id_grupo}`;
        if (!cursosMap.has(key)) {
          cursosMap.set(key, {
            docente:      `${h.docente.nombres} ${h.docente.apellidos}`,
            asignatura:   h.curso.nombre,
            T:            h.curso.horas_teoria      ?? 0,
            P:            h.curso.horas_practica    ?? 0,
            L:            h.curso.horas_laboratorio ?? 0,
            G:            h.grupo.codigo_grupo,
            THoras:       (h.curso.horas_teoria ?? 0) + (h.curso.horas_practica ?? 0) + (h.curso.horas_laboratorio ?? 0),
            departamento: h.docente.especialidad ?? 'Ing. Sistemas',
          });
        }
      }
      const cursos = Array.from(cursosMap.values());

      // Crear hoja
      const ws = workbook.addWorksheet(`Ciclo ${ciclo.numero}`, {
        pageSetup: {
          paperSize:    9,
          orientation:  'portrait',
          fitToPage:    true,
          fitToWidth:   1,
          fitToHeight:  0,
          margins: { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.15, footer: 0.15 },
        },
        views: [{ showGridLines: false }],
      });

      for (const [col, w] of Object.entries(COL_WIDTHS)) {
        ws.getColumn(Number(col)).width = w;
      }

      let R = 1;

      // ════════════════════════════════════════════════════════════════════
      // BLOQUE 1: CABECERA INSTITUCIONAL
      // ════════════════════════════════════════════════════════════════════
      wc(ws, R, 1, {
        value:    'UNIVERSIDAD NACIONAL DE TRUJILLO — FACULTAD DE INGENIERÍA TRUJILLO',
        mergeEnd: ALL_R, bg: NAVY, color: WHITE, bold: true, size: 11, align: ctr,
      });
      ws.getRow(R).height = 22; R++;

      wc(ws, R, 1, {
        value:    `ESCUELA PROF. ING. DE SISTEMAS   ·   HORARIO SEMESTRAL — CICLO ${ciclo.numero}   ·   ${pNom}  ${pAno} – SEM. ${sem}`,
        mergeEnd: ALL_R, bg: NAVY2, color: WHITE, bold: true, size: 9, align: ctr,
      });
      ws.getRow(R).height = 16; R++;

      // ════════════════════════════════════════════════════════════════════
      // BLOQUE 2: BOX INFORMATIVO
      // ════════════════════════════════════════════════════════════════════
      const boxStart = R;

      for (let c = 1; c <= TOTAL_COLS; c++) ws.getCell(R, c).fill = fill(SLATE200);
      ws.getRow(R).height = 3; R++;

      wc(ws, R, 1, {
        value: 'ESCUELA:', mergeEnd: 2,
        bg: NAVY, color: WHITE, bold: true, size: 7.5, align: rgt,
        border: { right: bThin(WHITE) },
      });
      wc(ws, R, 3, {
        value: 'ING. DE SISTEMAS', mergeEnd: 5,
        bg: NAVY, color: 'FFF0F9FF', bold: true, size: 7.5, align: lft,
        border: { right: bMed(WHITE) },
      });
      wc(ws, R, 6, {
        value: 'CICLO:', mergeEnd: 7,
        bg: NAVY2, color: WHITE, bold: true, size: 8, align: rgt,
        border: { right: bThin(WHITE) },
      });
      wc(ws, R, 8, {
        value: `${ciclo.numero}`,
        bg: NAVY2, color: 'FFFBBF24', bold: true, size: 13, align: ctr,
        border: { right: bMed(WHITE) },
      });
      wc(ws, R, 9, {
        value: 'SECCIÓN:', mergeEnd: 10,
        bg: NAVY2, color: WHITE, bold: true, size: 8, align: rgt,
        border: { right: bThin(WHITE) },
      });
      wc(ws, R, 11, {
        value: 'A',
        bg: NAVY2, color: 'FFFBBF24', bold: true, size: 13, align: ctr,
        border: { right: bMed(WHITE) },
      });
      wc(ws, R, 12, {
        value: `AÑO: ${pAno}  SEM: ${sem}`, mergeEnd: ALL_R,
        bg: NAVY2, color: WHITE, bold: true, size: 8, align: ctr,
      });
      ws.getRow(R).height = 20; R++;

      wc(ws, R, 1, {
        value: 'Inicio:', mergeEnd: 2,
        bg: SLATE100, color: TEXTMID, bold: true, size: 7.5, align: rgt,
        border: { bottom: bThin(), right: bThin() },
      });
      wc(ws, R, 3, {
        value: fIni, mergeEnd: 5,
        bg: SLATE100, color: NAVY, bold: true, size: 8, align: lft,
        border: { bottom: bThin(), right: bMed() },
      });
      wc(ws, R, 6, {
        value: 'Término:', mergeEnd: 7,
        bg: SLATE100, color: TEXTMID, bold: true, size: 7.5, align: rgt,
        border: { bottom: bThin(), right: bThin() },
      });
      wc(ws, R, 8, {
        value: fFin, mergeEnd: 9,
        bg: SLATE100, color: NAVY, bold: true, size: 8, align: lft,
        border: { bottom: bThin(), right: bMed() },
      });
      wc(ws, R, 10, {
        value: `Período: ${pNom}  •  Cód: ${pCod}`, mergeEnd: ALL_R,
        bg: SLATE100, color: TEXTMID, italic: true, size: 7.5, align: ctr,
        border: { bottom: bThin() },
      });
      ws.getRow(R).height = 13; R++;

      const boxEnd = R - 1;
      outerBorder(ws, boxStart + 1, boxEnd, 1, ALL_R, bThick());

      for (let c = 1; c <= TOTAL_COLS; c++) ws.getCell(R, c).fill = fill(SLATE50);
      ws.getRow(R).height = 5; R++;

      // ════════════════════════════════════════════════════════════════════
      // BLOQUE 3: GRILLA HORARIA
      // ════════════════════════════════════════════════════════════════════
      const gridHeaderR = R;

      wc(ws, R, G_HORA_L, {
        value: 'HORA', bg: NAVY, color: WHITE, bold: true, size: 9, align: ctr,
        border: { right: bThin(WHITE), bottom: bMed(WHITE) },
      });
      for (let d = 0; d < 6; d++) {
        const [c1, c2] = G_DAYS[d];
        wc(ws, R, c1, {
          value: DIAS_NOMBRE[d], mergeEnd: c2,
          bg: NAVY, color: WHITE, bold: true, size: 9, align: ctr,
          border: { right: bThin(WHITE), bottom: bMed(WHITE) },
        });
      }
      wc(ws, R, G_HORA_R, {
        value: 'HORA', bg: NAVY, color: WHITE, bold: true, size: 9, align: ctr,
        border: { left: bThin(WHITE), bottom: bMed(WHITE) },
      });
      ws.getRow(R).height = 18; R++;

      for (let idx = 0; idx < HORAS.length; idx++) {
        const hora  = HORAS[idx];
        const label = LABEL_HORAS[idx];
        const esAlm = hora === '13:00';

        ws.getRow(R).height = esAlm ? 12 : 28;

        wc(ws, R, G_HORA_L, {
          value: label, bg: SLATE100, color: NAVY, bold: true, size: 8, align: ctr,
          border: { bottom: bThin(), right: bThin() },
        });

        if (esAlm) {
          const [c1] = G_DAYS[0];
          const [, c2] = G_DAYS[5];
          wc(ws, R, c1, {
            value: '—   A L M U E R Z O   —', mergeEnd: c2,
            bg: SLATE100, color: TEXTMID, bold: true, italic: true, size: 8, align: ctr,
            border: { top: bMed(), bottom: bMed(), right: bThin() },
          });
          for (let c = 1; c <= G_HORA_R; c++) {
            const cell = ws.getCell(R, c);
            cell.border = { ...cell.border, top: bMed(), bottom: bMed() };
          }
        } else {
          for (let d = 0; d < 6; d++) {
            const [c1, c2] = G_DAYS[d];
            const clase = horarios.find((h: any) => {
              const hIni = parseInt(h.hora_inicio.split(':')[0]);
              const hFin = parseInt(h.hora_fin.split(':')[0]);
              const hAct = parseInt(hora.split(':')[0]);
              return h.dia_semana === d && hAct >= hIni && hAct < hFin;
            });

            if (clase) {
              const ci  = cursos.findIndex(c => c.asignatura === clase.curso.nombre && c.G === clase.grupo.codigo_grupo);
              const bg  = PASTEL[ci % PASTEL.length];
              const txt = TEXTO[ci % TEXTO.length];
              wc(ws, R, c1, {
                value: `${ci + 1}\n(${clase.ambiente.nombre})`, mergeEnd: c2,
                bg, color: txt, bold: true, size: 8,
                align: { horizontal: 'center', vertical: 'middle', wrapText: true },
                border: { bottom: bThin(), right: bThin() },
              });
            } else {
              wc(ws, R, c1, {
                value: '', mergeEnd: c2,
                bg: WHITE, align: ctr,
                border: { bottom: bThin(), right: bThin() },
              });
            }
          }
        }

        wc(ws, R, G_HORA_R, {
          value: label, bg: SLATE100, color: NAVY, bold: true, size: 8, align: ctr,
          border: { bottom: bThin(), left: bThin() },
        });

        R++;
      }

      const gridEnd = R - 1;
      outerBorder(ws, gridHeaderR, gridEnd, G_HORA_L, G_HORA_R, bThick());

      // ════════════════════════════════════════════════════════════════════
      // BLOQUE 4: PLANA DOCENTE
      // ════════════════════════════════════════════════════════════════════
      for (let c = 1; c <= TOTAL_COLS; c++) ws.getCell(R, c).fill = fill(SLATE50);
      ws.getRow(R).height = 6; R++;

      const tblStart = R;

      wc(ws, R, 1, {
        value: 'PLANA DOCENTE Y ASIGNATURAS',
        mergeEnd: ALL_R, bg: NAVY, color: WHITE, bold: true, size: 10, align: ctr,
        border: { bottom: bMed(WHITE) },
      });
      ws.getRow(R).height = 17; R++;

      const hdrBorder: Partial<ExcelJS.Borders> = { bottom: bThin(WHITE), right: bThin(WHITE) };
      const hdrOpts = { bg: NAVY3, color: WHITE, bold: true, size: 7.5 };

      wc(ws, R, BT_NUM,        { ...hdrOpts, value: 'Nº',          align: ctr, border: hdrBorder });
      wc(ws, R, BT_PROF[0],    { ...hdrOpts, value: 'PROFESOR',    mergeEnd: BT_PROF[1], align: lft, border: hdrBorder });
      wc(ws, R, BT_ASIG[0],    { ...hdrOpts, value: 'ASIGNATURA',  mergeEnd: BT_ASIG[1], align: lft, border: hdrBorder });
      wc(ws, R, BT_T,          { ...hdrOpts, value: 'T',            align: ctr, border: hdrBorder });
      wc(ws, R, BT_P,          { ...hdrOpts, value: 'P',            align: ctr, border: hdrBorder });
      wc(ws, R, BT_L,          { ...hdrOpts, value: 'L',            align: ctr, border: hdrBorder });
      wc(ws, R, BT_G,          { ...hdrOpts, value: 'G',            align: ctr, border: hdrBorder });
      wc(ws, R, BT_HRS,        { ...hdrOpts, value: 'T.HRS',        align: ctr, border: hdrBorder });
      wc(ws, R, BT_DEPT[0],    { ...hdrOpts, value: 'DEPTO.',       align: ctr, border: hdrBorder });
      ws.getRow(R).height = 14; R++;

      const MIN_ROWS = Math.max(cursos.length, 6);
      for (let i = 0; i < MIN_ROWS; i++) {
        const curso = cursos[i];
        const bg  = PASTEL[i % PASTEL.length];
        const txt = TEXTO[i % TEXTO.length];

        if (curso) {
          const rowH = calcRowHeight([
            { text: curso.docente,      colWidthChars: W_PROF_BT },
            { text: curso.asignatura,   colWidthChars: W_ASIG_BT },
            { text: curso.departamento, colWidthChars: W_DEPT_BT },
          ], 7.5, 14, 3);
          ws.getRow(R).height = rowH;

          const rBorder: Partial<ExcelJS.Borders> = { bottom: bThin(), right: bThin() };
          wc(ws, R, BT_NUM,        { value: i + 1,            bg, color: txt, bold: true,  size: 8,   align: ctr, border: rBorder });
          wc(ws, R, BT_PROF[0],    { value: curso.docente,    bg, color: txt, bold: false, size: 7.5, align: lft, border: rBorder, wrap: true, mergeEnd: BT_PROF[1] });
          wc(ws, R, BT_ASIG[0],    { value: curso.asignatura, bg, color: txt, bold: false, size: 7.5, align: lft, border: rBorder, wrap: true, mergeEnd: BT_ASIG[1] });
          wc(ws, R, BT_T,          { value: curso.T,          bg, color: txt, bold: true,  size: 8,   align: ctr, border: rBorder });
          wc(ws, R, BT_P,          { value: curso.P,          bg, color: txt, bold: true,  size: 8,   align: ctr, border: rBorder });
          wc(ws, R, BT_L,          { value: curso.L,          bg, color: txt, bold: true,  size: 8,   align: ctr, border: rBorder });
          wc(ws, R, BT_G,          { value: curso.G,          bg, color: txt, bold: true,  size: 8,   align: ctr, border: rBorder });
          wc(ws, R, BT_HRS,        { value: curso.THoras,     bg, color: txt, bold: true,  size: 8,   align: ctr, border: rBorder });
          wc(ws, R, BT_DEPT[0],    { value: curso.departamento, bg, color: txt, bold: false, size: 7, align: lft, border: rBorder, wrap: true });
        } else {
          ws.getRow(R).height = 13;
          const stripeBg = i % 2 === 0 ? WHITE : SLATE50;
          for (let c = 1; c <= TOTAL_COLS; c++) {
            ws.getCell(R, c).fill   = fill(stripeBg);
            ws.getCell(R, c).border = { bottom: bThin(), right: bThin() };
          }
        }
        R++;
      }

      const tblEnd = R - 1;
      outerBorder(ws, tblStart, tblEnd, 1, ALL_R, bThick());

      // Leyenda
      for (let c = 1; c <= TOTAL_COLS; c++) ws.getCell(R, c).fill = fill(SLATE50);
      ws.getRow(R).height = 4; R++;

      wc(ws, R, 1, {
        value: `LEYENDA: Colores = numeración de docentes.  Clases programadas: ${horarios.length}  Período: ${pNom}  Cód: ${pCod}`,
        mergeEnd: ALL_R,
        bg: SLATE50, color: TEXTMID, italic: true, size: 7, align: ctr,
        border: { top: bThin() },
      });
      ws.getRow(R).height = 11; R++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    let filename = `horario_${periodo?.codigo ?? 'general'}`;
    if (id_docente) {
      const docente = await prisma.docente.findUnique({ where: { id_docente } });
      if (docente) filename = `horario_${docente.apellidos}_${docente.nombres}`;
    } else if (id_ambiente) {
      const ambiente = await prisma.ambiente.findUnique({ where: { id_ambiente } });
      if (ambiente) filename = `horario_${ambiente.codigo}`;
    } else if (id_ciclo) {
      filename = `horario_ciclo_${id_ciclo}`;
    }
    filename += '.xlsx';

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Error generando Excel:', error);
    return NextResponse.json(
      { error: 'Error al generar Excel', details: error.message },
      { status: 500 },
    );
  }
}