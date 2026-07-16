import PDFDocument from 'pdfkit';
import { Colors, FontSizes, Spacing } from '../styles';

type PDFDocumentInstance = InstanceType<typeof PDFDocument>;

type TableAlign = 'left' | 'center' | 'right';

export interface ReportHeaderOptions {
  title: string;
  subtitle?: string;
  periodLabel?: string;
  generatedAt?: Date;
}

export interface TableColumnSpec {
  width: number;
  header: string;
  align?: TableAlign;
  headerAlign?: TableAlign;
  headerFontSize?: number;
  bodyFontSize?: number;
  headerFill?: string;
  bodyFill?: string;
  textColor?: string;
  borderColor?: string;
  boldHeader?: boolean;
  boldBody?: boolean;
}

export interface TableRowSpec {
  cells: string[];
  height?: number;
  fill?: string;
  textColor?: string;
  bold?: boolean[];
}

export interface DrawTableOptions {
  x: number;
  y: number;
  columns: TableColumnSpec[];
  rows: TableRowSpec[];
  borderColor?: string;
  headerFill?: string;
  headerTextColor?: string;
  headerHeight?: number;
  rowHeight?: number;
  paddingX?: number;
  paddingY?: number;
}

export class ReportLayout {
  static drawHeader(doc: PDFDocumentInstance, options: ReportHeaderOptions): void {
    const { title, subtitle, periodLabel, generatedAt = new Date() } = options;

    doc
      .fillColor(Colors.PRIMARY)
      .font('Helvetica-Bold')
      .fontSize(FontSizes.H1)
      .text('UNIVERSIDAD NACIONAL DE TRUJILLO', {
        align: 'center',
      })
      .fillColor(Colors.TEXT)
      .fontSize(FontSizes.H2)
      .text('FACULTAD DE INGENIERÍA', {
        align: 'center',
      })
      .fontSize(FontSizes.H3)
      .text('ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS', {
        align: 'center',
      })
      .moveDown(Spacing.SM);

    doc
      .fillColor(Colors.WHITE)
      .rect(Spacing.PAGE_MARGIN, doc.y, doc.page.width - Spacing.PAGE_MARGIN * 2, 32)
      .fill(Colors.PRIMARY)
      .text(title, {
        align: 'center',
        baseline: 'middle',
        width: doc.page.width - Spacing.PAGE_MARGIN * 2,
      })
      .fillColor(Colors.TEXT)
      .moveDown(Spacing.SM);

    if (subtitle) {
      doc
        .fontSize(FontSizes.SM)
        .fillColor(Colors.TEXT_LIGHT)
        .text(subtitle, { align: 'left' });
    }

    if (periodLabel) {
      doc
        .fontSize(FontSizes.SM)
        .fillColor(Colors.TEXT_LIGHT)
        .text(`Periodo: ${periodLabel}`, { align: 'right' });
    }

    doc
      .fontSize(FontSizes.SM)
      .fillColor(Colors.TEXT_LIGHT)
      .text(`Generado el ${generatedAt.toLocaleString('es-PE')}`, { align: 'right' })
      .moveDown(Spacing.MD);
  }

  static drawSectionTitle(doc: PDFDocumentInstance, title: string): void {
    doc
      .fillColor(Colors.PRIMARY)
      .font('Helvetica-Bold')
      .fontSize(FontSizes.XXL)
      .text(title)
      .moveDown(Spacing.SM);
  }

  static drawFooter(doc: PDFDocumentInstance, note: string): void {
    const bottomY = doc.page.height - Spacing.PAGE_MARGIN;
    doc
      .fillColor(Colors.TEXT_LIGHT)
      .font('Helvetica')
      .fontSize(FontSizes.SM)
      .text(note, 40, bottomY, {
        align: 'right',
      });
  }

  static drawCell(doc: PDFDocumentInstance, options: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    align?: TableAlign;
    font?: string;
    fontSize?: number;
    color?: string;
    fill?: string;
    borderColor?: string;
    bold?: boolean;
    paddingX?: number;
    paddingY?: number;
  }): void {
    const {
      x,
      y,
      width,
      height,
      text,
      align = 'left',
      font = 'Helvetica',
      fontSize = FontSizes.XS,
      color = Colors.TEXT,
      fill = Colors.WHITE,
      borderColor = Colors.BORDER,
      bold = false,
      paddingX = 4,
      paddingY = 4,
    } = options;

    const innerWidth = Math.max(width - paddingX * 2, 8);
    const innerHeight = Math.max(height - paddingY * 2, 8);

    doc
      .rect(x, y, width, height)
      .fillColor(fill)
      .fill()
      .strokeColor(borderColor)
      .stroke();

    let currentFontSize = fontSize;
    const normalizedText = text.replace(/\r\n/g, '\n');
    doc.font(font).fontSize(currentFontSize).fillColor(color);

    while (currentFontSize >= 6) {
      const measuredHeight = doc.heightOfString(normalizedText, {
        width: innerWidth,
        align,
        lineGap: 1,
      });

      if (measuredHeight <= innerHeight) {
        break;
      }

      currentFontSize -= 1;
      doc.fontSize(currentFontSize);
    }

    doc.text(normalizedText, x + paddingX, y + paddingY, {
      width: innerWidth,
      height: innerHeight,
      align,
      lineGap: 1,
      ellipsis: false,
    });
  }

  static drawRow(doc: PDFDocumentInstance, options: {
    x: number;
    y: number;
    columns: TableColumnSpec[];
    row: TableRowSpec;
    borderColor?: string;
    rowHeight?: number;
    paddingX?: number;
    paddingY?: number;
  }): void {
    const {
      x,
      y,
      columns,
      row,
      borderColor = Colors.BORDER,
      rowHeight = 18,
      paddingX = 4,
      paddingY = 4,
    } = options;

    let currentX = x;
    const height = row.height ?? rowHeight;

    columns.forEach((column, index) => {
      const text = row.cells[index] ?? '';
      const bodyFontSize = column.bodyFontSize ?? FontSizes.XS;
      const fill = column.bodyFill ?? row.fill ?? Colors.WHITE;
      const textColor = column.textColor ?? row.textColor ?? Colors.TEXT;
      const isBold = row.bold?.[index] ?? column.boldBody ?? false;
      const align = column.align ?? 'left';

      this.drawCell(doc, {
        x: currentX,
        y,
        width: column.width,
        height,
        text,
        align,
        font: 'Helvetica',
        fontSize: bodyFontSize,
        color: textColor,
        fill,
        borderColor,
        bold: isBold,
        paddingX,
        paddingY,
      });

      currentX += column.width;
    });
  }

  static drawTable(doc: PDFDocumentInstance, options: DrawTableOptions): number {
    const {
      x,
      y,
      columns,
      rows,
      borderColor = Colors.BORDER,
      headerFill = '#f1f5f9',
      headerTextColor = Colors.TEXT,
      headerHeight = 20,
      rowHeight = 18,
      paddingX = 4,
      paddingY = 4,
    } = options;

    const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);
    let currentX = x;

    columns.forEach((column, index) => {
      const headerAlign = column.headerAlign ?? column.align ?? 'center';
      this.drawCell(doc, {
        x: currentX,
        y,
        width: column.width,
        height: headerHeight,
        text: column.header,
        align: headerAlign,
        font: 'Helvetica-Bold',
        fontSize: column.headerFontSize ?? FontSizes.XS,
        color: headerTextColor,
        fill: column.headerFill ?? headerFill,
        borderColor,
        bold: column.boldHeader ?? true,
        paddingX,
        paddingY,
      });

      currentX += column.width;
    });

    let currentY = y + headerHeight;
    rows.forEach((row) => {
      this.drawRow(doc, {
        x,
        y: currentY,
        columns,
        row,
        borderColor,
        rowHeight: row.height ?? rowHeight,
        paddingX,
        paddingY,
      });
      currentY += row.height ?? rowHeight;
    });

    return totalWidth;
  }
}
