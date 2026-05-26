import { NextResponse } from 'next/server';
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

const NAVY      = 'FF003366';
const NAVY2     = 'FF0a4a8a';
const SLATE50   = 'FFF8FAFC';
const SLATE100  = 'FFF1F5F9';
const SLATE200  = 'FFE2E8F0';
const WHITE     = 'FFFFFFFF';
const TEXTDARK  = 'FF1e293b';
const TEXTMID   = 'FF475569';
const BLACK     = 'FF000000';

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT: 24 columnas base, cada una de 7 caracteres de ancho
//
//  Total = 24 × 7 = 168 chars  (A4 landscape usable ≈ 160-170 chars ✓)
//
//  Bloque BOX  (cols  1-6 ):  6 × 7 = 42 chars
//  Bloque TBL  (cols  7-24): 18 × 7 = 126 chars
//
//  Grilla (filas de horario) — merges sobre las mismas 24 cols:
//    HORA-izq   = col  1         (7)
//    LUNES      = cols  2- 5    (28)  ← 4 base cols cada día
//    MARTES     = cols  6- 9    (28)
//    MIERCOLES  = cols 10-13    (28)
//    JUEVES     = cols 14-17    (28)
//    VIERNES    = cols 18-21    (28)
//    SABADO     = cols 22-24 +1? → ajuste: 3 cols = 21  (ver abajo)
//    HORA-der   = col 24         (7)
//
//  Para que cuadre exacto con 24 cols:
//    HORA-L(1) + 5días×4cols(20) + SAB×2cols(2 cols pendiente) + HORA-R(1) = 24
//    → SAB = cols 22-23 (14), HORA-R = col 24 ... deja SAB muy angosto
//
//  Mejor: 25 cols totales —  HORA(1) + 6días×4cols(24) = 25 - 1 - 1 = ??
//    HORA-L(1) + 6×4(24) + HORA-R(1) = 26 cols → usar 26 cols
//    26 × 7 = 182 → algo ancho para A4 landscape
//
//  SOLUCIÓN FINAL: 22 cols base de ancho MIXTO:
//    Col 1:  8  (HORA, ancho especial)
//    Cols 2-22: grilla días + tabla
//
//  MÁS SIMPLE: mantener 20 cols pero cambiar los ANCHOS de columna
//  para que las cols de PROFESOR/ASIGNATURA sean más anchas:
//
//    Col  1:  8   HORA-izq  / Box-label
//    Col  2: 10   LUN-A     / Box-val
//    Col  3: 10   LUN-B     / Box-val
//    Col  4: 10   MAR-A     / Box-val
//    Col  5: 10   MAR-B
//    Col  6: 10   MIE-A     / (BOX_R aquí)
//    Col  7: 10   MIE-B     / TBL_L = Nº
//    Col  8: 10   JUE-A     / PROF-start
//    Col  9: 10   JUE-B     / PROF
//    Col 10: 10   VIE-A     / PROF-end
//    Col 11: 10   VIE-B     / ASIG-start
//    Col 12: 10   SAB-A     / ASIG
//    Col 13: 10   SAB-B     / ASIG-end
//    Col 14:  8   HORA-der  / T
//    Col 15:  5              / P
//    Col 16:  5              / L
//    Col 17:  5              / G
//    Col 18:  7              / T.HRS
//    Col 19: 10              / DEPTO-A
//    Col 20: 10              / DEPTO-B
//
//  Grid:  HORA(1) | LUN(2-3) | MAR(4-5) | MIE(6-7) | JUE(8-9) | VIE(10-11) | SAB(12-13) | HORA(14)
//  Box:   cols 1-6 (ancho = 8+10+10+10+10+10 = 58)
//  Table: cols 7-20 (ancho = 10+10+10+10+10+10+8+5+5+5+7+10+10 = 110)
// ─────────────────────────────────────────────────────────────────────────────

const TOTAL_COLS = 20;

// Anchos individuales por columna (NO uniforme — optimizados para contenido)
const COL_WIDTHS: Record<number, number> = {
   1:  8,   // HORA-izq / Box-label
   2: 10,   // LUN-A    / Box-val-1
   3: 10,   // LUN-B    / Box-val-2
   4: 10,   // MAR-A    / Box-val-3
   5: 10,   // MAR-B    / Box-val-4
   6: 10,   // MIE-A    / Box-val-5  (BOX_R)
   7: 10,   // MIE-B    / Nº         (TBL_L)
   8: 10,   // JUE-A    / PROF-1
   9: 10,   // JUE-B    / PROF-2
  10: 10,   // VIE-A    / PROF-3
  11: 10,   // VIE-B    / ASIG-1
  12: 10,   // SAB-A    / ASIG-2
  13: 10,   // SAB-B    / ASIG-3
  14:  8,   // HORA-der / T
  15:  5,   //          / P
  16:  5,   //          / L
  17:  5,   //          / G
  18:  7,   //          / T.HRS
  19: 10,   //          / DEPTO-A
  20: 10,   //          / DEPTO-B
};

// Anchos efectivos por zona (suma de cols base) — para calcRowHeight
const W_PROF = (COL_WIDTHS[8]  + COL_WIDTHS[9]  + COL_WIDTHS[10]);  // 30 chars
const W_ASIG = (COL_WIDTHS[11] + COL_WIDTHS[12] + COL_WIDTHS[13]);  // 30 chars
const W_DEPT = (COL_WIDTHS[19] + COL_WIDTHS[20]);                    // 20 chars
const W_DAY  = (COL_WIDTHS[2]  + COL_WIDTHS[3]);                     // 20 chars — cada día

// Helpers de merge por zona
const BOX_L = 1;  const BOX_R = 6;   // cols del box izquierdo
const TBL_L = 7;  const TBL_R = 20;  // cols de la tabla derecha
const ALL_L = 1;  const ALL_R = 20;  // ancho completo (cabecera)

// Columnas de la grilla
const G_HORA_L = 1;
const G_DAYS: [number, number][] = [
  [2,  3],   // LUNES      (cols 2-3)
  [4,  5],   // MARTES     (cols 4-5)
  [6,  7],   // MIERCOLES  (cols 6-7)
  [8,  9],   // JUEVES     (cols 8-9)
  [10, 11],  // VIERNES    (cols 10-11)
  [12, 13],  // SABADO     (cols 12-13)
];
const G_HORA_R = 14;  // columna HORA derecha de la grilla
// Nota: cols 15-20 quedan vacías en filas de grilla (T,P,L,G,THRS,DEPTO)

// Columnas de la tabla
const T_NUM   = 7;
const T_PROF  = [8,  10] as [number, number];
const T_ASIG  = [11, 13] as [number, number];
const T_T     = 14;
const T_P     = 15;
const T_L     = 16;
const T_G     = 17;
const T_HRS   = 18;
const T_DEPT  = [19, 20] as [number, number];

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const fill = (argb: string): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const bThin  = (argb = 'FFCBD5E1') => ({ style: 'thin'   as ExcelJS.BorderStyle, color: { argb } });
const bMed   = (argb = 'FF94A3B8') => ({ style: 'medium' as ExcelJS.BorderStyle, color: { argb } });
const bThick = (argb = NAVY)       => ({ style: 'medium' as ExcelJS.BorderStyle, color: { argb } });

const ctr: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };
const lft: Partial<ExcelJS.Alignment> = { horizontal: 'left',   vertical: 'middle' };
const rgt: Partial<ExcelJS.Alignment> = { horizontal: 'right',  vertical: 'middle' };

/** Escribe una celda y opcionalmente hace merge horizontal */
function wc(
  ws: ExcelJS.Worksheet, row: number, col: number,
  opts: {
    value?:     ExcelJS.CellValue;
    mergeEnd?:  number;
    bg?:        string;
    color?:     string;
    bold?:      boolean;
    italic?:    boolean;
    size?:      number;
    align?:     Partial<ExcelJS.Alignment>;
    border?:    Partial<ExcelJS.Borders>;
    wrap?:      boolean;
  } = {}
) {
  if (opts.mergeEnd && opts.mergeEnd > col) {
    ws.mergeCells(row, col, row, opts.mergeEnd);
  }
  const cell = ws.getCell(row, col);
  if (opts.value !== undefined) cell.value = opts.value;
  if (opts.bg)     cell.fill      = fill(opts.bg);
  if (opts.color || opts.bold || opts.italic || opts.size) {
    cell.font = {
      name:   'Arial',
      bold:   opts.bold   ?? false,
      italic: opts.italic ?? false,
      size:   opts.size   ?? 9,
      color:  { argb: opts.color ?? TEXTDARK },
    };
  }
  if (opts.align)  cell.alignment = opts.wrap ? { ...opts.align, wrapText: true } : opts.align;
  if (opts.border) cell.border    = opts.border;
  return cell;
}

/** Aplica borde exterior a un rango */
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

/**
 * Calcula la altura óptima de una fila de tabla según el texto más largo
 * de sus celdas con wrapText. Parámetros:
 *  - texts:     array de { texto, colWidthChars } para cada celda wrappeable
 *  - fontSize:  tamaño de fuente en puntos (default 8)
 *  - minHeight: altura mínima en puntos (default 15)
 *  - padding:   relleno vertical extra en puntos (default 4)
 *
 * Lógica: cuántas líneas necesita el texto dado el ancho de la columna
 *   líneas = ceil(len(texto) / chars_por_línea)
 *   altura = líneas × (fontSize × 1.35) + padding
 *
 * 1 char de Excel ≈ 7 px ≈ 5.25 pt  →  chars_por_línea ≈ colWidthChars × 0.9
 * (factor 0.9 es conservador para fuente Arial 8pt)
 */
function calcRowHeight(
  texts: { text: string; colWidthChars: number }[],
  fontSize = 8,
  minHeight = 16,
  padding = 5,
): number {
  const lineHeight = fontSize * 1.35;  // pt por línea
  let maxLines = 1;

  for (const { text, colWidthChars } of texts) {
    if (!text) continue;
    // Cada palabra fuerza un salto si no cabe; estimación simplificada por longitud
    const charsPerLine = Math.max(1, Math.floor(colWidthChars * 0.85));
    // Contar saltos de línea explícitos también
    const segments = text.split('\n');
    let lines = 0;
    for (const seg of segments) {
      lines += Math.max(1, Math.ceil(seg.length / charsPerLine));
    }
    maxLines = Math.max(maxLines, lines);
  }

  return Math.max(minHeight, maxLines * lineHeight + padding);
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(id_periodo) },
    });
    const ciclos = await prisma.ciclo.findMany({ orderBy: { numero: 'asc' } });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Horarios UNT';
    workbook.created = new Date();

    // Formato de fechas
    const fmt  = (d?: Date | null) => d ? new Date(d).toLocaleDateString('es-PE') : '—';
    const fIni = fmt(periodo?.fecha_inicio_clases);
    const fFin = fmt(periodo?.fecha_fin_clases);
    const sem  = periodo?.semestre === 1 ? 'I' : 'II';
    const pNom = periodo?.nombre  ?? '';
    const pAno = String(periodo?.anio ?? '');
    const pCod = periodo?.codigo  ?? '';

    const HORAS        = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
    const LABEL_HORAS  = ['7-8','8-9','9-10','10-11','11-12','12-1','1-2','2-3','3-4','4-5','5-6','6-7','7-8'];
    const DIAS_NOMBRE  = ['LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];

    // ══════════════════════════════════════════════════════════════════════════
    // UNA HOJA POR CICLO
    // ══════════════════════════════════════════════════════════════════════════
    for (const ciclo of ciclos) {

      const horarios = await prisma.horarioAsignado.findMany({
        where: { id_periodo: parseInt(id_periodo), curso: { id_ciclo: ciclo.id_ciclo } },
        include: { docente: true, curso: true, ambiente: true, grupo: true },
        orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
      });
      if (horarios.length === 0) continue;

      // ── lista de cursos ─────────────────────────────────────────────────
      const cursosMap = new Map<string, {
        docente: string; asignatura: string;
        T: number; P: number; L: number; G: string;
        THoras: number; departamento: string;
      }>();
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
            departamento: h.docente.especialidad ?? 'Ing. de Sistemas',
          });
        }
      }
      const cursos = Array.from(cursosMap.values());

      // ── crear hoja ───────────────────────────────────────────────────────
      const ws = workbook.addWorksheet(`Ciclo ${ciclo.numero}`, {
        pageSetup: {
          paperSize:   9,
          orientation: 'landscape',
          fitToPage:   true,
          fitToWidth:  1,
          fitToHeight: 0,
          margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
        },
        views: [{ showGridLines: false }],
      });

      // Anchos de columna optimizados por contenido
      for (const [col, w] of Object.entries(COL_WIDTHS)) {
        ws.getColumn(Number(col)).width = w;
      }

      let R = 1;  // cursor de fila

      // ════════════════════════════════════════════════════════════════════
      // BLOQUE 1: CABECERA INSTITUCIONAL COMPLETA  (cols 1-20)
      // ════════════════════════════════════════════════════════════════════
      // Fila 1
      wc(ws, R, 1, {
        value:    'UNIVERSIDAD NACIONAL DE TRUJILLO — FACULTAD DE INGENIERÍA TRUJILLO',
        mergeEnd: ALL_R, bg: NAVY, color: WHITE, bold: true, size: 13, align: ctr,
        border:   { bottom: bMed(WHITE) },
      });
      ws.getRow(R).height = 26; R++;

      // Fila 2
      wc(ws, R, 1, {
        value:    `ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS   ·   HORARIO SEMESTRAL — CICLO ${ciclo.numero}   ·   ${pNom}   ${pAno} – SEM. ${sem}`,
        mergeEnd: ALL_R, bg: NAVY2, color: WHITE, bold: true, size: 10, align: ctr,
      });
      ws.getRow(R).height = 18; R++;

      // Fila 3 – info fechas / generación
      wc(ws, R, 1, {
        value:    `Inicio del Ciclo: ${fIni}    •    Término del Ciclo: ${fFin}`,
        mergeEnd: 10, bg: SLATE50, color: TEXTMID, italic: true, size: 8, align: lft,
      });
      wc(ws, R, 11, {
        value:    `Generado: ${new Date().toLocaleString('es-PE')}   —   Sistema de Gestión de Horarios UNT`,
        mergeEnd: ALL_R, bg: SLATE50, color: TEXTMID, italic: true, size: 8, align: rgt,
      });
      ws.getRow(R).height = 13; R++;

      // Separador
      for (let c = 1; c <= TOTAL_COLS; c++) {
        ws.getCell(R, c).fill = fill(SLATE50);
      }
      ws.getRow(R).height = 5; R++;

      // ════════════════════════════════════════════════════════════════════
      // BLOQUE 2: BOX INFORMATIVO (cols 1-6) + TABLA DOCENTES (cols 7-20)
      // lado a lado, igual que el PDF
      // ════════════════════════════════════════════════════════════════════
      const blockStart = R;

      // ── 2A: BOX INFORMATIVO ─────────────────────────────────────────────

      // Título "UNIVERSIDAD NACIONAL DE TRUJILLO"
      wc(ws, R, BOX_L, {
        value: 'UNIVERSIDAD NACIONAL DE TRUJILLO', mergeEnd: BOX_R,
        bg: NAVY, color: WHITE, bold: true, size: 10, align: ctr,
      });
      ws.getRow(R).height = 17; R++;

      // Subtítulo "FACULTAD DE INGENIERÍA TRUJILLO"
      wc(ws, R, BOX_L, {
        value: 'FACULTAD DE INGENIERÍA TRUJILLO', mergeEnd: BOX_R,
        bg: NAVY2, color: WHITE, bold: true, size: 9, align: ctr,
      });
      ws.getRow(R).height = 15; R++;

      // Separador interno
      for (let c = BOX_L; c <= BOX_R; c++) ws.getCell(R, c).fill = fill(SLATE100);
      ws.getRow(R).height = 4; R++;

      // ESCUELA: label + valor
      wc(ws, R, BOX_L, {
        value: 'ESCUELA:', mergeEnd: BOX_L + 1,
        bg: SLATE100, color: NAVY, bold: true, size: 8, align: lft,
        border: { bottom: bThin() },
      });
      wc(ws, R, BOX_L + 2, {
        value: 'INGENIERÍA DE SISTEMAS', mergeEnd: BOX_R,
        bg: SLATE100, color: TEXTDARK, bold: true, size: 8, align: lft,
        border: { bottom: bThin() },
      });
      ws.getRow(R).height = 15; R++;

      // CICLO: X  |  SECCIÓN: A  (misma fila, 2 celdas)
      wc(ws, R, BOX_L, {
        value: `CICLO:   ${ciclo.numero}`, mergeEnd: BOX_L + 2,
        bg: SLATE50, color: TEXTDARK, bold: true, size: 9, align: lft,
        border: { bottom: bThin() },
      });
      wc(ws, R, BOX_L + 3, {
        value: `SECCIÓN:   A`, mergeEnd: BOX_R,
        bg: SLATE50, color: TEXTDARK, bold: true, size: 9, align: lft,
        border: { bottom: bThin() },
      });
      ws.getRow(R).height = 15; R++;

      // AÑO ACADÉMICO: XXXX  |  SEMESTRE: I  (misma fila)
      wc(ws, R, BOX_L, {
        value: `AÑO ACADÉMICO:   ${pAno}`, mergeEnd: BOX_L + 2,
        bg: SLATE50, color: TEXTDARK, bold: true, size: 9, align: lft,
        border: { bottom: bThin() },
      });
      wc(ws, R, BOX_L + 3, {
        value: `SEMESTRE:   ${sem}`, mergeEnd: BOX_R,
        bg: SLATE50, color: TEXTDARK, bold: true, size: 9, align: lft,
        border: { bottom: bThin() },
      });
      ws.getRow(R).height = 15; R++;

      // Espaciador interno
      for (let c = BOX_L; c <= BOX_R; c++) ws.getCell(R, c).fill = fill(SLATE100);
      ws.getRow(R).height = 6; R++;

      // Sub-caja de fechas (borde propio, alineado a la derecha como en el PDF)
      const fechaR1 = R;
      wc(ws, R, BOX_L, {
        value: `Inicio del Ciclo :    ${fIni}`, mergeEnd: BOX_R,
        bg: SLATE50, color: TEXTDARK, bold: true, size: 8, align: rgt,
        border: { top: bMed(NAVY), left: bMed(NAVY), right: bMed(NAVY) },
      });
      ws.getRow(R).height = 14; R++;

      wc(ws, R, BOX_L, {
        value: `Término del Ciclo :    ${fFin}`, mergeEnd: BOX_R,
        bg: SLATE50, color: TEXTDARK, bold: true, size: 8, align: rgt,
        border: { bottom: bMed(NAVY), left: bMed(NAVY), right: bMed(NAVY) },
      });
      ws.getRow(R).height = 14; R++;

      const boxEnd = R - 1;

      // ── 2B: TABLA DE DOCENTES ────────────────────────────────────────────
      // Escribimos en paralelo al box, regresando el cursor al blockStart
      let tR = blockStart;

      // Encabezado de la tabla
      wc(ws, tR, TBL_L, {
        value: 'PLANA DOCENTE Y ASIGNATURAS', mergeEnd: TBL_R,
        bg: NAVY, color: WHITE, bold: true, size: 10, align: ctr,
      });
      ws.getRow(tR).height = Math.max(ws.getRow(tR).height as number, 17); tR++;

      // Sub-encabezado de columnas
      const tblHdrs: [number, number | null, string, Partial<ExcelJS.Alignment>][] = [
        [T_NUM,     null,        'Nº',        ctr],
        [T_PROF[0], T_PROF[1],   'PROFESOR',  lft],
        [T_ASIG[0], T_ASIG[1],   'ASIGNATURA',lft],
        [T_T,       null,        'T',         ctr],
        [T_P,       null,        'P',         ctr],
        [T_L,       null,        'L',         ctr],
        [T_G,       null,        'G',         ctr],
        [T_HRS,     null,        'T.HRS',     ctr],
        [T_DEPT[0], T_DEPT[1],   'DEPTO.',    lft],
      ];
      for (const [c1, c2, txt, al] of tblHdrs) {
        wc(ws, tR, c1, {
          value: txt, mergeEnd: c2 ?? undefined,
          bg: 'FF0a3a6a', color: WHITE, bold: true, size: 8, align: al,
          border: { bottom: bThin(WHITE), right: bThin(WHITE) },
        });
      }
      ws.getRow(tR).height = Math.max(ws.getRow(tR).height as number, 15); tR++;

      // Filas de cursos (mínimo 11 filas como en el PDF)
      const MIN_ROWS = Math.max(cursos.length, 11);
      for (let i = 0; i < MIN_ROWS; i++) {
        const curso = cursos[i];
        const bg  = PASTEL[i % PASTEL.length];
        const txt = TEXTO [i % TEXTO .length];

        if (curso) {
          // Altura dinámica: calcula según el texto más largo que hace wrap
          const rowH = calcRowHeight([
            { text: curso.docente,      colWidthChars: W_PROF },
            { text: curso.asignatura,   colWidthChars: W_ASIG },
            { text: curso.departamento, colWidthChars: W_DEPT },
          ], 8, 16, 5);
          ws.getRow(tR).height = rowH;

          const vals: [number, number | null, ExcelJS.CellValue, Partial<ExcelJS.Alignment>, boolean][] = [
            [T_NUM,     null,      i + 1,              ctr,  true ],
            [T_PROF[0], T_PROF[1], curso.docente,      lft,  false],
            [T_ASIG[0], T_ASIG[1], curso.asignatura,   lft,  false],
            [T_T,       null,      curso.T,            ctr,  false],
            [T_P,       null,      curso.P,            ctr,  false],
            [T_L,       null,      curso.L,            ctr,  false],
            [T_G,       null,      curso.G,            ctr,  false],
            [T_HRS,     null,      curso.THoras,       ctr,  true ],
            [T_DEPT[0], T_DEPT[1], curso.departamento, lft,  false],
          ];
          for (const [c1, c2, val, al, bold] of vals) {
            wc(ws, tR, c1, {
              value: val, mergeEnd: c2 ?? undefined,
              bg, color: txt, bold, size: 8, align: al, wrap: true,
              border: { bottom: bThin(), right: bThin() },
            });
          }
        } else {
          // Fila vacía estilizada
          ws.getRow(tR).height = 16;
          for (let c = TBL_L; c <= TBL_R; c++) {
            ws.getCell(tR, c).fill   = fill(i % 2 === 0 ? WHITE : SLATE50);
            ws.getCell(tR, c).border = { bottom: bThin(), right: bThin() };
          }
        }
        tR++;
      }

      const tblEnd = tR - 1;

      // Sincronizar cursor al máximo de ambos bloques
      R = Math.max(boxEnd, tblEnd) + 1;

      // Bordes exteriores de ambos bloques
      outerBorder(ws, blockStart, boxEnd, BOX_L, BOX_R, bThick());
      outerBorder(ws, blockStart, tblEnd, TBL_L, TBL_R, bThick());

      // Separador
      for (let c = 1; c <= TOTAL_COLS; c++) ws.getCell(R, c).fill = fill(SLATE50);
      ws.getRow(R).height = 7; R++;

      // ════════════════════════════════════════════════════════════════════
      // BLOQUE 3: GRILLA HORARIA
      // HORA(1) | LUNES(2-3) | MAR(4-5) | MIE(6-7) | JUE(8-9) | VIE(10-11) | SAB(12-13) | HORA(14)
      // Cols 15-20 quedan vacías (zona de tabla) — se rellenan con blanco
      // ════════════════════════════════════════════════════════════════════
      const gridHeaderR = R;

      // Encabezado de días
      wc(ws, R, G_HORA_L, {
        value: 'HORA', bg: NAVY, color: WHITE, bold: true, size: 10, align: ctr,
        border: { right: bThin(WHITE), bottom: bMed(WHITE) },
      });
      for (let d = 0; d < 6; d++) {
        const [c1, c2] = G_DAYS[d];
        wc(ws, R, c1, {
          value: DIAS_NOMBRE[d], mergeEnd: c2,
          bg: NAVY, color: WHITE, bold: true, size: 10, align: ctr,
          border: { right: bThin(WHITE), bottom: bMed(WHITE) },
        });
      }
      wc(ws, R, G_HORA_R, {
        value: 'HORA', bg: NAVY, color: WHITE, bold: true, size: 10, align: ctr,
        border: { left: bThin(WHITE), bottom: bMed(WHITE) },
      });
      // Zona derecha vacía en filas de grilla (cols 15-20) → fondo blanco sin borde
      for (let c = G_HORA_R + 1; c <= TOTAL_COLS; c++) {
        ws.getCell(R, c).fill   = fill(WHITE);
        ws.getCell(R, c).border = {};
      }
      ws.getRow(R).height = 22; R++;

      // Filas de horas
      const gridDataStart = R;
      for (let idx = 0; idx < HORAS.length; idx++) {
        const hora  = HORAS[idx];
        const label = LABEL_HORAS[idx];
        const esAlm = hora === '13:00';

        ws.getRow(R).height = esAlm ? 14 : 32;

        // HORA izquierda
        wc(ws, R, G_HORA_L, {
          value: label, bg: SLATE100, color: NAVY, bold: true, size: 9, align: ctr,
          border: { bottom: bThin(), right: bThin() },
        });

        if (esAlm) {
          // Fila ALMUERZO — merge de todos los días
          const [c1] = G_DAYS[0];
          const [, c2] = G_DAYS[5];
          wc(ws, R, c1, {
            value: '—   A L M U E R Z O   —', mergeEnd: c2,
            bg: SLATE100, color: TEXTMID, bold: true, italic: true, size: 9, align: ctr,
            border: { top: bMed(), bottom: bMed(), right: bThin() },
          });
          // Reforzar borde en cols de grilla
          for (let c = 1; c <= G_HORA_R; c++) {
            const cell = ws.getCell(R, c);
            cell.border = { ...cell.border, top: bMed(), bottom: bMed() };
          }
        } else {
          for (let d = 0; d < 6; d++) {
            const [c1, c2] = G_DAYS[d];
            const clase = horarios.find(h => {
              const hIni = parseInt(h.hora_inicio.split(':')[0]);
              const hFin = parseInt(h.hora_fin.split(':')[0]);
              const hAct = parseInt(hora.split(':')[0]);
              return h.dia_semana === d && hAct >= hIni && hAct < hFin;
            });

            if (clase) {
              const ci  = cursos.findIndex(c => c.asignatura === clase.curso.nombre && c.G === clase.grupo.codigo_grupo);
              const bg  = PASTEL[ci % PASTEL.length];
              const txt = TEXTO [ci % TEXTO .length];
              wc(ws, R, c1, {
                value: `${ci + 1}\n(${clase.ambiente.nombre})`, mergeEnd: c2,
                bg, color: txt, bold: true, size: 9,
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

        // HORA derecha
        wc(ws, R, G_HORA_R, {
          value: label, bg: SLATE100, color: NAVY, bold: true, size: 9, align: ctr,
          border: { bottom: bThin(), left: bThin() },
        });

        // Cols 15-20: vacías con fondo blanco para ocultar cuadrícula
        for (let c = G_HORA_R + 1; c <= TOTAL_COLS; c++) {
          ws.getCell(R, c).fill   = fill(WHITE);
          ws.getCell(R, c).border = {};
        }

        R++;
      }

      const gridEnd = R - 1;

      // Borde exterior de la grilla
      outerBorder(ws, gridHeaderR, gridEnd, G_HORA_L, G_HORA_R, bThick());

      // Separador + leyenda
      for (let c = 1; c <= TOTAL_COLS; c++) ws.getCell(R, c).fill = fill(SLATE50);
      ws.getRow(R).height = 5; R++;

      wc(ws, R, 1, {
        value: `LEYENDA: Los colores de la grilla corresponden a la numeración de la tabla de docentes.   •   Clases programadas: ${horarios.length}   •   Periodo: ${pNom}   •   Código: ${pCod}`,
        mergeEnd: ALL_R,
        bg: SLATE50, color: TEXTMID, italic: true, size: 7.5, align: ctr,
        border: { top: bThin() },
      });
      ws.getRow(R).height = 12; R++;
    }

    // ── generar buffer ────────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="horario_${periodo?.codigo ?? 'general'}.xlsx"`,
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