import PDFDocument from 'pdfkit';
import { PageSize, Spacing } from '../styles';

export abstract class PDFBuilder {
  protected doc: PDFKit.PDFDocument;
  protected currentY: number;
  protected readonly pageMargin: number;
  protected pageWidth: number;
  protected pageHeight: number;
  protected contentWidth: number;

  constructor(options?: { landscape?: boolean }) {
    this.doc = new PDFDocument({
      margin: Spacing.PAGE_MARGIN, size: 'A4', layout: options?.landscape ? 'landscape' : 'portrait' });
    this.pageWidth = this.doc.page.width;
    this.pageHeight = this.doc.page.height;
    this.pageMargin = Spacing.PAGE_MARGIN;
    this.contentWidth = this.pageWidth - this.pageMargin * 2;
    this.currentY = this.pageMargin;

    // Registrar eventos para manejar saltos de página automáticos
    this.doc.on('pageAdded', () => {
      this.currentY = this.pageMargin;
    });
  }

  // Método para verificar si hay espacio suficiente en la página
  protected checkPageSpace(neededSpace: number): boolean {
    return this.currentY + neededSpace < this.pageHeight - this.pageMargin;
  }

  // Método para agregar una nueva página
  protected addNewPage() {
    this.doc.addPage();
    this.currentY = this.pageMargin;
  }

  // Método para obtener el documento finalizado como Buffer
  async toBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}
