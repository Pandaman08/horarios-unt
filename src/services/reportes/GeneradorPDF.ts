import puppeteer from 'puppeteer';

export class GeneradorPDF {
  static async generarDesdeHTML(html: string, landscape: boolean = false): Promise<Buffer> {
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      const pdf = await page.pdf({
        format: 'A4',
        landscape: landscape,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });

      await browser.close();
      return Buffer.from(pdf);
    } catch (error: any) {
      if (browser) await browser.close();
      throw error;
    }
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
