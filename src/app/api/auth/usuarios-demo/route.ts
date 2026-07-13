import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[Usuarios PDF] Iniciando generación de PDF con pdf-lib...');
    
    const usuarios = await prisma.usuario.findMany({
      select: {
        nombres: true,
        apellidos: true,
        correo_electronico: true,
        rol: true,
        activo: true,
        codigo: true,
      },
      orderBy: [{ rol: 'asc' }, { apellidos: 'asc' }, { nombres: 'asc' }],
    });

    console.log(`[Usuarios PDF] Se encontraron ${usuarios.length} usuarios`);

    // Crear documento PDF
    const pdfDoc = PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // Tamaño A4
    const { width, height } = page.getSize();
    
    let y = height - 40;
    const margin = 40;
    const lineHeight = 15;

    // Título
    page.drawText('Usuarios de prueba - SGH UNT', {
      x: margin,
      y: y,
      size: 18,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 1.5;

    page.drawText('Se incluyen todos los usuarios registrados en el sistema con sus datos de acceso.', {
      x: margin,
      y: y,
      size: 10,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= lineHeight * 2;

    // Encabezados de tabla
    const colWidths = [60, 80, 90, 80, 110, 50];
    const headers = ['Código', 'Nombres', 'Apellidos', 'Rol', 'Correo', 'Estado'];
    let x = margin;

    // Fondo gris para encabezados
    page.drawRectangle({
      x: margin,
      y: y - 12,
      width: width - margin * 2,
      height: 15,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Dibujar encabezados
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], {
        x: x,
        y: y - 10,
        size: 9,
        color: rgb(0, 0, 0),
      });
      x += colWidths[i];
    }
    y -= lineHeight * 1.2;

    // Dibujar línea separadora
    page.drawLine({
      start: { x: margin, y: y },
      end: { x: width - margin, y: y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= lineHeight * 0.5;

    // Dibujar filas de usuarios
    const rowHeight = 12;
    let rowCount = 0;

    for (const usuario of usuarios) {
      // Verificar si necesitamos una nueva página
      if (y < margin + 20) {
        page = pdfDoc.addPage([612, 792]);
        y = 792 - 40;
        page.drawText(`Página ${pdfDoc.getPages().length}`, {
          x: width - 100,
          y: 20,
          size: 8,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // Alternar color de fondo para mejor legibilidad
      if (rowCount % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: y - rowHeight,
          width: width - margin * 2,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      const cols = [
        usuario.codigo || 'N/A',
        usuario.nombres || '',
        usuario.apellidos || '',
        usuario.rol || '',
        usuario.correo_electronico || 'Sin correo',
        usuario.activo ? 'Activo' : 'Inactivo',
      ];

      x = margin;
      for (let i = 0; i < cols.length; i++) {
        // Truncar texto si es muy largo
        let text = cols[i];
        if (text.length > 15) {
          text = text.substring(0, 12) + '...';
        }
        
        page.drawText(text, {
          x: x,
          y: y - rowHeight + 2,
          size: 8,
          color: rgb(0, 0, 0),
        });
        x += colWidths[i];
      }

      y -= rowHeight;
      rowCount++;
    }

    // Pie de página en la página actual
    page.drawLine({
      start: { x: margin, y: y },
      end: { x: width - margin, y: y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= lineHeight;

    page.drawText(`Total de usuarios: ${usuarios.length}`, {
      x: margin,
      y: y,
      size: 9,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText('Documento generado automáticamente desde el login del sistema.', {
      x: margin,
      y: y - 12,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Generar buffer
    const pdfBuffer = await pdfDoc.save();
    console.log(`[Usuarios PDF] PDF generado exitosamente, tamaño: ${pdfBuffer.length} bytes`);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="usuarios-demo-sgh-unt.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[Usuarios PDF] Error al generar PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar PDF de usuarios', details: String(error) },
      { status: 500 }
    );
  }
}
