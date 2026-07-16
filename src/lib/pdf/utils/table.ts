import PDFDocument from 'pdfkit';
import { Colors, Spacing, FontSizes } from '../styles';

export interface TableCell {
  text: string;
  align?: 'left' | 'center' | 'right';
  fill?: string;
  textColor?: string;
  bold?: boolean;
  fontSize?: number;
}

export interface TableColumn {
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableOptions {
  x: number;
  y: number;
  columns: TableColumn[];
  rows: TableCell[][];
  header?: TableCell[];
  columnSpacing?: number;
  rowHeight?: number;
  borderColor?: string;
  borderWidth?: number;
  headerFill?: string;
  headerTextColor?: string;
}

export const drawTable = (doc: PDFKit.PDFDocument, options: TableOptions): { endY: number } => {
  const {
    x,
    y,
    columns,
    rows,
    header,
    columnSpacing = 0,
    rowHeight = 24,
    borderColor = Colors.BORDER,
    borderWidth = 0.5,
    headerFill = Colors.PRIMARY,
    headerTextColor = Colors.WHITE,
  } = options;

  let currentY = y;

  // Dibujar encabezado si existe
  if (header) {
    let currentX = x;
    doc.lineWidth(borderWidth).strokeColor(borderColor);

    // Fondo del encabezado
    doc
      .rect(x, currentY, columns.reduce((sum, col) => sum + col.width, 0), rowHeight)
      .fill(headerFill);

    // Dibujar celdas del encabezado
    for (let i = 0; i < header.length; i++) {
      const cell = header[i];
      const col = columns[i];
      const align = cell.align || col.align || 'left';

      // Texto
      doc
        .fillColor(cell.textColor || headerTextColor)
        .fontSize(cell.fontSize || FontSizes.MD)
        .font('Helvetica-Bold');

      drawTextInCell(doc, cell.text, currentX, currentY, col.width, rowHeight, align);

      // Borde
      doc
        .rect(currentX, currentY, col.width, rowHeight)
        .stroke();

      currentX += col.width;
    }

    currentY += rowHeight;
  }

  // Dibujar filas de datos
  for (const row of rows) {
    let currentX = x;
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      const col = columns[i];
      const align = cell.align || col.align || 'left';

      // Fondo de celda si existe
      if (cell.fill) {
        doc
          .rect(currentX, currentY, col.width, rowHeight)
          .fill(cell.fill);
      }

      // Texto
      doc
        .fillColor(cell.textColor || Colors.TEXT)
        .fontSize(cell.fontSize || FontSizes.MD)
        .font(cell.bold ? 'Helvetica-Bold' : 'Helvetica');

      drawTextInCell(doc, cell.text, currentX, currentY, col.width, rowHeight, align);

      // Borde
      doc
        .rect(currentX, currentY, col.width, rowHeight)
        .stroke();

      currentX += col.width;
    }
    currentY += rowHeight;
  }

  return { endY: currentY };
};

const drawTextInCell = (
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  align: 'left' | 'center' | 'right'
) => {
  const textWidth = doc.widthOfString(text);
  const textHeight = doc.currentLineHeight();

  let textX = x + Spacing.SM;
  const textY = y + (height - textHeight) / 2 + 3;

  if (align === 'center') {
    textX = x + (width - textWidth) / 2;
  } else if (align === 'right') {
    textX = x + width - textWidth - Spacing.SM;
  }

  doc.text(text, textX, textY, { align, width: width - Spacing.MD, lineGap: 0 });
};
