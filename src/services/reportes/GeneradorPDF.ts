import puppeteer from 'puppeteer';

export class GeneradorPDF {
  static async generarDesdeHTML(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar el contenido y esperar a que cargue
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 5px; margin: 0 15mm;">
          Universidad Nacional de Trujillo - Escuela de Ingeniería de Sistemas
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; border-top: 1px solid #eee; padding-top: 5px; margin: 0 15mm;">
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      `
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  static wrapLayout(content: string, title: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; }
            .print-table th, .print-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            .print-table th { background-color: #f8fafc; font-weight: bold; font-size: 12px; }
            .print-table td { font-size: 11px; }
          </style>
        </head>
        <body className="p-4">
          <div className="flex justify-between items-center mb-8 border-b-2 border-indigo-900 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-indigo-900">${title}</h1>
              <p className="text-gray-500 text-sm">Sistema de Gestión de Horarios UNT</p>
            </div>
            <div className="text-right">
              <p className="font-bold">UNT - Ingeniería de Sistemas</p>
              <p className="text-xs text-gray-500">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          ${content}
        </body>
      </html>
    `;
  }
}
