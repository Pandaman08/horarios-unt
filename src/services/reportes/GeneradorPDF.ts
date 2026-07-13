import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class GeneradorPDF {
  static async generarDesdeHTML(html: string, landscape: boolean = false): Promise<Buffer> {
    // Intento de renderizado con puppeteer / puppeteer-core (import dinámico para evitar bundling en cliente)
    try {
      console.log('[GeneradorPDF] Intentando render con puppeteer-core/puppeteer...');

      const fs = await import('fs');

      const getLocalExecutable = () => {
        const envPath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
        if (envPath && (fs as any).existsSync(envPath)) return envPath;
        const platform = process.platform;
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
          candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/snap/bin/chromium');
        }
        for (const p of candidates) {
          try { if ((fs as any).existsSync(p)) return p; } catch (_) {}
        }
        return null;
      };

      const execPath = getLocalExecutable();
      console.log('[GeneradorPDF] Entorno de PDF:', {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        CHROME_PATH: process.env.CHROME_PATH,
        PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
        CHROME_BIN: process.env.CHROME_BIN,
        platform: process.platform,
        execPath,
      });

      let puppeteerModule: any = null;
      let puppeteerPackage = 'none';
      try {
        // @ts-ignore
        puppeteerModule = await import('puppeteer-core');
        puppeteerPackage = 'puppeteer-core';
      } catch (puppeteerCoreErr) {
        console.warn('[GeneradorPDF] No se pudo importar puppeteer-core:', (puppeteerCoreErr as any)?.message ?? puppeteerCoreErr);
        try {
          // @ts-ignore
          puppeteerModule = await import('puppeteer');
          puppeteerPackage = 'puppeteer';
        } catch (puppeteerErr) {
          console.warn('[GeneradorPDF] No se pudo importar puppeteer:', (puppeteerErr as any)?.message ?? puppeteerErr);
          puppeteerModule = null;
        }
      }

      console.log('[GeneradorPDF] Módulo importado de navegador:', puppeteerPackage);
      const puppeteer = puppeteerModule ? (puppeteerModule.default ?? puppeteerModule) : null;
      if (puppeteer) {
        let browser: any;
        try {
          const launchOpts: any = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
          };

          if (execPath) {
            launchOpts.executablePath = execPath;
          } else {
            try {
              const chromiumImport = await import('@sparticuz/chromium');
              const chromiumModule = chromiumImport.default ?? chromiumImport;
              const chromiumExec = await chromiumModule.executablePath();
              const chromiumArgs = Array.isArray(chromiumModule.args)
                ? chromiumModule.args
                : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'];
              launchOpts.executablePath = chromiumExec;
              launchOpts.args = chromiumArgs;
              console.log('[GeneradorPDF] Usando Chromium de @sparticuz/chromium', { chromiumExec, chromiumArgs });
            } catch (chromiumErr) {
              console.warn('[GeneradorPDF] No se pudo cargar @sparticuz/chromium:', (chromiumErr as any)?.message ?? chromiumErr);
            }
          }

          console.log('[GeneradorPDF] Puppeteer launch options:', {
            package: puppeteerPackage,
            executablePath: launchOpts.executablePath,
            args: launchOpts.args,
          });

          browser = await puppeteer.launch(launchOpts);

          const browserVersion = typeof browser.version === 'function' ? await browser.version() : 'unknown';
          console.log('[GeneradorPDF] Navegador lanzado con versión:', browserVersion);

          const page = await browser.newPage();
          await page.setViewport({ width: 1200, height: 900 });
          await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

          const pdf = await page.pdf({ format: 'A4', landscape: landscape, printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });

          try { await browser.close(); } catch (_) {}
          console.log('[GeneradorPDF] PDF renderizado con puppeteer, bytes:', pdf.length);
          return Buffer.from(pdf);
        } catch (err: any) {
          console.warn('[GeneradorPDF] puppeteer falló al generar PDF:', err?.message ?? err, { stack: err?.stack });
          try { if (browser) await browser.close(); } catch (_) {}
        }
      } else {
        console.log('[GeneradorPDF] puppeteer / puppeteer-core no disponibles, usando fallback interno.');
      }
    } catch (puppErr) {
      console.warn('[GeneradorPDF] Error al intentar usar puppeteer dinámico:', (puppErr as any)?.message ?? puppErr);
    }

    // Si llegamos aquí, usamos la implementación con pdf-lib (fallback)
    try {
      console.log('[GeneradorPDF] Generando PDF desde HTML (fallback pdf-lib)...');

      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageSize: [number, number] = landscape ? [792, 612] : [612, 792];
      let page = pdfDoc.addPage(pageSize);
      let { width, height } = page.getSize();

      const margin = 40;
      let x = margin;
      let y = height - margin;
      const usableWidth = width - margin * 2;

      // Encabezado simple
      page.drawText('Reporte - SGH UNT', { x: x, y: y, size: 14, font: helveticaBold, color: rgb(0, 0, 0) });
      y -= 24;

      // Si el HTML contiene una tabla, intentamos parsearla y dibujarla
      const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
      if (tableMatch) {
        const tableHtml = tableMatch[0];

        // Extraer filas
        const rowRegex = /<tr[\s\S]*?>[\s\S]*?<\/tr>/gi;
        const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;

        const rows: string[][] = [];
        let rowMatch: RegExpExecArray | null;
        while ((rowMatch = rowRegex.exec(tableHtml))) {
          const rowHtml = rowMatch[0];
          const cells: string[] = [];
          let cellMatch: RegExpExecArray | null;
          while ((cellMatch = cellRegex.exec(rowHtml))) {
            let cellText = cellMatch[1]
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
          if (cells.length) rows.push(cells);
        }

        if (rows.length) {
          // Calcular número máximo de columnas
          const colCount = rows.reduce((max, r) => Math.max(max, r.length), 0);

          // Calcular ancho de cada columna según el contenido (medido en puntos)
          const colWidths: number[] = new Array(colCount).fill(0);
          const fontSize = 10;
          for (const r of rows) {
            for (let ci = 0; ci < colCount; ci++) {
              const text = r[ci] ?? '';
              const w = helvetica.widthOfTextAtSize(text, fontSize) + 8; // padding
              if (w > colWidths[ci]) colWidths[ci] = w;
            }
          }

          // Ajustar anchos para que quepan en la página
          const totalWidth = colWidths.reduce((a, b) => a + b, 0) || usableWidth;
          if (totalWidth > usableWidth) {
            const scale = usableWidth / totalWidth;
            for (let i = 0; i < colWidths.length; i++) colWidths[i] *= scale;
          }

          const rowHeight = 18;

          // Dibujar filas
          for (let ri = 0; ri < rows.length; ri++) {
            const row = rows[ri];

            // Salto de página si es necesario
            if (y - rowHeight < margin) {
              page = pdfDoc.addPage(pageSize);
              ({ width, height } = page.getSize());
              x = margin;
              y = height - margin;
            }

            // Dibujar celdas
            let cellX = x;
            for (let ci = 0; ci < colCount; ci++) {
              const cw = colWidths[ci] || 50;
              const text = row[ci] ?? '';

              // Estilo para encabezado (primera fila)
              const isHeader = ri === 0;
              const font = isHeader ? helveticaBold : helvetica;
              const fontColor = isHeader ? rgb(0, 0, 0) : rgb(0.1, 0.1, 0.1);

              // Texto con wrap sencillo
              const words = text.split(' ');
              let line = '';
              let lineY = y;
              for (const word of words) {
                const test = line ? `${line} ${word}` : word;
                const testW = font.widthOfTextAtSize(test, fontSize);
                if (testW + 8 > cw && line) {
                  page.drawText(line, { x: cellX + 4, y: lineY - 12, size: fontSize, font, color: fontColor });
                  line = word;
                  lineY -= 12;
                } else {
                  line = test;
                }
              }
              if (line) {
                page.drawText(line, { x: cellX + 4, y: lineY - 12, size: fontSize, font, color: fontColor });
              }

              // Borde inferior simple
              page.drawLine({ start: { x: cellX, y: y - rowHeight }, end: { x: cellX + cw, y: y - rowHeight }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });

              cellX += cw;
            }

            y -= rowHeight + 6; // espacio entre filas
          }
        }
      } else {
        // Si no hay tablas, se mantiene un renderizado plano de texto (preview)
        const textContent = html
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();

        const words = textContent.split(' ');
        const fontSize = 10;
        let line = '';
        for (const word of words.slice(0, 300)) {
          const test = line ? `${line} ${word}` : word;
          const testW = helvetica.widthOfTextAtSize(test, fontSize);
          if (testW > usableWidth) {
            if (y - 14 < margin) {
              page = pdfDoc.addPage(pageSize);
              ({ width, height } = page.getSize());
              y = height - margin;
            }
            page.drawText(line, { x: x, y: y, size: fontSize, font: helvetica, color: rgb(0.1, 0.1, 0.1) });
            y -= 14;
            line = word;
          } else {
            line = test;
          }
        }
        if (line) page.drawText(line, { x: x, y: y, size: 10, font: helvetica, color: rgb(0.1, 0.1, 0.1) });
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);
      console.log('[GeneradorPDF] PDF generado exitosamente (fallback), tamaño:', pdfBuffer.length, 'bytes');
      return pdfBuffer;
    } catch (error: any) {
      console.error('[GeneradorPDF] Error generando PDF en fallback:', error?.message ?? error);
      return this.generarDesdeHTMLFallback(html, landscape);
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
