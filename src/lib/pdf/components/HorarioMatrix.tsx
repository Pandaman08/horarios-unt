import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocenteHorarioPdfItem } from '../types/docenteHorario';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_TIME_SLOTS: string[] = [];
for (let hour = 7; hour <= 21; hour++) {
  DEFAULT_TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:00`);
}

const styles = StyleSheet.create({
  table: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#003366',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#003366',
  },
  headerCell: {
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRightWidth: 1,
    borderRightColor: '#1E4D80',
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
    minHeight: 24,
  },
  hourCell: {
    width: 45,
    paddingVertical: 2,
    paddingHorizontal: 2,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  hourText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    minHeight: 22,
    padding: 2,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#EAF3FF',
    borderLeftWidth: 3,
    borderLeftColor: '#003366',
    borderRadius: 2,
    padding: 2,
    marginBottom: 1,
  },
  title: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
    marginBottom: 1,
  },
  meta: {
    fontSize: 7,
    color: '#1E40AF',
    lineHeight: 1.1,
  },
  empty: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

function formatTimeInterval(horaInicio: string): string {
  const [startHour] = horaInicio.split(':').map(Number);
  const endHour = startHour + 1;
  return `${startHour}-${endHour}`;
}

function buildRows(items: DocenteHorarioPdfItem[]) {
  const groupedByDay = new Map<number, DocenteHorarioPdfItem[]>();
  for (const item of items) {
    const dayKey = Number(item.dia_semana ?? 0);
    const current = groupedByDay.get(dayKey) ?? [];
    current.push(item);
    groupedByDay.set(dayKey, current);
  }

  return DEFAULT_TIME_SLOTS.map((horaInicio) => ({
    horaInicio,
    itemsByDay: DAYS.map((_, dayIndex) => (groupedByDay.get(dayIndex) ?? []).filter((item) => item.hora_inicio === horaInicio)),
  }));
}

function ScheduleCell({ items }: Readonly<{ items: DocenteHorarioPdfItem[] }>): React.ReactElement {
  if (!items.length) {
    return (
      <View style={styles.cell}>
        <Text style={styles.empty}>—</Text>
      </View>
    );
  }

  return (
    <View style={styles.cell}>
      {items.map((item, index) => {
        const docente = `${item.docente?.nombres ?? ''} ${item.docente?.apellidos ?? ''}`.trim();
        const curso = item.curso?.nombre ?? 'Sin curso';
        const grupo = item.grupo?.codigo_grupo ?? '—';
        const ambiente = item.ambiente?.nombre ?? '—';

        return (
          <View key={`${item.id_asignacion ?? index}-${item.hora_inicio}-${item.hora_fin}`} style={styles.card}>
            <Text style={styles.title}>{docente || 'Docente'}</Text>
            <Text style={styles.meta}>{curso}</Text>
            <Text style={styles.meta}>G: {grupo} · A: {ambiente}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function HorarioMatrix({ items }: Readonly<{ items: DocenteHorarioPdfItem[] }>): React.ReactElement {
  const rows = buildRows(items);

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        {['HORA', ...DAYS, 'HORA'].map((header, index) => (
          <View
            key={`${header}-${index}`}
            style={[styles.headerCell, index === 0 || index === 7 ? { width: 45 } : { flex: 1 }]}
          >
            <Text style={styles.headerText}>{header}</Text>
          </View>
        ))}
      </View>

      {rows.map((row) => {
        const timeInterval = formatTimeInterval(row.horaInicio);
        return (
          <View key={row.horaInicio} style={styles.row}>
            <View style={styles.hourCell}>
              <Text style={styles.hourText}>{timeInterval}</Text>
            </View>
            {row.itemsByDay.map((dayItems, index) => (
              <ScheduleCell key={`${row.horaInicio}-${DAYS[index]}`} items={dayItems} />
            ))}
            <View style={styles.hourCell}>
              <Text style={styles.hourText}>{timeInterval}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
