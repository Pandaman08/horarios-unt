import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class GeneradorPDF {
  static async generarDesdeHTML(html: string, landscape: boolean = false): Promise<Buffer> {
    // Intento de renderizado con puppeteer-core y @sparticuz/chromium
    try {
      console.log('[GeneradorPDF] Iniciando generación de PDF...');
      const isVercel = process.env.VERCEL === '1';
      console.log('[GeneradorPDF] Entorno:', { isVercel, NODE_ENV: process.env.NODE_ENV });

      let browser;
      if (isVercel) {
        console.log('[GeneradorPDF] Entorno: Vercel - usando @sparticuz/chromium.launch()');
        // Importar módulos dinámicamente para Vercel
        const chromiumModule = await import('@sparticuz/chromium');
        const chromium = chromiumModule.default || chromiumModule;
        const puppeteerModule = await import('puppeteer-core');
        const puppeteer = puppeteerModule.default || puppeteerModule;
        
        browser = await puppeteer.launch({
          args: [
            ...chromium.args,
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-zygote",
            "--no-first-run",
            "--disable-extensions",
            "--disable-background-networking",
            "--disable-default-apps",
            "--disable-sync",
            "--disable-translate",
            "--disable-blink-features=AutomationControlled"
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });
      } else {
        console.log('[GeneradorPDF] Entorno: Local - buscando Chrome/Edge');
        // Importar módulos dinámicamente para entorno local
        const puppeteerModule = await import('puppeteer-core');
        const puppeteer = puppeteerModule.default || puppeteerModule;
        
        // Buscar Chrome/Edge local
        const fs = await import('fs');
        const platform = process.platform;
        let executablePath: string | null = null;
        
        const candidates: string[] = [];
        if (platform === 'win32') {
          candidates.push(
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
          );
        } else if (platform === 'darwin') {
          candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
        } else {
          candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium');
        }
        
        for (const p of candidates) {
          try {
            if (fs.existsSync(p)) {
              executablePath = p;
              break;
            }
          } catch (_) {}
        }
        
        if (!executablePath) {
          throw new Error('No se encontró Chrome/Edge local');
        }
        
        browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          executablePath,
          headless: true,
        });
      }

      console.log('[GeneradorPDF] Navegador lanzado');

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 900 });
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });

      const pdf = await page.pdf({
        format: 'A4',
        landscape,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
      });

      await browser.close();
      console.log('[GeneradorPDF] PDF generado con éxito, bytes:', pdf.length);
      return Buffer.from(pdf);
    } catch (error) {
      console.error('[GeneradorPDF] Error al generar PDF con puppeteer:', error);
      // Usar fallback mejorado con pdfmake
      return this.generarDesdeHTMLFallback(html, landscape);
    }
  }

  private static parseHTMLToPDFMakeContent(html: string): any[] {
    const content: any[] = [];
    
    // Extraer título del reporte
    const titleMatch = html.match(/<h2[^>]*class="[^"]*report-title[^"]*"[^>]*>([^<]*)<\/h2>/i);
    if (titleMatch) {
      content.push({
        text: titleMatch[1].trim(),
        style: 'header',
        margin: [0, 0, 0, 20]
      });
    }

    // Extraer todas las tablas
    const tableRegex = /<table[\s\S]*?<\/table>/gi;
    let tableMatch: RegExpExecArray | null;
    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tableMatch[0];
      const tableContent = this.parseTable(tableHtml);
      if (tableContent) {
        content.push(tableContent);
      }
    }

    // Si no hay tablas, extraer texto plano
    if (content.length === 0) {
      const textContent = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      
      content.push({
        text: textContent,
        style: 'normalText'
      });
    }

    return content;
  }

  private static parseTable(tableHtml: string): any {
    const rows: string[][] = [];
    const rowRegex = /<tr[\s\S]*?>[\s\S]*?<\/tr>/gi;
    const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/gi;
    
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[0];
      const cells: string[] = [];
      let cellMatch: RegExpExecArray | null;
      
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        let cellText = cellMatch[2]
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        cells.push(cellText);
      }
      
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) return null;

    return {
      table: {
        headerRows: 1,
        widths: Array(rows[0].length).fill('*'),
        body: rows.map((row, index) => 
          row.map(cell => ({
            text: cell,
            style: index === 0 ? 'tableHeader' : 'tableCell'
          }))
        )
      },
      layout: {
        fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb'
      },
      margin: [0, 10, 0, 20]
    };
  }

  static async generarDesdeHTMLFallback(html: string, landscape: boolean = false): Promise<Buffer> {
    console.warn('[GeneradorPDF] Usando fallback PDF con pdfmake');

    return new Promise((resolve, reject) => {
      try {
        // Importar pdfmake dinámicamente para evitar conflictos
        const pdfMake = require('pdfmake');
        
        const fonts = {
          Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
          }
        };

        pdfMake.setFonts(fonts);
        
        const docDefinition = {
          pageSize: 'A4',
          pageOrientation: landscape ? 'landscape' : 'portrait',
          pageMargins: [40, 60, 40, 60],
          
          header: {
            columns: [
              {
                stack: [
                  { text: 'SGH UNT', style: 'logoText' },
                  { text: 'Gestión de Horarios Académicos', style: 'systemInfo' }
                ],
                alignment: 'left'
              },
              {
                stack: [
                  { text: 'Universidad Nacional de Trujillo', style: 'institutionTitle' },
                  { text: 'Escuela de Ingeniería de Sistemas', style: 'institutionSubtitle' },
                  { text: new Date().toLocaleString('es-PE'), style: 'dateText' }
                ],
                alignment: 'right'
              }
            ],
            margin: [40, 20, 40, 10]
          },
          
          footer: (currentPage: number, pageCount: number) => ({
            columns: [
              { text: `© ${new Date().getFullYear()} Sistema de Gestión de Horarios UNT`, style: 'footerText' },
              { text: `Página ${currentPage} de ${pageCount}`, style: 'footerText', alignment: 'right' }
            ],
            margin: [40, 10, 40, 10]
          }),
          
          content: this.parseHTMLToPDFMakeContent(html),
          
          styles: {
            header: {
              fontSize: 20,
              bold: true,
              color: '#0f172a'
            },
            normalText: {
              fontSize: 12,
              color: '#1e293b',
              lineHeight: 1.5
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              color: '#475569',
              margin: [4, 6, 4, 6]
            },
            tableCell: {
              fontSize: 11,
              color: '#1e293b',
              margin: [4, 6, 4, 6]
            },
            logoText: {
              fontSize: 18,
              bold: true,
              color: '#003366'
            },
            systemInfo: {
              fontSize: 10,
              color: '#64748b',
              marginTop: 2
            },
            institutionTitle: {
              fontSize: 12,
              bold: true,
              color: '#0f172a'
            },
            institutionSubtitle: {
              fontSize: 10,
              color: '#64748b',
              marginTop: 2
            },
            dateText: {
              fontSize: 9,
              color: '#94a3b8',
              marginTop: 6
            },
            footerText: {
              fontSize: 9,
              color: '#94a3b8'
            }
          }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);
        const chunks: Buffer[] = [];

        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log('[GeneradorPDF] PDF generado exitosamente (fallback), tamaño:', pdfBuffer.length, 'bytes');
          resolve(pdfBuffer);
        });
        pdfDoc.on('error', (err: Error) => {
          console.error('[GeneradorPDF] Error en pdfmake:', err);
          resolve(this.generarPDFMinimalista());
        });

        pdfDoc.end();
      } catch (error) {
        console.error('[GeneradorPDF] Error generando PDF en fallback:', error);
        resolve(this.generarPDFMinimalista());
      }
    });
  }

  static async generarPDFMinimalista(): Promise<Buffer> {
    const pdfContent = `%PDF-1.4
%Usuarios de prueba
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length 1200 >>
stream
BT
/F2 16 Tf
50 750 Td
(Usuarios de prueba - SGH UNT) Tj
0 -30 Td
/F1 10 Tf
(Se incluyen todos los usuarios registrados en el sistema) Tj
0 -25 Td
(El PDF esta disponible desde el servidor. Si ves este mensaje,) Tj
0 -12 Td
(el navegador de renderizado no esta disponible en tu entorno.) Tj
0 -12 Td
(Para ver los usuarios, accede directamente desde el login.) Tj
0 -30 Td
/F2 11 Tf
(Por favor, contacta a administracion si necesitas una copia impresa.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f 
0000000015 00000 n 
0000000074 00000 n 
0000000133 00000 n 
0000000262 00000 n 
0000001514 00000 n 
0000001592 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
1671
%%EOF
`;
    return Buffer.from(pdfContent);
  }

  static wrapLayout(content: string, title: string, minimal: boolean = false): string {
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
              padding: 0;
              color: #1e293b;
              line-height: 1.5;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e2e8f0;
            }

            .logo-container {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .logo-box {
              background: #003366;
              color: white;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              font-weight: 800;
              font-size: 20px;
            }

            .system-info p {
              margin: 0;
              font-size: 12px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .institution-info {
              text-align: right;
            }

            .institution-info h1 {
              margin: 0;
              font-size: 16px;
              color: #0f172a;
              font-weight: 800;
            }

            .institution-info p {
              margin: 4px 0 0 0;
              font-size: 12px;
              color: #64748b;
              font-weight: 500;
            }

            .report-title {
              font-size: 28px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 25px;
              letter-spacing: -0.02em;
            }

            .highlight-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 24px;
              margin-bottom: 24px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }

            .print-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-top: 10px;
            }

            .print-table th {
              background: #f8fafc;
              padding: 12px 16px;
              text-align: left;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              border-bottom: 2px solid #e2e8f0;
            }

            .print-table td {
              padding: 14px 16px;
              font-size: 13px;
              border-bottom: 1px solid #f1f5f9;
              vertical-align: middle;
            }

            .print-table tr:last-child td {
              border-bottom: none;
            }

            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
            }

            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #94a3b8;
              font-weight: 500;
            }

            @media print {
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              <div class="logo-box">U</div>
              <div class="system-info">
                <p>Gestión de Horarios Académicos</p>
              </div>
            </div>
            <div class="institution-info">
              <h1>Universidad Nacional de Trujillo</h1>
              <p>Escuela de Ingeniería de Sistemas</p>
              <p style="font-size: 10px; color: #94a3b8; margin-top: 8px;">${new Date().toLocaleString('es-PE')}</p>
            </div>
          </div>
          <h2 class="report-title">${title}</h2>
          ${content}
          <div class="footer">
            <span>© ${new Date().getFullYear()} Sistema de Gestión de Horarios UNT</span>
            <span>Documento generado automáticamente</span>
          </div>
        </body>
      </html>
    `;
  }
}
