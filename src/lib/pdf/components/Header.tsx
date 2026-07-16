import { StyleSheet, Text, View } from '@react-pdf/renderer';

// Top dark blue bar with DOCENTE name
export function DocenteTopBar({ docente }: { docente?: string }): React.ReactElement {
  return (
    <View style={docenteTopBarStyles.wrapper}>
      <Text style={docenteTopBarStyles.text}>
        DOCENTE: {docente || ''}
      </Text>
    </View>
  );
}

const docenteTopBarStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: '#003366',
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
});

// Left info box with university, faculty, school, etc.
export function SchoolInfoBox({
  university = 'Universidad Nacional de Trujillo',
  faculty = 'Facultad de Ingeniería',
  school = 'Escuela Profesional de Ingeniería de Sistemas',
  section = 'A',
  year = '2026',
  semestre = 'I',
  fechaInicio = '12/4/2026',
  fechaTermino = '7/8/2026',
}: {
  university?: string;
  faculty?: string;
  school?: string;
  section?: string;
  year?: string | number;
  semestre?: string | number;
  fechaInicio?: string;
  fechaTermino?: string;
}): React.ReactElement {
  return (
    <View style={schoolInfoBoxStyles.wrapper}>
      <View style={schoolInfoBoxStyles.universitySection}>
        <Text style={schoolInfoBoxStyles.universityText}>{university.toUpperCase()}</Text>
        <Text style={schoolInfoBoxStyles.facultyText}>{faculty.toUpperCase()}</Text>
      </View>
      
      <View style={schoolInfoBoxStyles.metadataSection}>
        <View style={schoolInfoBoxStyles.metadataLine}>
          <Text style={schoolInfoBoxStyles.metadataLabel}>ESCUELA:</Text>
        </View>
        <Text style={schoolInfoBoxStyles.schoolText}>{school.toUpperCase()}</Text>
        <View style={schoolInfoBoxStyles.metadataRow}>
          <View style={schoolInfoBoxStyles.metadataLine}>
            <Text style={schoolInfoBoxStyles.metadataLabel}>SECCIÓN:</Text>
            <Text style={schoolInfoBoxStyles.metadataValue}>{section}</Text>
          </View>
        </View>
        <View style={schoolInfoBoxStyles.metadataRow}>
          <View style={schoolInfoBoxStyles.metadataLine}>
            <Text style={schoolInfoBoxStyles.metadataLabel}>AÑO:</Text>
            <Text style={schoolInfoBoxStyles.metadataValue}>{year}</Text>
          </View>
          <View style={schoolInfoBoxStyles.metadataLine}>
            <Text style={schoolInfoBoxStyles.metadataLabel}>SEMESTRE:</Text>
            <Text style={schoolInfoBoxStyles.metadataValue}>{semestre}</Text>
          </View>
        </View>
      </View>
      
      <View style={schoolInfoBoxStyles.dateBox}>
        <Text style={schoolInfoBoxStyles.dateText}>Inicio: {fechaInicio}</Text>
        <Text style={schoolInfoBoxStyles.dateText}>Término: {fechaTermino}</Text>
      </View>
    </View>
  );
}

const schoolInfoBoxStyles = StyleSheet.create({
  wrapper: {
    width: 260,
    borderWidth: 2,
    borderColor: '#003366',
    borderRadius: 4,
    padding: 5,
    display: 'flex',
    flexDirection: 'column',
  },
  universitySection: {
    alignItems: 'center',
    marginBottom: 3,
  },
  universityText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
  },
  facultyText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 1,
  },
  metadataSection: {
    marginBottom: 3,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  metadataLine: {
    flexDirection: 'row',
  },
  metadataLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  metadataValue: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    marginLeft: 3,
  },
  schoolText: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    marginBottom: 2,
  },
  dateBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 3,
    padding: 2,
    alignItems: 'flex-end',
  },
  dateText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
});
