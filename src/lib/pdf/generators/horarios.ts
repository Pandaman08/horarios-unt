import React from 'react';
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { Footer } from '../components/Footer';
import type { HorarioReportePdfDto, HorarioReporteGroup, HorarioReportePdfItem } from '../types/horarios';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
    fontFamily: 'Helvetica',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  header: {
    backgroundColor: '#003366',
    color: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  headerMeta: {
    fontSize: 9,
    color: '#E2E8F0',
    marginTop: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  summaryValue: {
    fontSize: 12,
    color: '#003366',
    fontFamily: 'Helvetica-Bold',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#003366',
  },
  tableHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableCell: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 8,
    color: '#1F2937',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  badgeMuted: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  badgeBlue: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  badgePurple: {
    backgroundColor: '#EDE9FE',
    color: '#6D28D9',
  },
});

function getDiaLabel(dayIndex: number | null | undefined): string {
  return DAYS[Number(dayIndex ?? 0)] ?? '—';
}

function formatTipo(tipo?: string | null): string {
  const normalized = (tipo ?? 'TEORÍA').replace('_', ' ');
  return normalized.toUpperCase();
}

function buildRows(items: HorarioReportePdfItem[]) {
  return items
    .slice()
    .sort((a, b) => (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? ''))
    .map((item, index) => {
      const curso = item.curso?.nombre ?? '—';
      const grupo = item.grupo?.codigo_grupo ?? '—';
      const docente = item.docente ? `${item.docente.nombres ?? ''} ${item.docente.apellidos ?? ''}`.trim() : '—';
      const ambiente = item.ambiente?.nombre ?? '—';
      const ciclo = item.curso?.ciclo_rel?.numero ?? '—';

      return React.createElement(
        View,
        { key: `${item.id_asignacion ?? index}-${item.hora_inicio}-${item.hora_fin}`, style: styles.tableRow },
        React.createElement(View, { style: [styles.tableCell, { flex: 1.1 }] },
          React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold', color: '#003366' } }, `${item.hora_inicio ?? '—'} - ${item.hora_fin ?? '—'}`),
          React.createElement(Text, { style: { fontSize: 7, color: '#64748B' } }, `${getDiaLabel(item.dia_semana)}`),
        ),
        React.createElement(View, { style: [styles.tableCell, { flex: 0.7, textAlign: 'center' }] },
          React.createElement(View, { style: [styles.badge, styles.badgeMuted] },
            React.createElement(Text, null, `${ciclo}`),
          ),
        ),
        React.createElement(View, { style: [styles.tableCell, { flex: 2.8 }] },
          React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold' } }, curso),
          React.createElement(Text, { style: { fontSize: 7, color: '#64748B' } }, `Grupo: ${grupo}`),
        ),
        React.createElement(View, { style: [styles.tableCell, { flex: 2.2 }] },
          React.createElement(Text, null, docente),
        ),
        React.createElement(View, { style: [styles.tableCell, { flex: 1.4 }] },
          React.createElement(View, { style: [styles.badge, styles.badgeBlue] },
            React.createElement(Text, null, ambiente),
          ),
        ),
        React.createElement(View, { style: [styles.tableCell, { flex: 1.2 }] },
          React.createElement(View, { style: [styles.badge, styles.badgePurple] },
            React.createElement(Text, null, formatTipo(item.tipo_clase)),
          ),
        ),
      );
    });
}

function buildReportPage(group: HorarioReporteGroup, dto: HorarioReportePdfDto, pageIndex: number) {
  const totalItems = group.items.length;
  const periodoText = dto.periodo?.nombre ? `${dto.periodo.nombre} · ${dto.periodo.anio ?? ''}` : 'Periodo no definido';

  return React.createElement(
    Page,
    { key: `${group.title}-${pageIndex}`, size: 'A4', orientation: 'landscape', style: styles.page },
    React.createElement(View, { style: styles.body },
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, dto.title),
        React.createElement(Text, { style: styles.headerMeta }, `${dto.subtitle} · ${periodoText}`),
      ),
      React.createElement(View, { style: styles.card },
        React.createElement(View, { style: styles.summaryBar },
          React.createElement(View, null,
            React.createElement(Text, { style: styles.summaryLabel }, group.title),
            group.subtitle ? React.createElement(Text, { style: { fontSize: 8, color: '#475569' } }, group.subtitle) : null,
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: styles.summaryValue }, `${totalItems} clases`),
          ),
        ),
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(View, { style: [styles.tableHeaderCell, { flex: 1.1 }] }, React.createElement(Text, null, 'Horario')),
          React.createElement(View, { style: [styles.tableHeaderCell, { flex: 0.7 }] }, React.createElement(Text, null, 'Ciclo')),
          React.createElement(View, { style: [styles.tableHeaderCell, { flex: 2.8 }] }, React.createElement(Text, null, 'Curso / Grupo')),
          React.createElement(View, { style: [styles.tableHeaderCell, { flex: 2.2 }] }, React.createElement(Text, null, 'Docente')),
          React.createElement(View, { style: [styles.tableHeaderCell, { flex: 1.4 }] }, React.createElement(Text, null, 'Ambiente')),
          React.createElement(View, { style: [styles.tableHeaderCell, { flex: 1.2 }] }, React.createElement(Text, null, 'Tipo')),
        ),
        ...buildRows(group.items),
      ),
      React.createElement(Footer, { generatedAt: new Date().toLocaleString('es-PE') }),
    ),
  );
}

export async function generateHorarioConsolidadoPdf(dto: HorarioReportePdfDto): Promise<Buffer> {
  const document = React.createElement(
    Document,
    null,
    ...dto.groups.map((group, index) => buildReportPage(group, dto, index)),
  );

  const pdfBuffer = await renderToBuffer(document);
  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}
