import PDFDocument from 'pdfkit';
import { Colors, FontSizes, Spacing } from '../layout';
import type { DocenteHorarioPdfDto } from '../types/docenteHorario';

function drawLine(doc: InstanceType<typeof PDFDocument>, x: number, y: number, label: string, value: string): void {
  doc
    .fillColor(Colors.TEXT)
    .font('Helvetica-Bold')
    .fontSize(FontSizes.SM)
    .text(label, x, y, { width: 120, align: 'left' })
    .fillColor(Colors.TEXT)
    .font('Helvetica')
    .fontSize(FontSizes.SM)
    .text(value, x + 128, y, { width: 340, align: 'left' });
}

export function drawMetadata(doc: InstanceType<typeof PDFDocument>, dto: DocenteHorarioPdfDto): void {
  const { docente, periodo, escuela, resumen } = dto;
  const periodoLabel = periodo.nombre ?? `${periodo.anio ?? ''} ${periodo.semestre ?? ''}`.trim();
  const boxX = 40;
  const boxY = doc.y;
  const boxWidth = doc.page.width - 80;
  const boxHeight = 84;

  doc
    .fillColor(Colors.BACKGROUND)
    .rect(boxX, boxY, boxWidth, boxHeight)
    .fill()
    .strokeColor(Colors.BORDER)
    .stroke();

  doc
    .fillColor(Colors.PRIMARY)
    .font('Helvetica-Bold')
    .fontSize(FontSizes.MD)
    .text('Datos del docente', boxX + 12, boxY + 10, { align: 'left' });

  drawLine(doc, boxX + 12, boxY + 34, 'Docente:', `${docente.nombres} ${docente.apellidos}`);
  drawLine(doc, boxX + 12, boxY + 54, 'Código:', docente.codigo_docente ?? '—');
  drawLine(doc, boxX + 12, boxY + 74, 'Escuela:', escuela?.nombre ?? '—');

  drawLine(doc, boxX + 360, boxY + 34, 'Periodo:', periodoLabel || '—');
  drawLine(doc, boxX + 360, boxY + 54, 'Clases:', `${resumen.totalClases}`);
  drawLine(doc, boxX + 360, boxY + 74, 'Horas:', `${resumen.totalHoras}`);

  doc.moveDown(Spacing.SM);
}
