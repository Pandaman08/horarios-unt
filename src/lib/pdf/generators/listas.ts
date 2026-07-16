import React from 'react';
import { Document, Page, StyleSheet, View, Text, renderToBuffer } from '@react-pdf/renderer';
import { Footer } from '../components/Footer';
import { Colors } from '../layout';
import type {
  ListReportPdfDto,
  DocenteListItem,
  CursoListItem,
  AmbienteListItem,
  PeriodoListItem,
} from '../types/listas';

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
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  headerMeta: {
    fontSize: 10,
    opacity: 0.9,
    marginTop: 5,
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
    paddingVertical: 9,
    paddingHorizontal: 12,
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
    paddingVertical: 7,
    paddingHorizontal: 12,
    fontSize: 10,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  badgeMuted: {
    backgroundColor: Colors.BACKGROUND,
    color: Colors.TEXT_LIGHT,
  },
  badgeTeoria: {
    backgroundColor: '#dbeafe',
    color: Colors.INFO,
  },
});

function generateDocenteRows(items: DocenteListItem[]) {
  return items.map((item, index) =>
    React.createElement(View, { key: index, style: styles.tableRow },
      React.createElement(View, { style: [styles.tableCell, { flex: 2 }] },
        React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold' } }, `${item.apellidos}, ${item.nombres}`)
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(Text, { style: { fontFamily: 'Courier' } }, item.codigo_docente ?? '—')
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(Text, null, item.grado_academico ?? '—')
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(View, { style: [styles.badge, styles.badgeMuted] },
          React.createElement(Text, null, item.categoria ?? '—')
        )
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(View, { style: [styles.badge, styles.badgeTeoria] },
          React.createElement(Text, null, item.modalidad ?? '—')
        )
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1.5 }] },
        React.createElement(Text, { style: { color: Colors.TEXT_LIGHT } }, item.correo_electronico ?? '—')
      )
    )
  );
}

function generateCursoRows(items: CursoListItem[]) {
  return items.map((item, index) =>
    React.createElement(View, { key: index, style: styles.tableRow },
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(View, { style: [styles.badge, styles.badgeMuted] },
          React.createElement(Text, null, item.ciclo?.numero ?? '—')
        )
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(Text, { style: { fontFamily: 'Courier', fontWeight: 700 } }, item.codigo ?? '—')
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 2.5 }] },
        React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold' } }, item.nombre ?? '—')
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 0.5, textAlign: 'center' }] },
        React.createElement(Text, null, item.horas_teoria ?? 0)
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 0.5, textAlign: 'center' }] },
        React.createElement(Text, null, item.horas_practica ?? 0)
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 0.5, textAlign: 'center' }] },
        React.createElement(Text, null, item.horas_laboratorio ?? 0)
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 0.5, textAlign: 'center' }] },
        React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold', color: Colors.PRIMARY } },
          (item.horas_teoria ?? 0) + (item.horas_practica ?? 0) + (item.horas_laboratorio ?? 0)
        )
      )
    )
  );
}

function generateAmbienteRows(items: AmbienteListItem[]) {
  return items.map((item, index) =>
    React.createElement(View, { key: index, style: styles.tableRow },
      React.createElement(View, { style: [styles.tableCell, { flex: 2 }] },
        React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold' } }, item.nombre ?? '—'),
        React.createElement(Text, { style: { fontSize: 8, color: Colors.TEXT_LIGHT } }, `CÓD: ${item.codigo ?? '—'}`)
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(View, { style: [styles.badge, styles.badgeMuted] },
          React.createElement(Text, null, (item.tipo ?? '').toUpperCase().replace('_', ' '))
        )
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1, textAlign: 'center' }] },
        React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold' } }, `${item.capacidad ?? 0} est.`)
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1.5 }] },
        React.createElement(Text, null, `${item.pabellon ?? '—'} / ${item.piso ?? '—'}`)
      )
    )
  );
}

function generatePeriodoRows(items: PeriodoListItem[]) {
  return items.map((item, index) =>
    React.createElement(View, { key: index, style: styles.tableRow },
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold', color: Colors.PRIMARY } }, item.codigo ?? '—')
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 2 }] },
        React.createElement(Text, null, item.nombre ?? '—')
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1, textAlign: 'center' }] },
        React.createElement(Text, null, `${item.anio ?? ''} - ${item.semestre === 1 ? 'I' : 'II'}`)
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 1 }] },
        React.createElement(View, { style: [styles.badge, styles.badgeMuted] },
          React.createElement(Text, null, (item.estado ?? '').toUpperCase())
        )
      ),
      React.createElement(View, { style: [styles.tableCell, { flex: 2 }] },
        React.createElement(Text, { style: { fontSize: 9 } },
          `${item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString() : '—'} al ${item.fecha_fin ? new Date(item.fecha_fin).toLocaleDateString() : '—'}`
        )
      )
    )
  );
}

async function generateListReportPdf<T>(
  dto: ListReportPdfDto<T>,
  tableHeaders: React.ReactNode[],
  generateRows: (items: T[]) => React.ReactNode[]
): Promise<Buffer> {
  const generatedAt = new Date().toLocaleString('es-PE');

  const document = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', orientation: 'portrait', style: styles.page },
      React.createElement(View, { style: styles.body },
        React.createElement(View, { style: styles.header },
          React.createElement(Text, { style: styles.headerTitle }, dto.title),
          React.createElement(Text, { style: styles.headerMeta }, dto.subtitle)
        ),

        React.createElement(View, { style: styles.listCard },
          React.createElement(View, { style: styles.table },
            React.createElement(View, { style: styles.tableHeader },
              ...tableHeaders.map((header, i) =>
                React.createElement(View, { key: i, style: [styles.tableHeaderCell, typeof header === 'number' ? { flex: header as number } : {}] },
                  typeof header === 'string' ? React.createElement(Text, null, header) : header
                )
              )
            ),
            ...generateRows(dto.items)
          )
        )
      ),
      React.createElement(Footer, { generatedAt })
    )
  );

  const pdfBuffer = await renderToBuffer(document);
  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}

export async function generateDocentesListPdf(
  dto: ListReportPdfDto<DocenteListItem>
): Promise<Buffer> {
  return generateListReportPdf(
    dto,
    ['Apellidos y Nombres', 'Código', 'Grado', 'Categoría', 'Modalidad', 'Correo'],
    generateDocenteRows
  );
}

export async function generateCursosListPdf(
  dto: ListReportPdfDto<CursoListItem>
): Promise<Buffer> {
  return generateListReportPdf(
    dto,
    ['Ciclo', 'Código', 'Asignatura', 'T', 'P', 'L', 'Total'],
    generateCursoRows
  );
}

export async function generateAmbientesListPdf(
  dto: ListReportPdfDto<AmbienteListItem>
): Promise<Buffer> {
  return generateListReportPdf(
    dto,
    ['Nombre / Código', 'Tipo', 'Capacidad', 'Pabellón / Piso'],
    generateAmbienteRows
  );
}

export async function generatePeriodosListPdf(
  dto: ListReportPdfDto<PeriodoListItem>
): Promise<Buffer> {
  return generateListReportPdf(
    dto,
    ['Código', 'Nombre', 'Año / Sem.', 'Estado', 'Inicio / Fin'],
    generatePeriodoRows
  );
}
