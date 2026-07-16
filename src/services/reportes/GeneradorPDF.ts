import PDFDocument from 'pdfkit';

type PDFDocumentInstance = InstanceType<typeof PDFDocument>;

export class GeneradorPDF {
  static async toBuffer(doc: PDFDocumentInstance): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }

  static async generarDocumentoBase(): Promise<PDFDocumentInstance> {
    return new PDFDocument({
      size: 'A4',
      margin: 40,
      layout: 'portrait',
    });
  }

  static wrapLayout(bodyHtml: string, _titulo: string, _landscape = false): string {
    return bodyHtml;
  }

  static async generarDesdeHTML(htmlContent: string, landscape = false): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      layout: landscape ? 'landscape' : 'portrait',
    });

    doc.font('Helvetica').fontSize(9).fillColor('#0f172a');

    const text = this.htmlToPlainText(htmlContent);
    const lines = text.split(/\r?\n/).filter(Boolean);
    let cursorY = doc.page.height - 50;

    doc.text('Reporte generado con PDFKit', 40, cursorY, {
      width: doc.page.width - 80,
      align: 'center',
    });
    cursorY -= 18;

    for (const line of lines) {
      if (cursorY < 50) {
        doc.addPage({
          size: 'A4',
          margin: 40,
          layout: landscape ? 'landscape' : 'portrait',
        });
        cursorY = doc.page.height - 50;
      }

      const wrapped = doc.widthOfString(line);
      if (wrapped > doc.page.width - 80) {
        const chunks = this.wrapText(line, doc.page.width - 80);
        for (const chunk of chunks) {
          doc.text(chunk, 40, cursorY, { width: doc.page.width - 80, lineGap: 3 });
          cursorY -= 12;
          if (cursorY < 50) {
            doc.addPage({
              size: 'A4',
              margin: 40,
              layout: landscape ? 'landscape' : 'portrait',
            });
            cursorY = doc.page.height - 50;
          }
        }
        continue;
      }

      doc.text(line, 40, cursorY, { width: doc.page.width - 80, lineGap: 3 });
      cursorY -= 12;
    }

    return this.toBuffer(doc);
  }

  private static isDocenteHorarioHtml(htmlContent: string): boolean {
    return htmlContent.includes('DOCENTE:') && htmlContent.includes('UNIVERSIDAD NACIONAL DE TRUJILLO') && htmlContent.includes('HORA');
  }

  private static htmlToPlainText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/?(div|p|li|tr|td|th|h[1-6]|table|thead|tbody|tfoot|body|html)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/[\t\r]/g, ' ')
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
  }

  private static wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= Math.max(12, Math.floor(maxWidth / 2))) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
    return lines;
  }
}
