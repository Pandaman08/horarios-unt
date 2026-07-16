import React from 'react';
import { Document, Page, StyleSheet, View, renderToBuffer } from '@react-pdf/renderer';
import { AsignaturaSummaryTable } from '../components/AsignaturaSummaryTable';
import { Footer } from '../components/Footer';
import { DocenteTopBar, SchoolInfoBox } from '../components/Header';
import { ScheduleMatrix } from '../components/ScheduleMatrix';
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
});

export async function generateDocenteHorarioPDF(dto: DocenteHorarioPdfDto): Promise<Buffer> {
  const generatedAt = new Date().toLocaleString('es-PE');
  const docenteName = `${dto.docente.nombres} ${dto.docente.apellidos}`.trim().toUpperCase();
  const year = dto.periodo?.anio ?? '2026';
  const semestre = dto.periodo?.semestre ?? 'I';
  const fechaInicio = '12/4/2026';
  const fechaTermino = '7/8/2026';

  const document = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', orientation: 'landscape', style: styles.page },
      React.createElement(
        View,
        { style: styles.body },
        React.createElement(DocenteTopBar, {
          docente: docenteName,
        }),
        React.createElement(
          View,
          { style: styles.topSectionRow },
          React.createElement(SchoolInfoBox, {
            university: 'Universidad Nacional de Trujillo',
            faculty: 'Facultad de Ingeniería',
            school: dto.escuela?.nombre ?? 'Ingeniería de Sistemas',
            section: 'A',
            year,
            semestre,
            fechaInicio,
            fechaTermino,
          }),
          React.createElement(AsignaturaSummaryTable, { dto }),
        ),
        React.createElement(ScheduleMatrix, { dto }),
      ),
      React.createElement(Footer, { generatedAt }),
    ),
  );

  const pdfBuffer = await renderToBuffer(document);

  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}