import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[Usuarios PDF] Iniciando generación de PDF con PDFKit...');

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

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc.font('Helvetica-Bold').fontSize(18).text('Usuarios de prueba - SGH UNT', { align: 'left' });
    doc.font('Helvetica').fontSize(10).fillColor('#3f3f46').text('Se incluyen todos los usuarios registrados en el sistema con sus datos de acceso para pruebas.');
    doc.moveDown(1.5);

    const headers = ['Código', 'Nombres', 'Apellidos', 'Rol', 'Contraseña', 'Correo', 'Estado'];
    const colWidths = [55, 65, 65, 60, 85, 240, 50];
    const tableWidth = headers.reduce((sum, _header, index) => sum + colWidths[index], 0);
    const startX = 40;
    let y = doc.y;

    doc.fillColor('#f4f4f5').rect(startX, y - 4, tableWidth, 16).fill();
    let currentX = startX;
    headers.forEach((header, index) => {
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(8).text(header, currentX + 4, y, { width: colWidths[index] - 8, lineGap: 0 });
      currentX += colWidths[index];
    });

    y += 16;
    doc.moveTo(startX, y).lineTo(startX + tableWidth, y).strokeColor('#d4d4d8').lineWidth(0.5).stroke();
    y += 8;

    let rowCount = 0;
    for (const usuario of usuarios) {
      if (y > 420) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
        y = 40;
      }

      if (rowCount % 2 === 0) {
        doc.fillColor('#fafafa').rect(startX, y - 2, tableWidth, 14).fill();
      }

      const cols = [
        usuario.codigo || 'N/A',
        usuario.nombres || '',
        usuario.apellidos || '',
        usuario.rol || '',
        usuario.codigo || 'N/A',
        usuario.correo_electronico || 'Sin correo',
        usuario.activo ? 'Activo' : 'Inactivo',
      ];

      currentX = startX;
      cols.forEach((text, index) => {
        const limit = colWidths[index] - 8;
        const content = index === 5 && text.length > 35 ? `${text.slice(0, 32)}...` : index !== 5 && text.length > 12 ? `${text.slice(0, 9)}...` : text;
        doc.fillColor('#111827').font('Helvetica').fontSize(7).text(content, currentX + 4, y, { width: limit, lineGap: 0 });
        currentX += colWidths[index];
      });

      y += 14;
      rowCount++;
    }

    doc.fillColor('#52525b').font('Helvetica').fontSize(9).text(`Total de usuarios: ${usuarios.length}`, startX, y + 10);
    doc.fillColor('#71717a').font('Helvetica').fontSize(8).text('NOTA: La contraseña es igual al código del usuario. Correo completo disponible para copiar.', startX, y + 22);
    doc.end();

    await new Promise<void>((resolve, reject) => {
      doc.on('end', () => resolve());
      doc.on('error', reject);
    });

    const pdfBuffer = Buffer.concat(chunks);
    console.log(`[Usuarios PDF] PDF generado exitosamente, tamaño: ${pdfBuffer.length} bytes`);

    return new NextResponse(pdfBuffer, {
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
