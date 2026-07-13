import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export class GeneradorPDF {
  static async generarDesdeHTML(html: string, landscape: boolean = false): Promise<Buffer> {
    let browser;

    try {
      // Intentar con Chromium empaquetado primero
      const executablePath = await chromium.executablePath();
      console.log('[GeneradorPDF] Usando Chromium:', executablePath);
      
      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: chromium.args,
      });

      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const pdf = await page.pdf({
        format: 'A4',
        landscape: landscape,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await browser.close();
      return Buffer.from(pdf);
    } catch (error: any) {
      if (browser) await browser.close();
      console.error('[GeneradorPDF] Error con Chromium:', error.message);
      
      // Intentar con navegadores nativos de Windows
      try {
        console.log('[GeneradorPDF] Intentando con navegador nativo de Windows...');
        const executablePaths: string[] = [];
        const edgePath = String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`;
        const edgePath86 = String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
        const chromePath = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`;
        const chromePath86 = String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`;
        executablePaths.push(edgePath, edgePath86, chromePath, chromePath86);

        for (const exePath of executablePaths) {
          try {
            browser = await puppeteer.launch({
              headless: true,
              executablePath: exePath,
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            const page = await browser.newPage();
            await page.setContent(html, {
              waitUntil: 'domcontentloaded',
              timeout: 60000,
            });

            const pdf = await page.pdf({
              format: 'A4',
              landscape: landscape,
              printBackground: true,
              margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm',
              },
            });

            await browser.close();
            console.log('[GeneradorPDF] PDF generado exitosamente con navegador nativo');
            return Buffer.from(pdf);
          } catch (browserError) {
            console.log(`[GeneradorPDF] No se pudo usar ${exePath}:`, (browserError as Error).message);
            if (browser) await browser.close();
          }
        }

        throw new Error('No se encontraron navegadores disponibles');
      } catch (fallbackError) {
        console.error('[GeneradorPDF] Error en fallback de navegadores:', (fallbackError as Error).message);
        return this.generarDesdeHTMLFallback(html, landscape);
      }
    }
  }

  static async generarDesdeHTMLFallback(html: string, landscape: boolean = false): Promise<Buffer> {
    console.warn('[GeneradorPDF] Usando fallback PDF (navegador no disponible)');

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
