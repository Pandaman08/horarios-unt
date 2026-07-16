import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocenteHorarioPdfDto, DocenteHorarioPdfItem } from '../types/docenteHorario';
import { ScheduleCell } from './ScheduleCell';
import { TableHeader } from './TableHeader';

const DAYS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
const DEFAULT_TIME_SLOTS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  hourCell: {
    width: 60,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  hourText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'center',
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

  const extractedTimeSlots = Array.from(
    new Set(
      dto.horarios
        .map((item) => item.hora_inicio ?? null)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  ).sort(compareHora);

  const timeSlots = extractedTimeSlots.length > 0 ? extractedTimeSlots : DEFAULT_TIME_SLOTS;

  return timeSlots.map((horaInicio) => ({
    horaInicio,
    itemsByDay: DAYS.map((_, dayIndex) => (groupedByDay.get(dayIndex) ?? []).filter((item) => item.hora_inicio === horaInicio)),
  }));
}

export function ScheduleTable({ dto }: { dto: DocenteHorarioPdfDto }): JSX.Element {
  const rows = buildRows(dto);
  const widths = [60, 120, 120, 120, 120, 120, 120];

  return (
    <View style={styles.table}>
      <TableHeader widths={widths} />
      {rows.map((row) => (
        <View key={row.horaInicio} style={styles.row}>
          <View style={styles.hourCell}>
            <Text style={styles.hourText}>{row.horaInicio}</Text>
          </View>
          {row.itemsByDay.map((items, index) => (
            <ScheduleCell key={`${row.horaInicio}-${DAYS[index]}`} items={items} />
          ))}
        </View>
      ))}
    </View>
  );
}
