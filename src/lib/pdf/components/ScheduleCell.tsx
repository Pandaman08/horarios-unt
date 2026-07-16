import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocenteHorarioPdfItem } from '../types/docenteHorario';

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    minHeight: 48,
    padding: 6,
    borderWidth: 1,
    borderColor: '#D8E2F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#EAF3FF',
    borderLeftWidth: 3,
    borderLeftColor: '#003366',
    borderRadius: 5,
    padding: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  meta: {
    fontSize: 7.5,
    color: '#334155',
    lineHeight: 1.25,
  },
  empty: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export function ScheduleCell({ items }: { items: DocenteHorarioPdfItem[] }): React.ReactElement {
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

        return (
          <View key={`${item.id_asignacion ?? index}-${item.hora_inicio}-${item.hora_fin}`} style={styles.card}>
            <Text style={styles.title}>{curso}</Text>
            <Text style={styles.meta}>Grupo: {grupo}</Text>
            <Text style={styles.meta}>Aula: {aula}</Text>
            <Text style={styles.meta}>Tipo: {tipo}</Text>
          </View>
        );
      })}
    </View>
  );
}
