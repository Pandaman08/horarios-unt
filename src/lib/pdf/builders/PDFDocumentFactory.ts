import PDFDocument from 'pdfkit';
import { Spacing } from '../styles';

export interface PDFDocumentFactoryOptions {
  landscape?: boolean;
  margin?: number;
}

export class PDFDocumentFactory {
  static create(options: PDFDocumentFactoryOptions = {}): InstanceType<typeof PDFDocument> {
    const { landscape = false, margin = Spacing.PAGE_MARGIN } = options;

    return new PDFDocument({
      margin,
      size: 'A4',
      layout: landscape ? 'landscape' : 'portrait',
    });
  }
}
