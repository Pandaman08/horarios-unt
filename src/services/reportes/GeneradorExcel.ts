import ExcelJS from 'exceljs';

export class GeneradorExcel {
  static async generarHorarioDocente(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Horario Docente');

    // Configuración de columnas
    worksheet.columns = [
      { width: 15 }, // HORA
      { width: 25 }, // LUNES
      { width: 25 }, // MARTES
      { width: 25 }, // MIÉRCOLES
      { width: 25 }, // JUEVES
      { width: 25 }, // VIERNES
      { width: 25 }, // SÁBADO
      { width: 15 }, // HORA
    ];

    // Estilos base
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F1F5F9' }
    };

    // 1. Cabecera Institucional
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'UNIVERSIDAD NACIONAL DE TRUJILLO';
    worksheet.getCell('A1').font = { bold: true, size: 12 };

    worksheet.mergeCells('A2:C2');
    worksheet.getCell('A2').value = 'FACULTAD DE INGENIERÍA - SISTEMAS';
    worksheet.getCell('A2').font = { bold: true, size: 10 };

    worksheet.getCell('G1').value = 'DOCENTE:';
    worksheet.getCell('G1').font = { bold: true };
    worksheet.getCell('H1').value = `${data.docente.apellidos}, ${data.docente.nombres}`;

    worksheet.getCell('G2').value = 'PERIODO:';
    worksheet.getCell('G2').font = { bold: true };
    worksheet.getCell('H2').value = data.periodo?.nombre || '—';

    // Espacio
    worksheet.addRow([]);

    // 2. Tabla de Cursos
    const cursoHeaderRow = worksheet.addRow(['Nº', 'ASIGNATURA', 'CICLO', 'T', 'P', 'L', 'G', 'T. HRS']);
    cursoHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { bold: true, size: 9 };
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center' };
    });

    data.listaCursos.forEach((c: any, i: number) => {
      const row = worksheet.addRow([
        i + 1,
        c.asignatura,
        c.ciclo,
        c.T,
        c.P,
        c.L,
        c.G,
        c.THoras
      ]);
      row.eachCell((cell) => {
        cell.border = borderStyle;
        cell.font = { size: 9 };
        cell.alignment = { horizontal: cell.address.includes('B') ? 'left' : 'center' };
      });
    });

    worksheet.addRow([]);

    // 3. Matriz de Horario
    const labelsHoras = ["7-8", "8-9", "9-10", "10-11", "11-12", "12-1", "1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8"];
    const horasRaw = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
    const dias = ["HORA", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "HORA"];

    const matrizHeaderRow = worksheet.addRow(dias);
    matrizHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { bold: true, size: 10 };
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center' };
    });

    const coloresARGB = [
      'BFDBFE', 'FECACA', 'BBF7D0', 'FEF08A', 'FED7AA', 'DDD6FE', 'BAE6FD', 'FBCFE8', 'E2E8F0'
    ];

    horasRaw.forEach((hora, idx) => {
      if (hora === "13:00") {
        const row = worksheet.addRow([labelsHoras[idx], 'ALMUERZO', '', '', '', '', '', labelsHoras[idx]]);
        worksheet.mergeCells(`B${row.number}:G${row.number}`);
        row.eachCell((cell) => {
          cell.fill = headerFill;
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
          cell.border = borderStyle;
        });
        return;
      }

      const rowData = [labelsHoras[idx]];
      for (let dia = 0; dia < 6; dia++) {
        const clase = data.horarios.find((h: any) => {
          const [h_inicio] = h.hora_inicio.split(':').map(Number);
          const [h_fin] = h.hora_fin.split(':').map(Number);
          const h_actual = parseInt(hora.split(':')[0]);
          return h.dia_semana === dia && h_actual >= h_inicio && h_actual < h_fin;
        });

        if (clase) {
          const cursoIdx = data.listaCursos.findIndex((c: any) => c.asignatura === clase.curso.nombre && c.G === clase.grupo.codigo_grupo);
          rowData.push(`${cursoIdx + 1} (${clase.ambiente.nombre})`);
        } else {
          rowData.push('');
        }
      }
      rowData.push(labelsHoras[idx]);

      const row = worksheet.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        if (colNumber > 1 && colNumber < 8 && cell.value !== '') {
          const cellValue = cell.value as string;
          if (!cellValue.includes('HORA')) {
            const match = cellValue.match(/^(\d+)/);
            if (match) {
              const cursoIdx = parseInt(match[1]) - 1;
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: coloresARGB[cursoIdx % coloresARGB.length] }
              };
              cell.font = { bold: true, size: 8 };
            }
          }
        }
      });
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  static async generarDesdeTabla(data: { title: string, headers: string[], rows: any[] }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Título
    worksheet.mergeCells(`A1:${String.fromCharCode(64 + data.headers.length)}1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = data.title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Cabeceras
    const headerRow = worksheet.addRow(data.headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F1F5F9' }
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Datos
    data.rows.forEach((rowData) => {
      const row = worksheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.font = { size: 10 };
      });
    });

    // Ajustar ancho de columnas
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }
}
