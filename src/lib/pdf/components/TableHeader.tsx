import { StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#003366',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  cell: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D8E2F0',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
});

export function TableHeader({ widths }: { widths: number[] }): React.ReactElement {
  const headers = ['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <View style={styles.headerRow}>
      {headers.map((header, index) => (
        <View key={header} style={[styles.cell, { width: widths[index] }]}>
          <Text style={styles.text}>{header}</Text>
        </View>
      ))}
    </View>
  );
}
