import { NextResponse } from 'next/server';
import { GeneradorPDF } from '@/services/reportes/GeneradorPDF';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

  const contenido = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; padding: 24px;">
      <h1 style="margin: 0 0 8px; font-size: 22px;">Usuarios de prueba - SGH UNT</h1>
      <p style="margin: 0 0 20px; color: #475569;">Se incluyen todos los usuarios registrados en el sistema con sus datos de acceso para pruebas.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #f8fafc; text-align: left;">
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Código</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Nombres</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Apellidos</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Rol</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Correo</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios
            .map((usuario) => `
                <tr>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${usuario.codigo}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${usuario.nombres}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${usuario.apellidos}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${usuario.rol}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${usuario.correo_electronico || 'Sin correo'}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${usuario.activo ? 'Activo' : 'Inactivo'}</td>
                </tr>
              `)
            .join('')}
        </tbody>
      </table>
      <p style="margin-top: 18px; font-size: 11px; color: #64748b;">Total de usuarios: ${usuarios.length}</p>
      <p style="margin-top: 6px; font-size: 11px; color: #64748b;">Documento generado automáticamente desde el login del sistema.</p>
    </div>
  `;

  const html = GeneradorPDF.wrapLayout(contenido, 'Usuarios de prueba SGH UNT', true);
  const pdfBuffer = await GeneradorPDF.generarDesdeHTML(html, false);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="usuarios-demo-sgh-unt.pdf"',
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}
