import React from 'react';
import { Document, renderToBuffer, View } from '@react-pdf/renderer';
import { 
  Page, 
  Header, 
  Footer, 
  Table, 
  Section, 
  Badge,
  Text,
  Small
} from '../design';
import { Colors } from '../styles';

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  horas_teoria?: number | null;
  horas_practica?: number | null;
  horas_laboratorio?: number | null;
  tipo_curso: string;
  departamento_responsable?: string | null;
  creditos?: number | null;
  prerequisitos_rel?: {
    prerequisito: {
      codigo: string;
      nombre: string;
      ciclo_rel?: {
        numero: number;
      } | null;
    };
  }[];
  malla_rel?: {
    nombre: string;
    anio: number;
  } | null;
}

interface Ciclo {
  id_ciclo: number;
  numero: number;
  nombre: string;
  cursos: Curso[];
}

interface MallaCurricular {
  id_malla: number;
  nombre: string;
  anio: number;
}

function getTipoCursoBadge(tipo: string) {
  let variant: 'primary' | 'secondary' | 'muted' | 'success' = 'muted';
  let label = 'OB';
  switch (tipo) {
    case 'especializacion':
      variant = 'primary';
      label = 'S';
      break;
    case 'opcional':
      variant = 'secondary';
      label = 'OP';
      break;
    case 'electivo':
      variant = 'muted';
      label = 'EL';
      break;
    default:
      variant = 'success';
      label = 'OB';
  }
  return <Badge variant={variant}>{label}</Badge>;
}

export async function generatePlanEstudiosPDF(
  ciclos: Ciclo[],
  malla?: MallaCurricular
): Promise<Buffer> {
  const document = (
    <Document>
      <Page>
        <Header 
          title={malla?.nombre ?? 'Plan de Estudios'} 
          subtitle={`Fecha de impresión: ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`} 
        />
        
        {ciclos.map((ciclo, cicloIndex) => {
          let totalCreditos = 0;

          const columns = [
            { key: 'codigo', header: 'Código', width: '10%', align: 'center' as const },
            { key: 'ciclo', header: 'Ciclo', width: '8%', align: 'center' as const },
            { key: 'tipo', header: 'Tipo', width: '8%', align: 'center' as const },
            { key: 'nombre', header: 'Curso', width: '40%' },
            { key: 't', header: 'T', width: '6%', align: 'center' as const },
            { key: 'p', header: 'P', width: '6%', align: 'center' as const },
            { key: 'l', header: 'L', width: '6%', align: 'center' as const },
            { key: 'creditos', header: 'Créd.', width: '8%', align: 'center' as const },
            { key: 'departamento', header: 'Departamento', width: '13%' },
          ];

          const rows = ciclo.cursos.map((curso, index) => {
            let creditos = curso.creditos ?? 0;
            if (curso.tipo_curso === 'electivo') {
              const electivosContados = ciclo.cursos.filter((c, i) => c.tipo_curso === 'electivo' && i <= index).length;
              if (electivosContados > 1) {
                creditos = 0;
              }
            }
            totalCreditos += creditos;
            
            return {
              codigo: curso.codigo,
              ciclo: ciclo.numero,
              tipo: getTipoCursoBadge(curso.tipo_curso),
              nombre: (
                <View>
                  <Text>{curso.nombre}</Text>
                  {curso.prerequisitos_rel && curso.prerequisitos_rel.length > 0 && (
                    <Small>
                      {curso.prerequisitos_rel.map(p => `• ${p.prerequisito.codigo} ${p.prerequisito.nombre}${p.prerequisito.ciclo_rel ? ` (Ciclo ${p.prerequisito.ciclo_rel.numero})` : ''}`).join('  ')}
                    </Small>
                  )}
                </View>
              ),
              t: curso.horas_teoria ?? 0,
              p: curso.horas_practica ?? 0,
              l: curso.horas_laboratorio ?? 0,
              creditos: <Text weight="bold" color={Colors.PRIMARY}>{creditos}</Text>,
              departamento: curso.departamento_responsable ?? '—',
            };
          });

          const footer = {
            codigo: <Text weight="bold" color={Colors.WHITE}>Total de Créditos</Text>,
            ciclo: '',
            tipo: '',
            nombre: '',
            t: '',
            p: '',
            l: '',
            creditos: <Text weight="bold" color={Colors.WHITE}>{totalCreditos}</Text>,
            departamento: '',
          };

          return (
            <Section 
              key={cicloIndex} 
              title={`Ciclo ${ciclo.numero} — ${ciclo.nombre}`} 
              rightLabel={`${ciclo.cursos.length} cursos`}
              breakBefore={cicloIndex > 0}
            >
              <Table columns={columns} rows={rows} footer={footer} showAlternatingRows />
            </Section>
          );
        })}
      </Page>
      <Footer />
    </Document>
  );

  const pdfBuffer = await renderToBuffer(document);
  return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
}
