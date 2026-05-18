import puppeteer from 'puppeteer';

export class GeneradorPDF {
  static async generarDesdeHTML(html: string): Promise<Buffer> {
    const start = Date.now();
    console.log(`[PDF_DEBUG] 1. Iniciando proceso de generación... T+${Date.now() - start}ms`);
    let browser;

    try {
      console.log(`[PDF_DEBUG] 2. Intentando lanzar Puppeteer... T+${Date.now() - start}ms`);
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      console.log(`[PDF_DEBUG] 3. Browser lanzado con éxito. T+${Date.now() - start}ms`);

      const page = await browser.newPage();
      console.log(`[PDF_DEBUG] 4. Nueva página creada. T+${Date.now() - start}ms`);
      
      // Configurar el contenido y esperar solo a que el DOM esté listo (mucho más rápido)
      console.log(`[PDF_DEBUG] 5. Seteando contenido HTML... T+${Date.now() - start}ms`);
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      console.log(`[PDF_DEBUG] 6. DOM listo. T+${Date.now() - start}ms`);
      
      // Generar PDF
      console.log(`[PDF_DEBUG] 7. Iniciando page.pdf()... T+${Date.now() - start}ms`);
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
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-family: sans-serif; font-size: 10px; width: 100%; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 5px; color: #64748b;">
            <span>Sistema de Gestión de Horarios UNT - Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `
      });
      console.log(`[PDF_DEBUG] 8. PDF generado como Buffer. T+${Date.now() - start}ms. Tamaño: ${pdf.length} bytes`);

      await browser.close();
      console.log(`[PDF_DEBUG] 9. Browser cerrado. T+${Date.now() - start}ms`);
      
      return Buffer.from(pdf);
    } catch (error: any) {
      console.error(`[PDF_DEBUG] !!! ERROR CRÍTICO EN PASO ${error.message} !!!`);
      if (browser) await browser.close();
      throw error;
    }
  }



  static wrapLayout(content: string, title: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
              background-color: #ffffff; 
              color: #0f172a; 
              margin: 0;
              padding: 20px;
              width: 100%;
              box-sizing: border-box;
            }

            /* Header Styles */
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-bottom: 40px;
              padding-bottom: 24px;
              border-bottom: 3px solid #003366; /* Azul UNT */
            }

            .header-left {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .header-badge {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;
            }

            .logo-placeholder {
              width: 40px;
              height: 40px;
              background-color: #003366;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 900;
              font-size: 24px;
            }

            .system-name {
              font-size: 14px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }

            .report-title {
              font-size: 28px;
              font-weight: 900;
              color: #0f172a;
              margin: 0;
              letter-spacing: -0.02em;
            }

            .header-right {
              text-align: right;
            }

            .institution-name {
              font-weight: 800;
              color: #1e293b;
              font-size: 14px;
              margin: 0;
            }

            .school-name {
              font-size: 12px;
              color: #64748b;
              font-weight: 500;
              margin: 4px 0 0 0;
            }

            .timestamp-badge {
              font-size: 11px;
              color: #94a3b8;
              margin-top: 8px;
              background-color: #f1f5f9;
              display: inline-block;
              padding: 4px 12px;
              border-radius: 6px;
              font-weight: 600;
            }

            /* Table Styles */
            .print-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }

            .print-table th, .print-table td { 
              padding: 12px 16px; 
              text-align: left; 
              border-bottom: 1px solid #e2e8f0; 
            }

            .print-table th { 
              background-color: #f8fafc; 
              font-weight: 700; 
              font-size: 11px; 
              color: #475569; 
              text-transform: uppercase; 
              letter-spacing: 0.05em; 
            }

            .print-table td { 
              font-size: 12px; 
              color: #334155; 
            }

            .highlight-card { 
              background: #ffffff; 
              border: 1px solid #e2e8f0; 
              border-radius: 16px; 
              padding: 24px; 
              margin-bottom: 20px; 
            }

            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .gap-4 { gap: 16px; }
            .mb-8 { margin-bottom: 32px; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            
            /* Status Pills */
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .badge-blue { background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
            .badge-emerald { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
            
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-left">
              <div class="header-badge">
                <div class="logo-placeholder">U</div>
                <span class="system-name">Gestión de Horarios Académicos</span>
              </div>
              <h1 class="report-title">${title}</h1>
            </div>
            <div class="header-right">
              <p class="institution-name">Universidad Nacional de Trujillo</p>
              <p class="school-name">Escuela de Ingeniería de Sistemas</p>
              <div class="timestamp-badge">
                ${new Date().toLocaleDateString('es-PE')} - ${new Date().toLocaleTimeString('es-PE')}
              </div>
            </div>
          </div>
          <div class="content">
            ${content}
          </div>
        </body>
      </html>
    `;
  }

}
