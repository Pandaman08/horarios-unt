import React from 'react';
import { Document, Page, StyleSheet, View, Text, renderToBuffer } from '@react-pdf/renderer';
import { Footer } from '../components/Footer';
import { HorarioSummaryTable } from '../components/HorarioSummaryTable';
import { HorarioMatrix } from '../components/HorarioMatrix';
import type { DocenteHorarioPdfDto } from '../types/docenteHorario';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: 15,
    fontFamily: 'Helvetica',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  topSectionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  topBar: {
    width: '100%',
    backgroundColor: '#003366',
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  topBarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  infoBox: {
    width: 260,
    borderWidth: 2,
    borderColor: '#003366',
    borderRadius: 4,
    padding: 5,
    flexDirection: 'column',
  },
  universityText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
  },
  facultyText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 1,
  },
  metadataText: {
    fontSize: 8,
  },
  dateBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 3,
    padding: 2,
    alignItems: 'flex-end',
  },
});

export async function generateHorarioAulaOCicloPDF(dto: DocenteHorarioPdfDto, title: string): Promise<Buffer> {
  const generatedAt = new Date().toLocaleString('es-PE');

  const document = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', orientation: 'landscape', style: styles.page },
      React.createElement(
        View,
        { style: styles.body },
        React.createElement(
          View,
          { style: styles.topBar },
          React.createElement(Text, { style: styles.topBarText }, title.toUpperCase()),
        ),
        React.createElement(
          View,
          { style: styles.topSectionRow },
          React.createElement(
            View,
            { style: styles.infoBox },
            React.createElement(Text, { style: styles.universityText }, 'UNIVERSIDAD NACIONAL DE TRUJILLO'),
            React.createElement(Text, { style: styles.facultyText }, 'FACULTAD DE INGENIERÍA'),
            React.createElement(Text, { style: styles.metadataText }, 'ESCUELA: INGENIERÍA DE SISTEMAS'),
            React.createElement(Text, { style: styles.metadataText }, `AÑO: ${dto.periodo?.anio ?? '-'}`),
            React.createElement(Text, { style: styles.metadataText }, `SEMESTRE: ${dto.periodo?.semestre ?? '-'}`),
            React.createElement(View, { style: styles.dateBox },
              React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold', fontSize: 7 } }, `Inicio: ${new Date().toLocaleDateString('es-PE')}`),
              React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold', fontSize: 7 } }, `Término: ${new Date().toLocaleDateString('es-PE')}`),
            ),
          ),
          React.createElement(HorarioSummaryTable, { items: dto.horarios }),
        ),
        React.createElement(HorarioMatrix, { items: dto.horarios }),
      ),
      React.createElement(Footer, { generatedAt }),
    ),
  );

  const pdfBuffer = await renderToBuffer(document);
  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}
