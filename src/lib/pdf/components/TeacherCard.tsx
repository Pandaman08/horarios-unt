import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocenteHorarioPdfDto } from '../types/docenteHorario';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
    backgroundColor: '#F9FBFE',
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    width: '50%',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  label: {
    fontSize: 7.2,
    color: '#6B7280',
    fontFamily: 'Helvetica',
    marginRight: 4,
  },
  value: {
    fontSize: 7.8,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
});

export function TeacherCard({ dto }: { dto: DocenteHorarioPdfDto }): React.ReactElement {
  const docente = `${dto.docente.nombres} ${dto.docente.apellidos}`.trim();
  const codigo = dto.docente.codigo_docente ?? '—';
  const departamento = dto.escuela?.nombre ?? '—';
  const categoria = '—';
  const condicion = '—';
  const horas = `${dto.resumen.totalHoras.toFixed(2)} h`;
  const cargaLectiva = dto.resumen.totalClases;
  const cargaNoLectiva = dto.resumen.totalNoLectivas ?? 0;
  const total = dto.resumen.totalClases + cargaNoLectiva;

  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        <View style={styles.column}>
          <View style={styles.row}><Text style={styles.label}>Nombre:</Text><Text style={styles.value}>{docente}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Código:</Text><Text style={styles.value}>{codigo}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Departamento:</Text><Text style={styles.value}>{departamento}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Categoría:</Text><Text style={styles.value}>{categoria}</Text></View>
        </View>
        <View style={styles.column}>
          <View style={styles.row}><Text style={styles.label}>Condición:</Text><Text style={styles.value}>{condicion}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Horas:</Text><Text style={styles.value}>{horas}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Carga lectiva:</Text><Text style={styles.value}>{cargaLectiva}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Carga no lectiva:</Text><Text style={styles.value}>{cargaNoLectiva}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total:</Text><Text style={styles.value}>{total}</Text></View>
        </View>
      </View>
    </View>
  );
}
