import React from 'react';
import { Document, Page, StyleSheet, View, Text, renderToBuffer } from '@react-pdf/renderer';
import { Footer } from '../components/Footer';
import type { GestionAcademicaPdfDto } from '../types/gestionAcademica';
import { Colors } from '../layout';

const styles = StyleSheet.create({
  page: {
    backgroundColor: Colors.WHITE,
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    fontFamily: 'Helvetica',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  header: {
    background: `linear-gradient(135deg, ${Colors.PRIMARY} 0%, #0055a5 100%)`,
    color: Colors.WHITE,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  headerMeta: {
    fontSize: 10,
    opacity: 0.9,
    marginTop: 6,
  },
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    border: 1,
    borderColor: Colors.MUTED,
    borderRadius: 10,
    padding: 14,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: Colors.TEXT_LIGHT,
    letterSpacing: 0.05,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: Colors.PRIMARY,
  },
  listCard: {
    backgroundColor: Colors.WHITE,
    border: 1,
    borderColor: Colors.MUTED,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.BACKGROUND,
    borderBottom: 2,
    borderBottomColor: Colors.MUTED,
  },
  tableHeaderCell: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: Colors.TEXT_LIGHT,
    letterSpacing: 0.05,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: Colors.BACKGROUND,
  },
  tableCell: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 11,
  },
  observationsCard: {
    backgroundColor: Colors.WHITE,
    border: 1,
    borderColor: Colors.MUTED,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  observationsTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: Colors.TEXT_LIGHT,
    letterSpacing: 0.05,
    marginBottom: 10,
  },
  observationItem: {
    fontSize: 11,
    color: Colors.TEXT,
    marginBottom: 6,
  },
});

export async function generateGestionAcademicaPDF(
  dto: GestionAcademicaPdfDto
): Promise<Buffer> {
  const generatedAt = new Date().toLocaleString('es-PE');
  const periodoNombre = dto.periodo?.nombre ?? '';

  const document = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', orientation: 'portrait', style: styles.page },
      React.createElement(View, { style: styles.body },
        // Header
        React.createElement(View, { style: styles.header },
          React.createElement(Text, { style: styles.headerTitle }, 'Reporte de Gestión Académica'),
          React.createElement(Text, { style: styles.headerMeta }, `Consolidado del periodo · ${periodoNombre}`)
        ),
        
        // Stat Cards
        React.createElement(View, { style: styles.statsRow },
          React.createElement(View, { style: styles.statCard },
            React.createElement(Text, { style: styles.statLabel }, 'Total Asignaciones'),
            React.createElement(Text, { style: styles.statValue }, dto.estadisticas.total_asignaciones)
          ),
          React.createElement(View, { style: styles.statCard },
            React.createElement(Text, { style: styles.statLabel }, 'Promedio Horas'),
            React.createElement(Text, { style: styles.statValue }, `${dto.estadisticas.media_horas}h`)
          )
        ),
        
        // Docentes List
        React.createElement(View, { style: styles.listCard },
          React.createElement(View, { style: styles.table },
            React.createElement(View, { style: styles.tableHeader },
              React.createElement(View, { style: [styles.tableHeaderCell, { flex: 3 }] },
                React.createElement(Text, null, 'Docente')
              ),
              React.createElement(View, { style: [styles.tableHeaderCell, { flex: 1, textAlign: 'right' }] },
                React.createElement(Text, null, 'Total Horas')
              )
            ),
            ...dto.docentes.map((docente, index) =>
              React.createElement(View, { key: index, style: styles.tableRow },
                React.createElement(View, { style: [styles.tableCell, { flex: 3 }] },
                  React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold' } }, docente.nombre)
                ),
                React.createElement(View, { style: [styles.tableCell, { flex: 1, textAlign: 'right' }] },
                  React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold', color: Colors.PRIMARY } }, `${docente.horas} hrs`)
                )
              )
            )
          )
        ),
        
        // Observaciones
        dto.estadisticas.observaciones.length > 0 && 
          React.createElement(View, { style: styles.observationsCard },
            React.createElement(Text, { style: styles.observationsTitle }, 'Observaciones'),
            ...dto.estadisticas.observaciones.map((obs, index) =>
              React.createElement(Text, { key: index, style: styles.observationItem }, `• ${obs}`)
            )
          )
      ),
      React.createElement(Footer, { generatedAt })
    )
  );

  const pdfBuffer = await renderToBuffer(document);
  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}
