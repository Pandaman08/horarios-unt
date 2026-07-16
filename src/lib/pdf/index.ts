export { generatePlanEstudiosPDF } from './generators/planEstudios';
export { generateCladPDF } from './generators/clad';
export { generateDocenteHorarioPDF } from './generators/docenteHorario';
export { createDocenteHorarioPdfDto } from './dto/docenteHorario';
export type { DocenteHorarioPdfDto, DocenteHorarioPdfItem } from './types/docenteHorario';
export { PDFBuilder } from './utils';
export { PDFDocumentFactory } from './builders/PDFDocumentFactory';
export { ReportLayout } from './layout';
export { Colors, FontSizes, Spacing } from './layout';
