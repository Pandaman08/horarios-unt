import React from 'react';
import { Document, renderToBuffer, View } from '@react-pdf/renderer';
import { 
  Page, 
  Header, 
  Footer, 
  Table, 
  Card,
  SummaryCards,
  Text,
  Small
} from '../design';
import type { GestionAcademicaPdfDto } from '../types/gestionAcademica';
import { Colors } from '../styles';

export async function generateGestionAcademicaPDF(
  dto: GestionAcademicaPdfDto
): Promise<Buffer> {
  const periodoNombre = dto.periodo?.nombre ?? '';

  const columns = [
    { key: 'docente', header: 'Docente', width: '70%' },
    { key: 'horas', header: 'Total Horas', width: '30%', align: 'center' as const },
  ];

  const rows = dto.docentes.map(docente => ({
    docente: <Text weight="bold">{docente.nombre}</Text>,
    horas: <Text weight="bold" color={Colors.PRIMARY}>{`${docente.horas} hrs`}</Text>,
  }));

  const document = (
    <Document>
      <Page>
        <Header 
          title="Reporte de Gestión Académica" 
          subtitle={`Consolidado del periodo · ${periodoNombre}`} 
        />
        
        {/* Stats */}
        <SummaryCards 
          items={[
            { label: 'Total Asignaciones', value: dto.estadisticas.total_asignaciones },
            { label: 'Promedio Horas', value: `${dto.estadisticas.media_horas}h` },
          ]} 
        />
        
        {/* Docentes List */}
        <Table columns={columns} rows={rows} />
        
        {/* Observations */}
        {dto.estadisticas.observaciones.length > 0 && (
          <Card>
            <Small weight="bold">Observaciones</Small>
            <View style={{ marginTop: 10 }}>
              {dto.estadisticas.observaciones.map((obs, index) => (
                <Text key={index} style={{ marginBottom: 5 }}>• {obs}</Text>
              ))}
            </View>
          </Card>
        )}
      </Page>
      <Footer />
    </Document>
  );

  const pdfBuffer = await renderToBuffer(document);
  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}
