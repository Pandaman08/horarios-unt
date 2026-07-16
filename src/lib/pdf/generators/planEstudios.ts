// Plan de Estudios report generator
import PDFDocument from 'pdfkit';
import { Colors, Spacing, FontSizes } from '../styles';

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  horas_teoria?: number | null;
  horas_practica?: number | null;
  horas_laboratorio?: number | null;
  tipo_curso: string;
  departamento_responsable?: string | null;
  creditos?: number | null;
  prerequisitos_rel?: {
    prerequisito: {
      codigo: string;
      nombre: string;
      ciclo_rel?: {
        numero: number;
      } | null;
    };
  }[];
  malla_rel?: {
    nombre: string;
    anio: number;
  } | null;
}

interface Ciclo {
  id_ciclo: number;
  numero: number;
  nombre: string;
  cursos: Curso[];
}

interface MallaCurricular {
  id_malla: number;
  nombre: string;
  anio: number;
}

export async function generatePlanEstudiosPDF(
  ciclos: Ciclo[],
  malla?: MallaCurricular
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: Spacing.PAGE_MARGIN, size: 'A4' });
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    // Generar contenido
    // Título principal
    doc.fillColor(Colors.PRIMARY)
       .font('Helvetica-Bold')
       .fontSize(FontSizes.H1)
       .text('UNIVERSIDAD NACIONAL DE TRUJILLO', { align: 'center' })
       .fillColor(Colors.TEXT)
       .font('Helvetica-Bold')
       .fontSize(FontSizes.H2)
       .text('FACULTAD DE INGENIERÍA', { align: 'center' })
       .font('Helvetica-Bold')
       .fontSize(FontSizes.H3)
       .text('ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS', { align: 'center' })
       .moveDown();
    
    // Título del plan de estudios
    doc.fillColor(Colors.WHITE)
       .rect(Spacing.PAGE_MARGIN, doc.y, doc.page.width - Spacing.PAGE_MARGIN * 2, 32)
       .fill(Colors.PRIMARY)
       .text(malla?.nombre ?? 'PLAN DE ESTUDIOS', { align: 'center', baseline: 'middle' })
       .fillColor(Colors.TEXT)
       .moveDown();
    
    // Fecha de impresión
    doc.fontSize(FontSizes.SM)
       .text(`Fecha de impresión: ${new Date().toLocaleDateString('es-PE', {
         day: '2-digit',
         month: 'long',
         year: 'numeric'
       })}`, { align: 'right' })
       .moveDown();
    
    // Iterar por los ciclos
    for (const ciclo of ciclos) {
      // Encabezado del ciclo
      let yPosition = doc.y;
      doc.fillColor(Colors.PRIMARY)
         .rect(Spacing.PAGE_MARGIN, yPosition, doc.page.width - Spacing.PAGE_MARGIN * 2, 28)
         .fill(Colors.PRIMARY)
         .fillColor(Colors.WHITE)
         .font('Helvetica-Bold')
         .fontSize(FontSizes.XXXL)
         .text(`Ciclo ${ciclo.numero} — ${ciclo.nombre}`, { align: 'left', baseline: 'middle' })
         .font('Helvetica')
         .fontSize(FontSizes.SM)
         .text(`${ciclo.cursos.length} cursos`, {
           align: 'right',
           baseline: 'middle',
           continued: false
         })
         .fillColor(Colors.TEXT)
         .moveDown();
      
      // Encabezados de la tabla
      yPosition = doc.y + Spacing.SM;
      const headerY = yPosition;
      const tableWidth = doc.page.width - Spacing.PAGE_MARGIN * 2;
      const colWidths = [60, 40, 80, 160, 50, 50, 50, 50, 120];
      const headers = [
        'Código', 'Ciclo', 'Tipo', 'Curso', 'T', 'P', 'L', 'Créd.', 'Departamento'
      ];
      
      doc.font('Helvetica-Bold').fontSize(FontSizes.SM).fillColor(Colors.TEXT);
      headers.forEach((header, i) => {
        doc.text(
          header,
          Spacing.PAGE_MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + Spacing.SM,
          headerY + 6,
          { width: colWidths[i] - Spacing.MD, align: i < 2 ? 'center' : 'left' }
        );
      });
      
      // Líneas de tabla
      doc.lineWidth(1).strokeColor(Colors.BORDER)
         .moveTo(Spacing.PAGE_MARGIN, headerY)
         .lineTo(Spacing.PAGE_MARGIN + tableWidth, headerY)
         .lineTo(Spacing.PAGE_MARGIN + tableWidth, headerY + 28)
         .lineTo(Spacing.PAGE_MARGIN, headerY + 28)
         .closePath()
         .stroke();
      
      colWidths.reduce((currentX, w) => {
        doc.moveTo(currentX, headerY).lineTo(currentX, headerY + 28).stroke();
        return currentX + w;
      }, Spacing.PAGE_MARGIN);
      
      yPosition = headerY + 28;
      let totalCreditos = 0;
      
      // Filas de cursos
      for (const curso of ciclo.cursos) {
        // Calcular créditos
        let creditos = curso.creditos ?? 0;
        if (curso.tipo_curso === 'electivo') {
          const electivosContados = ciclo.cursos.filter((c, idx) => c.tipo_curso === 'electivo' && idx <= ciclo.cursos.indexOf(curso)).length;
          if (electivosContados > 1) creditos = 0;
        }
        totalCreditos += creditos;
        
        // Tipo de curso
        let tipoLabel = 'OB';
        let tipoColor: string = Colors.SUCCESS;
        if (curso.tipo_curso === 'especializacion') { tipoLabel = 'S'; tipoColor = Colors.PRIMARY; }
        else if (curso.tipo_curso === 'opcional') { tipoLabel = 'OP'; tipoColor = '#eab308'; }
        else if (curso.tipo_curso === 'electivo') { tipoLabel = 'EL'; tipoColor = Colors.TEXT_LIGHT; }
        
        // Dibujar celda de tipo
        const tipoX = Spacing.PAGE_MARGIN + colWidths[0] + colWidths[1] + Spacing.SM;
        const tipoWidth = colWidths[2] - Spacing.MD;
        doc.rect(tipoX - Spacing.SM, yPosition + 2, tipoWidth + Spacing.SM, 18)
           .fillAndStroke(`${tipoColor}20` as any, Colors.BORDER)
           .fillColor(tipoColor)
           .fontSize(FontSizes.SM)
           .text(tipoLabel, tipoX, yPosition + 6, { width: tipoWidth, align: 'center' });
        
        // Dibujar celdas de texto
        doc.fillColor(Colors.TEXT).font('Helvetica');
        const rowData = [
          curso.codigo,
          String(ciclo.numero),
          '', // tipo, ya dibujado
          curso.nombre,
          String(curso.horas_teoria ?? 0),
          String(curso.horas_practica ?? 0),
          String(curso.horas_laboratorio ?? 0),
          String(creditos),
          curso.departamento_responsable ?? ''
        ];
        rowData.forEach((text, i) => {
          if (i === 2) return;
          doc.fontSize(FontSizes.MD).text(
            text,
            Spacing.PAGE_MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + Spacing.SM,
            yPosition + 6,
            {
              width: colWidths[i] - Spacing.MD,
              align: i < 2 || i > 2 ? (i === 3 ? 'left' : 'center') : 'center',
              baseline: 'top'
            }
          );
        });
        
        // Dibujar bordes de la fila
        doc.lineWidth(0.5).strokeColor(Colors.BORDER);
        colWidths.reduce((currentX, w) => {
          doc.moveTo(currentX, yPosition).lineTo(currentX, yPosition + 28).stroke();
          return currentX + w;
        }, Spacing.PAGE_MARGIN);
        doc.moveTo(Spacing.PAGE_MARGIN, yPosition + 28)
           .lineTo(Spacing.PAGE_MARGIN + tableWidth, yPosition + 28)
           .stroke();
        
        // Dibujar prerequisitos
        if (curso.prerequisitos_rel && curso.prerequisitos_rel.length > 0) {
          doc.fontSize(FontSizes.SM).fillColor(Colors.TEXT_LIGHT);
          const prereqText = curso.prerequisitos_rel
            .map(p => `* ${p.prerequisito.codigo} ${p.prerequisito.nombre}${p.prerequisito.ciclo_rel ? ` (Ciclo ${p.prerequisito.ciclo_rel.numero})` : ''}`)
            .join('    ');
          doc.text(prereqText, Spacing.PAGE_MARGIN + Spacing.SM, yPosition + 28 + 4, {
            width: tableWidth - Spacing.MD,
            lineGap: 2
          });
          yPosition += doc.y - (yPosition + 28 + 4);
        }
        
        yPosition += 28;
        
        // Check page space
        if (yPosition > doc.page.height - Spacing.PAGE_MARGIN - 60) {
          doc.addPage();
          yPosition = Spacing.PAGE_MARGIN;
        }
      }
      
      // Total de créditos del ciclo
      doc.font('Helvetica-Bold')
         .fillColor(Colors.PRIMARY)
         .rect(Spacing.PAGE_MARGIN, yPosition, tableWidth, 32)
         .fill(Colors.PRIMARY)
         .fillColor(Colors.WHITE)
         .fontSize(FontSizes.XL)
         .text('TOTAL DE CRÉDITOS:', {
           align: 'right',
           width: tableWidth - 80,
           continued: true
         })
         .text(`  ${totalCreditos}`, { align: 'right', width: tableWidth })
         .fillColor(Colors.TEXT);
      
      doc.moveDown(2);
    }
    
    doc.end();
  });
}
