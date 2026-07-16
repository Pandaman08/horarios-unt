import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocenteHorarioPdfDto, DocenteHorarioPdfItem } from '../types/docenteHorario';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
// Generate time slots from 07:00 to 21:00
const DEFAULT_TIME_SLOTS: string[] = [];
for (let hour = 7; hour <= 21; hour++) {
  DEFAULT_TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:00`);
}

// Define colors for each class type
const CLASS_COLORS = {
  teoría: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  práctica: { bg: '#EDE9FE', border: '#8B5CF6', text: '#5B21B6' },
  laboratorio: { bg: '#DCFCE7', border: '#22C55E', text: '#15803D' },
  default: { bg: '#F3F4F6', border: '#6B7280', text: '#374151' },
};

const styles = StyleSheet.create({
  table: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#003366',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    display: 'flex',
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
    display: 'flex',
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
    marginBottom: 1,
  },
  meta: {
    fontSize: 7,
    lineHeight: 1.1,
  },
  empty: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
  almuerzoRow: {
    backgroundColor: '#D3D3D3',
    minHeight: 18,
  },
  almuerzoCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#A9A9A9',
    borderBottomWidth: 1,
    borderBottomColor: '#A9A9A9',
  },
  almuerzoText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    letterSpacing: 3,
  },
});

function compareHora(a: string | null, b: string | null): number {
  const getMinutes = (value: string | null): number => {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  };

  return getMinutes(a) - getMinutes(b);
}

function buildRows(dto: DocenteHorarioPdfDto): Array<{ horaInicio: string; itemsByDay: DocenteHorarioPdfItem[][] }> {
  const groupedByDay = new Map<number, DocenteHorarioPdfItem[]>();

  for (const item of dto.horarios) {
    const dayKey = Number(item.dia_semana ?? 0);
    const current = groupedByDay.get(dayKey) ?? [];
    current.push(item);
    groupedByDay.set(dayKey, current);
  }

  // Always use all default time slots (7 AM to 9 PM)
  const timeSlots = DEFAULT_TIME_SLOTS;

  return timeSlots.map((horaInicio) => ({
    horaInicio,
    itemsByDay: DAYS.map((_, dayIndex) => (groupedByDay.get(dayIndex) ?? []).filter((item) => item.hora_inicio === horaInicio)),
  }));
}

function formatTimeInterval(horaInicio: string): string {
  const [startHour] = horaInicio.split(':').map(Number);
  const endHour = startHour + 1;
  return `${startHour}-${endHour}`;
}

function getClassColors(tipoClase?: string) {
  const tipo = (tipoClase ?? '').toLowerCase();
  if (tipo.includes('teoría') || tipo.includes('teoria')) return CLASS_COLORS.teoría;
  if (tipo.includes('práctica') || tipo.includes('practica')) return CLASS_COLORS.práctica;
  if (tipo.includes('laboratorio') || tipo.includes('lab')) return CLASS_COLORS.laboratorio;
  return CLASS_COLORS.default;
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
        const grupo = item.grupo?.codigo_grupo ?? '—';
        const aula = item.ambiente?.nombre ?? '—';
        const tipo = item.tipo_clase ?? '—';
        const curso = item.curso?.nombre ?? 'Sin curso';
        const ciclo = item.curso?.ciclo_rel?.numero ?? '';
        const colors = getClassColors(tipo);

        const cardStyle = StyleSheet.create({
          card: {
            backgroundColor: colors.bg,
            borderLeftWidth: 3,
            borderLeftColor: colors.border,
            borderRadius: 2,
            padding: 1,
            marginBottom: 1,
          },
          title: {
            ...styles.title,
            color: colors.text,
          },
          meta: {
            ...styles.meta,
            color: colors.text,
            opacity: 0.85,
          },
        });

        return (
          <View key={`${item.id_asignacion ?? index}-${item.hora_inicio}-${item.hora_fin}`} style={cardStyle.card}>
            <Text style={cardStyle.title}>{curso}</Text>
            {ciclo ? <Text style={cardStyle.meta}>{ciclo}° Ciclo</Text> : null}
            <Text style={cardStyle.meta}>G: {grupo} · A: {aula}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ScheduleMatrix({ dto }: Readonly<{ dto: DocenteHorarioPdfDto }>): React.ReactElement {
  const rows = buildRows(dto);

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
        const isAlmuerzo = row.horaInicio === '13:00';

        if (isAlmuerzo) {
          return (
            <View key={row.horaInicio} style={[styles.row, styles.almuerzoRow]}>
              <View style={styles.hourCell}>
                <Text style={styles.hourText}>{timeInterval}</Text>
              </View>
              <View style={[styles.almuerzoCell, { flex: 6 }]}>
                <Text style={styles.almuerzoText}>ALMUERZO</Text>
              </View>
              <View style={styles.hourCell}>
                <Text style={styles.hourText}>{timeInterval}</Text>
              </View>
            </View>
          );
        }

        return (
          <View key={row.horaInicio} style={styles.row}>
            <View style={styles.hourCell}>
              <Text style={styles.hourText}>{timeInterval}</Text>
            </View>
            {row.itemsByDay.map((items, index) => (
              <ScheduleCell key={`${row.horaInicio}-${DAYS[index]}`} items={items} />
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