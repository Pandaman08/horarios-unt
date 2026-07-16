import React from 'react';
import { Document, renderToBuffer, View, StyleSheet } from '@react-pdf/renderer';
import { 
  Page, 
  Header, 
  Footer, 
  Table, 
  Card,
  Text,
  H3
} from '../design';
import { Colors, Spacing } from '../styles';

interface Docente {
  nombres: string;
  apellidos: string;
  dni?: string | null;
  departamentoId?: string | number | null;
}

interface Sede {
  nombre: string;
}

interface Horario {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

interface Clad {
  curso: string;
  dependencia: string;
  numeroResolucion?: string | null;
  fechaInicio: Date;
  fechaFin: Date;
  totalHoras: number;
  observaciones?: string | null;
  docente: Docente;
  sede: Sede;
  horarios: Horario[];
  validador?: Docente | null;
}

const DEPENDENCIAS_LABEL: Record<string, string> = {
  FILIAL: 'Filial',
  POSGRADO: 'Posgrado',
  'SEGUNDA_ESPECIALIDAD': 'Segunda Especialidad',
  'CENTRO_PRODUCCION': 'Centro de Producción',
  'EXTENSION_UNIVERSITARIA': 'Extensión Universitaria'
};

const DIAS_LABEL: Record<string, string> = {
  LU: 'Lunes',
  MA: 'Martes',
  MI: 'Miércoles',
  JU: 'Jueves',
  VI: 'Viernes',
  SA: 'Sábado'
};

const styles = StyleSheet.create({
  firmaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.XXXL * 2,
  },
  firmaColumn: {
    width: '22%',
    alignItems: 'center',
  },
  firmaLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.TEXT,
    marginBottom: Spacing.SM,
  },
});

export async function generateCladPDF(clad: Clad): Promise<Buffer> {
  const columns = [
    { key: 'curso', header: 'CURSO', width: '14%' },
    { key: 'dependencia', header: 'DEPENDENCIA', width: '14%' },
    { key: 'resolucion', header: 'N° RESOLUCIÓN', width: '14%', align: 'center' as const },
    { key: 'inicio', header: 'FECHA INICIO', width: '14%', align: 'center' as const },
    { key: 'fin', header: 'FECHA FIN', width: '14%', align: 'center' as const },
    { key: 'horas', header: 'TOTAL HORAS', width: '14%', align: 'center' as const },
    { key: 'horario', header: 'HORARIO', width: '16%' },
  ];

  const rows = [{
    curso: clad.curso,
    dependencia: DEPENDENCIAS_LABEL[clad.dependencia] ?? clad.dependencia,
    resolucion: clad.numeroResolucion ?? '—',
    inicio: new Date(clad.fechaInicio).toLocaleDateString('es-PE'),
    fin: new Date(clad.fechaFin).toLocaleDateString('es-PE'),
    horas: clad.totalHoras,
    horario: clad.horarios.map(h => `${DIAS_LABEL[h.dia] ?? h.dia}: ${h.horaInicio} - ${h.horaFin}`).join('\n'),
  }];

  const document = (
    <Document>
      <Page>
        <Header 
          title="CARGA LECTIVA ADICIONAL (CLAD)" 
          showUniversityInfo 
        />
        
        <Card>
          <H3>Información del Docente</H3>
          <View style={{ marginTop: Spacing.MD }}>
            <Text>DOCENTE: {clad.docente.nombres} {clad.docente.apellidos}</Text>
            <Text>DNI: {clad.docente.dni ?? '—'}</Text>
            <Text>DPTO. ACADÉMICO: Ingeniería de Sistemas</Text>
            <Text>FACULTAD: {clad.sede.nombre}</Text>
          </View>
        </Card>

        <View style={{ marginTop: Spacing.LG }}>
          <Table columns={columns} rows={rows} showAlternatingRows={false} />
        </View>

        {clad.observaciones && (
          <View style={{ marginTop: Spacing.LG }}>
            <Card>
              <H3>Observaciones</H3>
              <Text style={{ marginTop: Spacing.SM }}>{clad.observaciones}</Text>
            </Card>
          </View>
        )}

        {/* Firmas */}
        <View style={styles.firmaRow}>
          <View style={styles.firmaColumn}>
            <View style={styles.firmaLine} />
            <Text align="center" weight="bold">Profesor</Text>
            <Text align="center" size={10}>{clad.docente.nombres} {clad.docente.apellidos}</Text>
          </View>
          <View style={styles.firmaColumn}>
            <View style={styles.firmaLine} />
            <Text align="center" weight="bold">Director de Departamento</Text>
            <Text align="center" size={10}>{clad.validador ? `${clad.validador.nombres} ${clad.validador.apellidos}` : '—'}</Text>
          </View>
          <View style={styles.firmaColumn}>
            <View style={styles.firmaLine} />
            <Text align="center" weight="bold">Decano</Text>
            <Text align="center" size={10}>—</Text>
          </View>
          <View style={styles.firmaColumn}>
            <View style={styles.firmaLine} />
            <Text align="center" weight="bold">Director de {DEPENDENCIAS_LABEL[clad.dependencia] ?? 'Unidad Académica'}</Text>
            <Text align="center" size={10}>—</Text>
          </View>
        </View>
      </Page>
      <Footer />
    </Document>
  );

  const pdfBuffer = await renderToBuffer(document);
  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}
