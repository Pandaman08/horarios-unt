import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id_periodo = searchParams.get('id_periodo');
  const ciclo = searchParams.get('ciclo'); // "todos" o número del ciclo (1, 2, 3...)

  if (!id_periodo) {
    return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });
  }

  try {
    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(id_periodo) }
    });

    if (!periodo) {
      return NextResponse.json({ error: 'Periodo no encontrado' }, { status: 404 });
    }

    // 1. Obtener cursos y sus horarios para el periodo y ciclo(s)
    const whereCursos: any = {
      activo: true,
    };
    if (ciclo && ciclo !== 'todos') {
      whereCursos.id_ciclo = parseInt(ciclo);
    }

    const cursos = await prisma.curso.findMany({
      where: whereCursos,
      include: {
        docente_cursos: {
          where: { activo: true },
          include: { docente: true }
        },
        horarios_asignados: {
          where: { id_periodo: parseInt(id_periodo) },
          include: { 
            docente: true,
            ambiente: true,
            grupo: true
          }
        }
      }
    });

    // Agrupar cursos por ciclo para las pestañas
    const cursosPorCiclo = cursos.reduce((acc: any, curso) => {
      const c = curso.id_ciclo || 0;
      if (!acc[c]) acc[c] = [];
      acc[c].push(curso);
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SGH UNT';
    workbook.lastModifiedBy = 'SGH UNT';
    workbook.created = new Date();
    workbook.modified = new Date();

    const diasSemana = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const horas = [
      '7-8', '8-9', '9-10', '10-11', '11-12', '12-1',
      'RECESO',
      '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8'
    ];

    // Paleta de colores para cursos (colores pasteles suaves)
    const coloresCursos = [
      'E3F2FD', 'F1F8E9', 'FFFDE7', 'F3E5F5', 'E8EAF6', 
      'E0F2F1', 'FFF3E0', 'FBE9E7', 'EFEBE9', 'FAFAFA'
    ];

    // Paleta de colores SÓLIDOS (según imagen 2)
    const coloresSolidos = [
      '33CCFF', // Celeste
      'FFFFFF', // Blanco
      'FFFF00', // Amarillo
      'CCFFCC', // Verde claro
      '99CCFF', // Azul claro
      'FF9999', // Salmón/Rosa
      '00FFFF', // Cyan
      'FFCC99', // Naranja claro
      'CC99FF', // Morado claro
      'C0C0C0'  // Gris
    ];

    const toRoman = (num: number): string => {
      const lookup: { [key: string]: number } = { X: 10, IX: 9, V: 5, IV: 4, I: 1 };
      let roman = '';
      for (let i in lookup) {
        while (num >= lookup[i]) {
          roman += i;
          num -= lookup[i];
        }
      }
      return roman;
    };

    // Generamos las hojas dependiendo de la selección
    let ciclosAGenerar: number[] = [];
    
    if (ciclo && ciclo !== 'todos') {
      // Si se selecciona un ciclo individual
      ciclosAGenerar = [parseInt(ciclo)];
    } else {
      // Si se selecciona "Todos los ciclos", generar 10 hojas
      ciclosAGenerar = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    for (const cicloNum of ciclosAGenerar) {
      const cursosDelCiclo = cursosPorCiclo[cicloNum] || [];

      const sheetName = `CICLO ${toRoman(cicloNum)}`;
      const worksheet = workbook.addWorksheet(sheetName);

      // --- CONFIGURACIÓN DE COLUMNAS (Ajustadas para coincidir con imagen 2) ---
      worksheet.columns = [
        { width: 10 }, // A: HORA
        { width: 22 }, // B: LUNES
        { width: 22 }, // C: MARTES
        { width: 22 }, // D: MIERCOLES
        { width: 10 }, // E: JUEVES / N°
        { width: 35 }, // F: VIERNES / PROFESOR
        { width: 35 }, // G: SABADO / ASIGNATURA
        { width: 10 }, // H: HORA / T
        { width: 5 },  // I: P
        { width: 5 },  // J: L
        { width: 5 },  // K: G
        { width: 10 }, // L: T. HORAS
        { width: 25 }, // M: DEPARTAMENTO
      ];

      // --- ENCABEZADO INSTITUCIONAL (Columnas A a D) ---
      const headerRows = [
        { text: 'UNIVERSIDAD NACIONAL DE TRUJILLO', bold: true, size: 11 },
        { text: 'FACULTAD DE INGENIERÍA TRUJILLO', bold: true, size: 10 },
        { text: `ESCUELA:  INGENIERIA DE SISTEMAS`, bold: true, size: 10, blue: true },
        { text: `CICLO:  ${toRoman(cicloNum)}      SECCION:  A`, bold: true, size: 10, blue: true },
        { text: `AÑO ACADEMICO:  ${periodo.anio}      SEMESTRE:  ${periodo.semestre === 1 ? 'I' : 'II'}`, bold: true, size: 10, blue: true },
        { text: `Inicio del Ciclo: ${periodo.fecha_inicio.toLocaleDateString()} Termino Ciclo: ${periodo.fecha_fin.toLocaleDateString()}`, bold: true, size: 9, blue: true }
      ];

      headerRows.forEach((row, i) => {
        const r = worksheet.getRow(i + 1);
        r.getCell(1).value = row.text;
        worksheet.mergeCells(i + 1, 1, i + 1, 4);
        r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell(1).font = { 
          bold: row.bold, 
          size: row.size, 
          color: { argb: row.blue ? '003366' : '000000' } 
        };
      });

      // --- TABLA DE DOCENTES Y ASIGNATURAS (Desde columna E, fila 1) ---
      const startDocenteRow = 1;
      const docHeader = worksheet.getRow(startDocenteRow);
      docHeader.values = [null, null, null, null, 'N°', 'PROFESOR', 'ASIGNATURA', 'T', 'P', 'L', 'G', 'T. HORAS', 'DEPARTAMENTO'];
      
      // Estilo cabecera docentes (Imagen 2)
      for (let i = 5; i <= 13; i++) {
        const cell = docHeader.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
        cell.font = { bold: true, size: 8 };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      const mapCursoColor: Record<number, string> = {};
      const mapCursoNum: Record<number, number> = {};
      
      cursosDelCiclo.forEach((curso: any, idx: number) => {
        const row = worksheet.getRow(startDocenteRow + idx + 1);
        const docente = curso.docente_cursos[0]?.docente;
        const color = coloresSolidos[idx % coloresSolidos.length];
        mapCursoColor[curso.id_curso] = color;
        mapCursoNum[curso.id_curso] = idx + 1;

        row.getCell(5).value = idx + 1;
        row.getCell(6).value = docente ? `${docente.nombres} ${docente.apellidos}` : 'POR ASIGNAR';
        row.getCell(7).value = curso.nombre;
        row.getCell(8).value = curso.horas_teoria || '-';
        row.getCell(9).value = curso.horas_practica || '-';
        row.getCell(10).value = curso.horas_laboratorio || '-';
        row.getCell(11).value = '1'; // Grupo
        row.getCell(12).value = (curso.horas_teoria || 0) + (curso.horas_practica || 0) + (curso.horas_laboratorio || 0);
        row.getCell(13).value = 'Ing. de Sistemas';

        // Estilos y color sólido
        for (let i = 5; i <= 13; i++) {
          const cell = row.getCell(i);
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.font = { size: 8 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
          cell.alignment = { vertical: 'middle', horizontal: i === 6 || i === 7 ? 'left' : 'center' };
        }
      });

      // --- GRILLA HORARIA (Desde fila 16, columnas A a H) ---
      const startGridRow = 16;
      const gridHeader = worksheet.getRow(startGridRow);
      gridHeader.values = ['HORA', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'HORA'];
      
      // Estilo cabecera grilla (Verde suave en imagen 2)
      for (let i = 1; i <= 8; i++) {
        const cell = gridHeader.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } };
        cell.font = { bold: true, size: 9 };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Dibujar filas de horas
      horas.forEach((hora, hIdx) => {
        const row = worksheet.getRow(startGridRow + hIdx + 1);
        row.getCell(1).value = hora;
        row.getCell(8).value = hora;
        row.height = 25; // Altura para que se vea como en la imagen
        
        for (let i = 1; i <= 8; i++) {
          const cell = row.getCell(i);
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.font = { size: 9 };
          if (hora === 'RECESO') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
          }
        }
        if (hora === 'RECESO') {
          worksheet.mergeCells(startGridRow + hIdx + 1, 2, startGridRow + hIdx + 1, 7);
        }
      });

      // Llenar asignaciones con MERGE y COLORES SÓLIDOS
      cursosDelCiclo.forEach((curso: any) => {
        const color = mapCursoColor[curso.id_curso];
        const cursoNum = mapCursoNum[curso.id_curso];
        
        curso.horarios_asignados.forEach((asig: any) => {
          const colIdx = asig.dia_semana + 2; // 0=Lunes -> Col 2
          const horaInicio = asig.hora_inicio;
          const horaFin = asig.hora_fin;
          
          const hIdxStart = horas.findIndex(h => h.startsWith(horaInicio.split(':')[0]));
          const hIdxEnd = horas.findIndex(h => h.split('-')[1] === horaFin.split(':')[0].replace(/^0/, ''));
          
          if (hIdxStart !== -1) {
            const startRow = startGridRow + hIdxStart + 1;
            const endRow = hIdxEnd !== -1 ? startGridRow + hIdxEnd + 1 : startRow;
            
            // Merge si dura más de una hora
            if (endRow > startRow) {
              worksheet.mergeCells(startRow, colIdx, endRow, colIdx);
            }

            const cell = worksheet.getRow(startRow).getCell(colIdx);
            cell.value = `${cursoNum}\n${asig.ambiente ? asig.ambiente.nombre : ''}`;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
            cell.font = { bold: true, size: 8 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          }
        });
      });
    }

    // --- GENERAR ARCHIVO ---
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Horarios_Sistemas_${periodo.anio}_${periodo.semestre}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error('Error al generar Excel:', error);
    return NextResponse.json({ error: 'Error interno del servidor', detalle: error.message }, { status: 500 });
  }
}
