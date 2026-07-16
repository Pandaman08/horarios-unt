import React from 'react';
import { Document, renderToBuffer, View } from '@react-pdf/renderer';
import { 
  Page, 
  Header, 
  Footer, 
  Table, 
  Badge, 
  SummaryCards,
  Text 
} from '../design';
import type {
  ListReportPdfDto,
  DocenteListItem,
  CursoListItem,
  AmbienteListItem,
  PeriodoListItem,
} from '../types/listas';

async function generateListReportPdf<T>(
  dto: ListReportPdfDto<T>,
  columns: any[],
  mapRow: (item: T, index: number) => any
): Promise<Buffer> {
  const rows = dto.items.map((item, index) => mapRow(item, index));

  const document = (
    <Document>
      <Page>
        <Header title={dto.title} subtitle={dto.subtitle} />
        {dto.items.length > 0 && <SummaryCards items={[{ label: 'Total de registros', value: dto.items.length }]} />}
        <Table columns={columns} rows={rows} />
      </Page>
      <Footer />
    </Document>
  );

  const pdfBuffer = await renderToBuffer(document);
  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}

export async function generateDocentesListPdf(
  dto: ListReportPdfDto<DocenteListItem>
): Promise<Buffer> {
  const columns = [
    { key: 'nombre', header: 'Apellidos y Nombres', width: '30%' },
    { key: 'codigo', header: 'Código', width: '15%', align: 'center' as const },
    { key: 'grado', header: 'Grado', width: '15%', align: 'center' as const },
    { key: 'categoria', header: 'Categoría', width: '15%', align: 'center' as const },
    { key: 'modalidad', header: 'Modalidad', width: '15%', align: 'center' as const },
    { key: 'correo', header: 'Correo', width: '10%' },
  ];

  const mapRow = (item: DocenteListItem) => ({
    nombre: <Badge variant="muted">{`${item.apellidos}, ${item.nombres}`}</Badge>,
    codigo: item.codigo_docente ?? '—',
    grado: item.grado_academico ?? '—',
    categoria: <Badge variant="muted">{item.categoria ?? '—'}</Badge>,
    modalidad: <Badge variant="primary">{item.modalidad ?? '—'}</Badge>,
    correo: item.correo_electronico ?? '—',
  });

  return generateListReportPdf(dto, columns, mapRow);
}

export async function generateCursosListPdf(
  dto: ListReportPdfDto<CursoListItem>
): Promise<Buffer> {
  const columns = [
    { key: 'ciclo', header: 'Ciclo', width: '10%', align: 'center' as const },
    { key: 'codigo', header: 'Código', width: '15%', align: 'center' as const },
    { key: 'nombre', header: 'Asignatura', width: '40%' },
    { key: 't', header: 'T', width: '10%', align: 'center' as const },
    { key: 'p', header: 'P', width: '10%', align: 'center' as const },
    { key: 'l', header: 'L', width: '10%', align: 'center' as const },
    { key: 'total', header: 'Total', width: '5%', align: 'center' as const },
  ];

  const mapRow = (item: CursoListItem) => {
    const total = (item.horas_teoria ?? 0) + (item.horas_practica ?? 0) + (item.horas_laboratorio ?? 0);
    return {
      ciclo: <Badge variant="muted">{item.ciclo?.numero ?? '—'}</Badge>,
      codigo: item.codigo ?? '—',
      nombre: item.nombre ?? '—',
      t: item.horas_teoria ?? 0,
      p: item.horas_practica ?? 0,
      l: item.horas_laboratorio ?? 0,
      total: <Badge variant="primary">{total}</Badge>,
    };
  };

  return generateListReportPdf(dto, columns, mapRow);
}

export async function generateAmbientesListPdf(
  dto: ListReportPdfDto<AmbienteListItem>
): Promise<Buffer> {
  const columns = [
    { key: 'nombre', header: 'Nombre / Código', width: '40%' },
    { key: 'tipo', header: 'Tipo', width: '20%', align: 'center' as const },
    { key: 'capacidad', header: 'Capacidad', width: '20%', align: 'center' as const },
    { key: 'ubicacion', header: 'Pabellón / Piso', width: '20%', align: 'center' as const },
  ];

  const mapRow = (item: AmbienteListItem) => ({
    nombre: (
      <View>
        <Text weight="bold">{item.nombre ?? '—'}</Text>
        <Text size={8} color="#64748b">CÓD: {item.codigo ?? '—'}</Text>
      </View>
    ),
    tipo: <Badge variant="muted">{(item.tipo ?? '').toUpperCase().replace('_', ' ')}</Badge>,
    capacidad: `${item.capacidad ?? 0} est.`,
    ubicacion: `${item.pabellon ?? '—'} / ${item.piso ?? '—'}`,
  });

  return generateListReportPdf(dto, columns, mapRow);
}

export async function generatePeriodosListPdf(
  dto: ListReportPdfDto<PeriodoListItem>
): Promise<Buffer> {
  const columns = [
    { key: 'codigo', header: 'Código', width: '15%', align: 'center' as const },
    { key: 'nombre', header: 'Nombre', width: '30%' },
    { key: 'periodo', header: 'Año / Sem.', width: '15%', align: 'center' as const },
    { key: 'estado', header: 'Estado', width: '15%', align: 'center' as const },
    { key: 'fechas', header: 'Inicio / Fin', width: '25%', align: 'center' as const },
  ];

  const mapRow = (item: PeriodoListItem) => ({
    codigo: <Badge variant="primary">{item.codigo ?? '—'}</Badge>,
    nombre: item.nombre ?? '—',
    periodo: `${item.anio ?? ''} - ${item.semestre === 1 ? 'I' : 'II'}`,
    estado: <Badge variant="muted">{(item.estado ?? '').toUpperCase()}</Badge>,
    fechas: `${item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString('es-PE') : '—'} al ${item.fecha_fin ? new Date(item.fecha_fin).toLocaleDateString('es-PE') : '—'}`,
  });

  return generateListReportPdf(dto, columns, mapRow);
}
