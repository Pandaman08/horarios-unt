import puppeteer from 'puppeteer';

export class GeneradorPDF {
  static async generarDesdeHTML(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar el contenido y esperar a que cargue
    await page.setContent(html, { waitUntil: 'load' });
    
    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '8mm',
        bottom: '15mm',
        left: '8mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: 'Inter', sans-serif; font-size: 9px; width: 100%; text-align: center; color: #94a3b8; padding-bottom: 5px; margin: 0 15mm;">
        </div>
      `,
      footerTemplate: `
        <div style="font-family: 'Inter', sans-serif; font-size: 10px; width: 100%; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 8px; margin: 0 15mm; color: #64748b;">
          <span>Sistema de Gestión de Horarios UNT</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #0f172a; }
            .print-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; table-layout: auto; }
            .print-table th, .print-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .print-table th { background-color: #f8fafc; font-weight: 700; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
            .print-table td { font-size: 12px; color: #334155; }
            .print-table tr:last-child td { border-bottom: none; }
            .print-table tr:nth-child(even) { background-color: #f8fafc/50; }
            .highlight-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); margin-bottom: 10px; }
          </style>
        </head>
        <body class="p-4 w-full mx-auto">
          <div class="flex justify-between items-end mb-10 pb-6 border-b-2 border-indigo-600">
            <div>
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">U</div>
                <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest">Sistema de Horarios</h2>
              </div>
              <h1 class="text-3xl font-black text-slate-900 tracking-tight">${title}</h1>
            </div>
            <div class="text-right">
              <p class="font-bold text-slate-800 text-sm">Universidad Nacional de Trujillo</p>
              <p class="text-xs text-slate-500 font-medium">Escuela de Ingeniería de Sistemas</p>
              <p class="text-xs text-slate-400 mt-2 bg-slate-100 inline-block px-2 py-1 rounded-md font-medium">${new Date().toLocaleDateString('es-PE')} - ${new Date().toLocaleTimeString('es-PE')}</p>
            </div>
          </div>
          ${content}
        </body>
      </html>
    `;
  }
}
