import ExcelJS from 'exceljs';
import { prisma } from '../../lib/prisma';

export class GeneradorExcel {
  static async generarConsolidadoGeneral(id_periodo: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Horario General');

    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo }
    });

    // Estilos
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };

    // Título
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `HORARIO INSTITUCIONAL - ESCUELA DE INGENIERÍA DE SISTEMAS - PERIODO ${periodo?.nombre || ''}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Encabezados
    const headers = ['Día', 'Horario', 'Ciclo', 'Curso', 'Grupo', 'Docente', 'Ambiente'];
    worksheet.getRow(3).values = headers;
    worksheet.getRow(3).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Datos
    const horarios = await prisma.horarioAsignado.findMany({
      where: { id_periodo },
      include: {
        docente: true,
        curso: { include: { ciclo_rel: true } },
        ambiente: true,
        grupo: true
      },
      orderBy: [
        { dia_semana: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    horarios.forEach((h, index) => {
      const row = worksheet.addRow([
        dias[h.dia_semana] || '—',
        `${h.hora_inicio}-${h.hora_fin}`,
        h.curso?.ciclo_rel?.numero || '—',
        h.curso?.nombre || '—',
        h.grupo?.codigo_grupo || '—',
        `${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}`,
        h.ambiente?.nombre || '—'
      ]);

      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        });
      }
    });

    // Ajustar columnas
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
