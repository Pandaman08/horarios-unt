import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

export class GeneradorPDF {
  static async generarDesdeHTML(
    html: string,
    landscape: boolean = false,
  ): Promise<Buffer> {
    try {
      console.log('[GeneradorPDF] Iniciando generación de PDF con html-to-pdfmake...');

      // Importar dinámicamente para evitar problemas con Next.js
      const htmlToPdfmakeModule = await import('html-to-pdfmake');
      const htmlToPdfmake = htmlToPdfmakeModule.default || htmlToPdfmakeModule;

      // 1. Convertir HTML a la estructura de pdfmake
      const pdfMakeContent = htmlToPdfmake(html, {
        defaultStyles: {
          p: { fontSize: 12 },
          h1: { fontSize: 24, bold: true, marginBottom: 10 },
          h2: { fontSize: 20, bold: true, marginBottom: 8 },
          table: { margin: [0, 5, 0, 15] },
          th: { bold: true, fillColor: '#f8fafc' },
        },
      });

      // 2. Crear la definición del documento PDF
      const docDefinition: TDocumentDefinitions = {
        pageSize: 'A4',
        pageOrientation: landscape ? 'landscape' : 'portrait',
        content: pdfMakeContent as any,
        defaultStyle: {
          font: 'Helvetica',
        },
      };

      // 3. Importar pdfmake dinámicamente
      const pdfmakeModule = await import('pdfmake');
      const PdfPrinter = pdfmakeModule.default as unknown as new (fonts: any) => any;
      const printer = new PdfPrinter({
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique',
        },
      });

      // 4. Generar el PDF
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      return new Promise<Buffer>((resolve, reject) => {
        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(
            '[GeneradorPDF] PDF generado con éxito, bytes:',
            pdfBuffer.length,
          );
          resolve(pdfBuffer);
        });
        pdfDoc.on('error', reject);
        pdfDoc.end();
      });
    } catch (error) {
      console.error('[GeneradorPDF] Error al generar PDF:', error);
      return this.generarPDFMinimalista();
    }
  }

  static async generarPDFMinimalista(): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('Reporte Generado', {
      x: 50,
      y: 700,
      size: 24,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  static wrapLayout(
    content: string,
    title: string,
    minimal: boolean = false,
  ): string {
    if (minimal) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
              body {
                font-family: 'Inter', -apple-system, sans-serif;
                margin: 0;
                padding: 0;
                color: #000;
                background: white;
              }
              @media print {
                .page-break { page-break-after: always; }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              color: #1e293b;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }
}
