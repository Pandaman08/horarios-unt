import { StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  text: {
    fontSize: 6.8,
    color: '#6B7280',
  },
});

export function Footer({ generatedAt }: { generatedAt: string }): React.ReactElement {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.text}>Sistema de Gestión Académica</Text>
      <Text style={styles.text}>{generatedAt}</Text>
      <Text style={styles.text}>Página {1}</Text>
    </View>
  );
}
