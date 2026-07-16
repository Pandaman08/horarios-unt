import PDFDocument from 'pdfkit';
import { Spacing } from '../layout/Spacing';

export interface PdfDocumentOptions {
  landscape?: boolean;
  margin?: number;
}

export class PdfDocument {
  static create(options: PdfDocumentOptions = {}): InstanceType<typeof PDFDocument> {
    const { landscape = false, margin = Spacing.PAGE_MARGIN } = options;

    return new PDFDocument({
      size: 'A4',
      layout: landscape ? 'landscape' : 'portrait',
      margin,
    });
  }

  static async toBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
