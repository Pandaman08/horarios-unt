import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocenteHorarioPdfDto, DocenteHorarioPdfItem } from '../types/docenteHorario';

// Define colors for each class type (same as ScheduleMatrix)
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
    display: 'flex',
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
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: 25,
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
  if (types.has('teoría') && types.has('práctica')) {
    // Combine teoría and práctica colors - gradient-like? Or a mix? Let's use a light lavender!
    return '#E6E6FA';
  }
  if (types.has('teoría')) return CLASS_COLORS.teoría.bg;
  if (types.has('práctica')) return CLASS_COLORS.práctica.bg;
  if (types.has('laboratorio')) return CLASS_COLORS.laboratorio.bg;
  return '#FFFFFF';
}

function buildSummaryRows(dto: DocenteHorarioPdfDto): Array<{
  no: number;
  asignatura: string;
  te: number;
  pr: number;
  lab: number;
  grupo: string;
  hrs: number;
  departamento: string;
  items: DocenteHorarioPdfItem[];
}> {
  const grouped = new Map<string, DocenteHorarioPdfItem[]>();

  for (const item of dto.horarios) {
    const key = `${item.curso?.nombre ?? 'Sin curso'}|${item.grupo?.codigo_grupo ?? '—'}`;
    const current = grouped.get(key) ?? [];
    current.push(item);
    grouped.set(key, current);
  }

  const rows: Array<{
    no: number;
    asignatura: string;
    te: number;
    pr: number;
    lab: number;
    grupo: string;
    hrs: number;
    departamento: string;
    items: DocenteHorarioPdfItem[];
  }> = [];

  let index = 1;
  for (const [key, items] of grouped.entries()) {
    const [asignatura, grupo] = key.split('|');
    let te = 0, pr = 0, lab = 0;

    for (const item of items) {
      const tipo = (item.tipo_clase ?? '').toLowerCase();
      if (tipo.includes('teoría') || tipo.includes('teoria')) te += 1;
      else if (tipo.includes('práctica') || tipo.includes('practica')) pr += 1;
      else if (tipo.includes('laboratorio') || tipo.includes('lab')) lab += 1;
      else te += 1;
    }

    rows.push({
      no: index++,
      asignatura: asignatura || 'Sin curso',
      te,
      pr,
      lab,
      grupo: grupo || '—',
      hrs: items.length,
      departamento: dto.escuela?.nombre ?? 'Ing. de Sistemas',
      items,
    });
  }

  return rows;
}

export function AsignaturaSummaryTable({ dto }: Readonly<{ dto: DocenteHorarioPdfDto }>): React.ReactElement {
  const rows = buildSummaryRows(dto);
  const widths = [30, 170, 25, 25, 25, 30, 30];

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        {['No', 'ASIGNATURA', 'T', 'P', 'L', 'G', 'HRS', 'DEPTO.'].map((header, index) => (
          <View
            key={header}
            style={[
              styles.headerCell,
              index === 7 ? { flex: 1, borderRightWidth: 0 } : { width: widths[index] },
            ]}
          >
            <Text style={styles.headerText}>{header}</Text>
          </View>
        ))}
      </View>
      {rows.map((row, rowIndex) => {
        const classTypes = getClassTypesFromItems(row.items);
        const bgColor = getRowBackgroundColor(classTypes);

        return (
          <View key={`${row.asignatura}-${row.grupo}-${row.no}`} style={[styles.row, { backgroundColor: bgColor }]}>
            {['no', 'asignatura', 'te', 'pr', 'lab', 'grupo', 'hrs'].map((key, index) => (
              <View
                key={key}
                style={[
                  styles.cell,
                  { width: widths[index], alignItems: key !== 'asignatura' ? 'center' : 'flex-start' },
                ]}
              >
                <Text style={[key === 'hrs' ? styles.textBold : styles.text, styles.center]}>
                  {row[key as keyof typeof row]}
                </Text>
              </View>
            ))}
            <View style={[styles.cell, { flex: 1, borderRightWidth: 0 }]}>
              <Text style={styles.text}>{row.departamento}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}