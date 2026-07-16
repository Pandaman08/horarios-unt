// CLAD report generator
import PDFDocument from 'pdfkit';
import { Colors, Spacing, FontSizes } from '../styles';

interface Docente {
  nombres: string;
  apellidos: string;
  dni?: string | null;
  departamentoId?: string | number | null;
}

interface Sede {
  nombre: string;
}

interface Horario {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

interface Clad {
  curso: string;
  dependencia: string;
  numeroResolucion?: string | null;
  fechaInicio: Date;
  fechaFin: Date;
  totalHoras: number;
  observaciones?: string | null;
  docente: Docente;
  sede: Sede;
  horarios: Horario[];
  validador?: Docente | null;
}

const DEPENDENCIAS_LABEL: Record<string, string> = {
  FILIAL: 'Filial',
  POSGRADO: 'Posgrado',
  'SEGUNDA_ESPECIALIDAD': 'Segunda Especialidad',
  'CENTRO_PRODUCCION': 'Centro de Producción',
  'EXTENSION_UNIVERSITARIA': 'Extensión Universitaria'
};

const DIAS_LABEL: Record<string, string> = {
  LU: 'Lunes',
  MA: 'Martes',
  MI: 'Miércoles',
  JU: 'Jueves',
  VI: 'Viernes',
  SA: 'Sábado'
};

export async function generateCladPDF(clad: Clad): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: Spacing.PAGE_MARGIN, size: 'A4' });
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    // Títulos
    doc.fillColor(Colors.PRIMARY)
       .font('Helvetica-Bold')
       .fontSize(FontSizes.XXXL)
       .text('UNIVERSIDAD NACIONAL DE TRUJILLO', { align: 'center' })
       .fillColor(Colors.TEXT)
       .fontSize(FontSizes.XL)
       .text('FACULTAD DE INGENIERÍA', { align: 'center' })
       .fillColor(Colors.PRIMARY)
       .fontSize(FontSizes.XXL)
       .text('CARGA LECTIVA ADICIONAL (CLAD)', { align: 'center' })
       .moveDown();
    
    // Información del docente
    doc.fillColor(Colors.TEXT)
       .font('Helvetica-Bold')
       .fontSize(FontSizes.MD)
       .rect(Spacing.PAGE_MARGIN, doc.y, doc.page.width - Spacing.PAGE_MARGIN * 2, 84)
       .strokeColor(Colors.PRIMARY)
       .lineWidth(2)
       .stroke()
       .fillColor(Colors.TEXT)
       .moveDown();
    
    doc.text(`DOCENTE: ${clad.docente.nombres} ${clad.docente.apellidos}`, { continued: true })
       .text(`  DNI: ${clad.docente.dni ?? '—'}`, { continued: true })
       .text(`  DPTO. ACADÉMICO: Ingeniería de Sistemas`)
       .moveDown()
       .text(`FACULTAD: ${clad.sede.nombre}`)
       .moveDown();
    
    // Tabla
    const tableWidth = doc.page.width - Spacing.PAGE_MARGIN * 2;
    const colWidths = [tableWidth / 7, tableWidth / 7, tableWidth / 7, tableWidth / 7, tableWidth / 7, tableWidth / 7, tableWidth / 7];
    const headers = ['CURSO', 'DEPENDENCIA', 'N° RESOLUCIÓN', 'FECHA INICIO', 'FECHA FIN', 'TOTAL HORAS', 'HORARIO'];
    const data = [
      clad.curso,
      DEPENDENCIAS_LABEL[clad.dependencia] ?? clad.dependencia,
      clad.numeroResolucion ?? '—',
      new Date(clad.fechaInicio).toLocaleDateString('es-PE'),
      new Date(clad.fechaFin).toLocaleDateString('es-PE'),
      String(clad.totalHoras),
      clad.horarios.map(h => `${DIAS_LABEL[h.dia] ?? h.dia}: ${h.horaInicio} - ${h.horaFin}`).join('\n')
    ];
    const rowHeight = 28;
    let currentY = doc.y + 4;
    
    // Encabezado
    doc.font('Helvetica-Bold')
       .fillColor(Colors.WHITE)
       .fontSize(FontSizes.MD);
    headers.forEach((header, i) => {
      const x = Spacing.PAGE_MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.rect(x, currentY, colWidths[i], rowHeight)
         .fill(Colors.PRIMARY);
      doc.text(header, x + 4, currentY + 8, { width: colWidths[i] - 8, align: 'center' });
    });
    
    currentY += rowHeight;
    
    // Datos
    doc.font('Helvetica')
       .fillColor(Colors.TEXT)
       .strokeColor(Colors.PRIMARY)
       .lineWidth(1);
    let maxRowHeight = rowHeight;
    data.forEach((text, i) => {
      const x = Spacing.PAGE_MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      const y = currentY;
      doc.fontSize(FontSizes.MD);
      const textHeight = doc.heightOfString(text, { width: colWidths[i] - 8, align: 'center' });
      maxRowHeight = Math.max(maxRowHeight, textHeight + 16);
    });
    data.forEach((text, i) => {
      const x = Spacing.PAGE_MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.rect(x, currentY, colWidths[i], maxRowHeight).stroke();
      doc.text(text, x + 4, currentY + 8, { width: colWidths[i] - 8, align: 'center' });
    });
    currentY += maxRowHeight;
    
    // Observaciones
    if (clad.observaciones) {
      doc.moveDown()
         .font('Helvetica-Bold')
         .text('Observaciones:')
         .font('Helvetica')
         .text(clad.observaciones);
    }
    
    // Firmas
    doc.moveDown(4);
    const firmaWidth = 180;
    const firmaSpacing = (doc.page.width - Spacing.PAGE_MARGIN * 2 - firmaWidth * 4) / 3;
    let firmaX = Spacing.PAGE_MARGIN;
    const firmas = [
      { label: 'Profesor', nombre: `${clad.docente.nombres} ${clad.docente.apellidos}` },
      { label: 'Director de Departamento', nombre: clad.validador ? `${clad.validador.nombres} ${clad.validador.apellidos}` : '—' },
      { label: 'Decano', nombre: '—' },
      { label: `Director de ${DEPENDENCIAS_LABEL[clad.dependencia] ?? 'Unidad Académica'}`, nombre: '—' }
    ];
    firmas.forEach((firma) => {
      doc.moveTo(firmaX, doc.y)
         .lineTo(firmaX + firmaWidth, doc.y)
         .stroke()
         .text(firma.label, firmaX, doc.y + 6, { width: firmaWidth, align: 'center' })
         .font('Helvetica')
         .fontSize(FontSizes.SM)
         .text(firma.nombre, firmaX, doc.y + 22, { width: firmaWidth, align: 'center' });
      firmaX += firmaWidth + firmaSpacing;
    });
    
    // Fecha y sistema
    doc.moveDown(2)
       .font('Helvetica')
       .fontSize(FontSizes.SM)
       .fillColor(Colors.TEXT_LIGHT)
       .text(`Generado el ${new Date().toLocaleString('es-PE')} · Sistema de Gestión de Horarios UNT`, { align: 'right' });
    
    doc.end();
  });
}
