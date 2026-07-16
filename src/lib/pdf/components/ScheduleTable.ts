import PDFDocument from 'pdfkit';
import { Colors, FontSizes, ReportLayout, Spacing } from '../layout';
import type { DocenteHorarioPdfDto, DocenteHorarioPdfItem } from '../types/docenteHorario';

const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
const DEFAULT_TIME_SLOTS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function compareHora(a: string | null, b: string | null): number {
  const getMinutes = (value: string | null): number => {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  };

  return getMinutes(a) - getMinutes(b);
}

function getCellText(item: DocenteHorarioPdfItem): string {
  const curso = item.curso?.nombre ?? 'Sin curso';
  const grupo = item.grupo?.codigo_grupo ?? '—';
  const ambiente = item.ambiente?.nombre ?? '—';
  const tipo = item.tipo_clase ?? '—';
  const horario = `${item.hora_inicio ?? '--:--'} - ${item.hora_fin ?? '--:--'}`;

  return `${curso}\n${tipo}\n${horario}\n${ambiente}\n${grupo}`;
}

function buildRows(dto: DocenteHorarioPdfDto): Array<{ cells: string[] }> {
  const groupedByDay = new Map<number, DocenteHorarioPdfItem[]>();

  for (const item of dto.horarios) {
    const dayKey = Number(item.dia_semana ?? 0);
    const current = groupedByDay.get(dayKey) ?? [];
    current.push(item);
    groupedByDay.set(dayKey, current);
  }

  const extractedTimeSlots = Array.from(
    new Set(
      dto.horarios
        .map((item) => item.hora_inicio ?? null)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  ).sort(compareHora);

  const timeSlots = extractedTimeSlots.length > 0 ? extractedTimeSlots : DEFAULT_TIME_SLOTS;

  return timeSlots.map((horaInicio) => {
    const cells = [horaInicio];

    for (let dayIndex = 0; dayIndex < DIAS.length; dayIndex += 1) {
      const items = (groupedByDay.get(dayIndex) ?? []).filter((item) => item.hora_inicio === horaInicio);
      const text = items.map(getCellText).join('\n\n');
      cells.push(text || ' ');
    }

    return { cells };
  });
}

export function drawScheduleTable(doc: InstanceType<typeof PDFDocument>, dto: DocenteHorarioPdfDto): void {
  const pageWidth = doc.page.width - Spacing.PAGE_MARGIN * 2;
  const columns = [
    { width: pageWidth * 0.11, header: 'Hora', align: 'center' as const },
    { width: pageWidth * 0.14, header: 'LU', align: 'center' as const },
    { width: pageWidth * 0.14, header: 'MA', align: 'center' as const },
    { width: pageWidth * 0.14, header: 'MI', align: 'center' as const },
    { width: pageWidth * 0.14, header: 'JU', align: 'center' as const },
    { width: pageWidth * 0.14, header: 'VI', align: 'center' as const },
    { width: pageWidth * 0.12, header: 'SA', align: 'center' as const },
  ];

  const rows = buildRows(dto);

  doc
    .fillColor(Colors.PRIMARY)
    .font('Helvetica-Bold')
    .fontSize(FontSizes.MD)
    .text('Horario semanal', { underline: true })
    .moveDown(Spacing.SM);

  const tableY = doc.y;
  ReportLayout.drawTable(doc, {
    x: Spacing.PAGE_MARGIN,
    y: tableY,
    columns,
    rows,
    headerFill: Colors.PRIMARY,
    headerTextColor: Colors.WHITE,
    borderColor: Colors.BORDER,
    headerHeight: 18,
    rowHeight: 44,
    paddingX: 3,
    paddingY: 2,
  });
}
