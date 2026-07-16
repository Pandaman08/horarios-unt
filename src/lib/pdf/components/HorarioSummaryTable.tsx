import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocenteHorarioPdfItem } from '../types/docenteHorario';

const CLASS_COLORS = {
  teoría: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  práctica: { bg: '#EDE9FE', border: '#8B5CF6', text: '#5B21B6' },
  laboratorio: { bg: '#DCFCE7', border: '#22C55E', text: '#15803D' },
  default: { bg: '#F3F4F6', border: '#6B7280', text: '#374151' },
};

const styles = StyleSheet.create({
  table: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#003366',
    marginBottom: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#003366',
    minHeight: 28,
  },
  headerCell: {
    borderRightWidth: 1,
    borderRightColor: '#1E4D80',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    minHeight: 26,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
  },
  cell: {
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    padding: 4,
    justifyContent: 'center',
  },
  text: {
    fontSize: 8,
    color: '#000000',
    fontFamily: 'Helvetica',
  },
  textBold: {
    fontSize: 8,
    color: '#000000',
    fontFamily: 'Helvetica-Bold',
  },
  center: {
    textAlign: 'center',
  },
});

function getClassTypesFromItems(items: DocenteHorarioPdfItem[]): Set<string> {
  const types = new Set<string>();
  for (const item of items) {
    const tipo = (item.tipo_clase ?? '').toLowerCase();
    if (tipo.includes('teoría') || tipo.includes('teoria')) types.add('teoría');
    if (tipo.includes('práctica') || tipo.includes('practica')) types.add('práctica');
    if (tipo.includes('laboratorio') || tipo.includes('lab')) types.add('laboratorio');
  }
  return types;
}

function getRowBackgroundColor(types: Set<string>): string {
  if (types.has('teoría') && types.has('práctica')) return '#E6E6FA';
  if (types.has('teoría')) return CLASS_COLORS.teoría.bg;
  if (types.has('práctica')) return CLASS_COLORS.práctica.bg;
  if (types.has('laboratorio')) return CLASS_COLORS.laboratorio.bg;
  return '#FFFFFF';
}

function buildSummaryRows(items: DocenteHorarioPdfItem[]) {
  const grouped = new Map<string, DocenteHorarioPdfItem[]>();

  for (const item of items) {
    const key = `${item.curso?.nombre ?? 'Sin curso'}|${item.grupo?.codigo_grupo ?? '—'}`;
    const current = grouped.get(key) ?? [];
    current.push(item);
    grouped.set(key, current);
  }

  let index = 1;
  const rows = Array.from(grouped.entries()).map(([key, rowItems]) => {
    const [asignatura, grupo] = key.split('|');
    const docentes = Array.from(new Set(
      rowItems
        .map((item) => `${item.docente?.nombres ?? ''} ${item.docente?.apellidos ?? ''}`.trim())
        .filter(Boolean)
    )).join(', ');

    let te = 0;
    let pr = 0;
    let lab = 0;
    for (const item of rowItems) {
      const tipo = (item.tipo_clase ?? '').toLowerCase();
      if (tipo.includes('teoría') || tipo.includes('teoria')) te += 1;
      else if (tipo.includes('práctica') || tipo.includes('practica')) pr += 1;
      else if (tipo.includes('laboratorio') || tipo.includes('lab')) lab += 1;
      else te += 1;
    }

    return {
      no: index++,
      professores: docentes || '—',
      asignatura: asignatura || 'Sin curso',
      te,
      pr,
      lab,
      grupo: grupo || '—',
      hrs: rowItems.length,
      departamento: 'Ing. de Sistemas',
      items: rowItems,
    };
  });

  return rows;
}

export function HorarioSummaryTable({ items }: Readonly<{ items: DocenteHorarioPdfItem[] }>): React.ReactElement {
  const rows = buildSummaryRows(items);
  const widths = [28, 110, 110, 26, 26, 26, 28, 34, 70];

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        {['N°', 'PROFESORES', 'ASIGNATURA', 'T', 'P', 'L', 'G', 'HRS', 'DEPTO.'].map((header, index) => (
          <View
            key={header}
            style={[
              styles.headerCell,
              index === 8 ? { flex: 1, borderRightWidth: 0 } : { width: widths[index] },
            ]}
          >
            <Text style={styles.headerText}>{header}</Text>
          </View>
        ))}
      </View>

      {rows.map((row) => {
        const classTypes = getClassTypesFromItems(row.items);
        const bgColor = getRowBackgroundColor(classTypes);

        return (
          <View key={`${row.asignatura}-${row.grupo}-${row.no}`} style={[styles.row, { backgroundColor: bgColor }]}>
            <View style={[styles.cell, { width: widths[0], alignItems: 'center' }]}>
              <Text style={[styles.text, styles.center]}>{row.no}</Text>
            </View>
            <View style={[styles.cell, { width: widths[1] }]}>
              <Text style={styles.text}>{row.professores}</Text>
            </View>
            <View style={[styles.cell, { width: widths[2] }]}>
              <Text style={styles.textBold}>{row.asignatura}</Text>
            </View>
            <View style={[styles.cell, { width: widths[3], alignItems: 'center' }]}>
              <Text style={[styles.text, styles.center]}>{row.te}</Text>
            </View>
            <View style={[styles.cell, { width: widths[4], alignItems: 'center' }]}>
              <Text style={[styles.text, styles.center]}>{row.pr}</Text>
            </View>
            <View style={[styles.cell, { width: widths[5], alignItems: 'center' }]}>
              <Text style={[styles.text, styles.center]}>{row.lab}</Text>
            </View>
            <View style={[styles.cell, { width: widths[6], alignItems: 'center' }]}>
              <Text style={[styles.text, styles.center]}>{row.grupo}</Text>
            </View>
            <View style={[styles.cell, { width: widths[7], alignItems: 'center' }]}>
              <Text style={[styles.textBold, styles.center]}>{row.hrs}</Text>
            </View>
            <View style={[styles.cell, { flex: 1, borderRightWidth: 0 }]}>
              <Text style={styles.text}>{row.departamento}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
