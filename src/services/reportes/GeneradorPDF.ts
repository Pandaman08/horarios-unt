import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class GeneradorPDF {
  static async generarDesdeHTML(
    html: string,
    landscape: boolean = false
  ): Promise<Buffer> {
    try {
      console.log('[GeneradorPDF] Iniciando generación de PDF...');
      const isVercel = process.env.VERCEL === '1';
      console.log('[GeneradorPDF] Entorno:', {
        isVercel,
        NODE_ENV: process.env.NODE_ENV,
      });

      let browser;
      if (isVercel) {
        console.log('[GeneradorPDF] Entorno: Vercel - usando @sparticuz/chromium.launch()');
        const chromiumModule = await import('@sparticuz/chromium');
        const puppeteerModule = await import('puppeteer-core');
        const chromium = chromiumModule.default || chromiumModule;
        const puppeteer = puppeteerModule.default || puppeteerModule;

        browser = await puppeteer.launch({
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--no-first-run',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--disable-blink-features=AutomationControlled',
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });
      } else {
        console.log('[GeneradorPDF] Entorno: Local - buscando Chrome/Edge');
        const puppeteerModule = await import('puppeteer-core');
        const puppeteer = puppeteerModule.default || puppeteerModule;
        const fs = await import('fs');
        const platform = process.platform;
        let executablePath: string | null = null;

        const candidates: string[] = [];
        if (platform === 'win32') {
          candidates.push(
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
          );
        } else if (platform === 'darwin') {
          candidates.push(
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          );
        } else {
          candidates.push(
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
          );
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
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
          executablePath,
          headless: true,
        });
      }

      console.log('[GeneradorPDF] Navegador lanzado');

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 900 });
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const pdf = await page.pdf({
        format: 'A4',
        landscape,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      await browser.close();
      console.log('[GeneradorPDF] PDF generado con éxito, bytes:', pdf.length);
      return Buffer.from(pdf);
    } catch (error) {
      console.error('[GeneradorPDF] Error al generar PDF con puppeteer:', error);
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
              padding: 0;
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
