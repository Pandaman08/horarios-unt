import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export class GeneradorPDF {
  static async generarDesdeHTML(
    html: string,
    landscape: boolean = false
  ): Promise<Buffer> {
    try {
      console.log("[GeneradorPDF] Iniciando generación de PDF con pdf-lib...");

      // 1. Crear un nuevo documento PDF
      const pdfDoc = await PDFDocument.create();

      // 2. Obtener fuentes estándar
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(
        StandardFonts.HelveticaBold
      );

      // 3. Agregar una página
      const page = pdfDoc.addPage([
        595.28, // Ancho (A4)
        landscape ? 420.94 : 841.89, // Alto
      ]);
      const pageSize = page.getSize();
      const { width, height } = pageSize;

      // 4. Escribir contenido en la página
      let yPosition = height - 50;

      // Título principal
      page.drawText("Reporte Generado", {
        x: 50,
        y: yPosition,
        size: 24,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      // Fecha y universidad
      page.drawText(new Date().toLocaleString("es-PE"), {
        x: 50,
        y: yPosition,
        size: 14,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 20;

      page.drawText("Universidad Nacional de Trujillo", {
        x: 50,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0.4),
      });
      yPosition -= 20;

      page.drawText("Escuela de Ingeniería de Sistemas", {
        x: 50,
        y: yPosition,
        size: 14,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 40;

      // Convertir HTML a texto plano y dividir en líneas
      const plainText = html.replace(/<[^>]*>/g, "");
      const words = plainText.split(/\s+/);
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const textWidth = helveticaFont.widthOfTextAtSize(testLine, 12);

        if (textWidth > width - 100) {
          // Dibujar la línea actual
          page.drawText(currentLine, {
            x: 50,
            y: yPosition,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= 20;
          currentLine = word;

          // Si nos quedamos sin espacio, agregar nueva página
          if (yPosition < 50) {
            const newPage = pdfDoc.addPage([width, height]);
            yPosition = height - 50;
            page.drawText(currentLine, {
              x: 50,
              y: yPosition,
              size: 12,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
            yPosition -= 20;
          }
        } else {
          currentLine = testLine;
        }
      }

      // Dibujar la última línea
      if (currentLine) {
        page.drawText(currentLine, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      // 5. Agregar pie de página a todas las páginas
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const pageFooter = pages[i];
        pageFooter.drawText(
          `Página ${i + 1} de ${pages.length} - © ${new Date().getFullYear()} Sistema de Gestión de Horarios UNT`,
          {
            x: 50,
            y: 30,
            size: 10,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          }
        );
      }

      // 6. Guardar el PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      console.log(
        "[GeneradorPDF] PDF generado con éxito con pdf-lib, bytes:",
        pdfBuffer.length
      );

      return pdfBuffer;
    } catch (error) {
      console.error("[GeneradorPDF] Error al generar PDF:", error);
      return this.generarPDFMinimalista();
    }
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
(Reporte Generado) Tj
0 -30 Td
/F1 10 Tf
(El sistema está usando un PDF simple porque el navegador de renderizado) Tj
0 -12 Td
(no está disponible. Esto es normal en el entorno de producción.) Tj
0 -12 Td
(Por favor, contacte a soporte para obtener el reporte completo.) Tj
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

  static wrapLayout(
    content: string,
    title: string,
    minimal: boolean = false
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
              <p style="font-size: 10px; color: #94a3b8; margin-top: 8px;">${new Date().toLocaleString(
                "es-PE"
              )}</p>
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