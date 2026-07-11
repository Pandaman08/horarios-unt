import { PrismaClient, TipoFacultad } from '@prisma/client';

export async function seedFacultades(prisma: PrismaClient) {
  console.log('🌱 Sembrando Facultades, Departamentos y Escuelas...');

  // Facultades
  const facultadesData = [
    { codigo: 'F01', nombre: 'Facultad de Ciencias Agropecuarias', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F02', nombre: 'Facultad de Ciencias Biológicas', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F03', nombre: 'Facultad de Ciencias Económicas', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F04', nombre: 'Facultad de Ciencias Físicas y Matemáticas', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F05', nombre: 'Facultad de Ciencias Sociales', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F06', nombre: 'Facultad de Derecho y Ciencias Políticas', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F07', nombre: 'Facultad de Educación y Ciencias de la Comunicación', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F08', nombre: 'Facultad de Enfermería', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F09', nombre: 'Facultad de Estomatología', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F10', nombre: 'Facultad de Farmacia y Bioquímica', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F11', nombre: 'Facultad de Ingeniería', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F12', nombre: 'Facultad de Ingeniería Química', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F13', nombre: 'Facultad de Medicina', tipo: TipoFacultad.FACULTAD },
    { codigo: 'F14', nombre: 'Filial Valle Jequetepeque', tipo: TipoFacultad.FILIAL },
    { codigo: 'F15', nombre: 'Filial Huamachuco', tipo: TipoFacultad.FILIAL },
    { codigo: 'OA', nombre: 'Oficina Administrativa', tipo: TipoFacultad.ADMINISTRATIVA },
  ];

  const facultades: Record<string, { id: string }> = {};
  for (const fac of facultadesData) {
    const facultad = await prisma.facultad.upsert({
      where: { codigo: fac.codigo },
      update: { nombre: fac.nombre, tipo: fac.tipo },
      create: { nombre: fac.nombre, codigo: fac.codigo, tipo: fac.tipo },
    });
    facultades[fac.codigo] = { id: facultad.id };
    console.log(`✅ Facultad ${fac.codigo} - ${fac.nombre} asegurada.`);
  }

  // Departamentos Académicos
  const departamentosData = [
    { codigoFacultad: 'F01', nombre: 'Agronomía y Zootecnia' },
    { codigoFacultad: 'F01', nombre: 'Ciencias Agroindustriales' },
    { codigoFacultad: 'F02', nombre: 'Ciencias Biológicas' },
    { codigoFacultad: 'F02', nombre: 'Microbiología y Parasitología' },
    { codigoFacultad: 'F02', nombre: 'Pesquería' },
    { codigoFacultad: 'F02', nombre: 'Química Biológica y Fisiología Animal' },
    { codigoFacultad: 'F03', nombre: 'Administración' },
    { codigoFacultad: 'F03', nombre: 'Contabilidad y Finanzas' },
    { codigoFacultad: 'F03', nombre: 'Economía' },
    { codigoFacultad: 'F04', nombre: 'Estadística' },
    { codigoFacultad: 'F04', nombre: 'Física' },
    { codigoFacultad: 'F04', nombre: 'Informática' },
    { codigoFacultad: 'F04', nombre: 'Matemáticas' },
    { codigoFacultad: 'F05', nombre: 'Arqueología y Antropología' },
    { codigoFacultad: 'F05', nombre: 'Ciencias Sociales' },
    { codigoFacultad: 'F06', nombre: 'Ciencias Jurídicas Públicas y Políticas' },
    { codigoFacultad: 'F06', nombre: 'Ciencias Jurídicas Privadas y Sociales' },
    { codigoFacultad: 'F06', nombre: 'Ciencia Política y Gobernabilidad' },
    { codigoFacultad: 'F07', nombre: 'Ciencias de la Educación' },
    { codigoFacultad: 'F07', nombre: 'Ciencias Psicológicas' },
    { codigoFacultad: 'F07', nombre: 'Comunicación Social' },
    { codigoFacultad: 'F07', nombre: 'Filosofía y Arte' },
    { codigoFacultad: 'F07', nombre: 'Historia y Geografía' },
    { codigoFacultad: 'F07', nombre: 'Idiomas y Lingüística' },
    { codigoFacultad: 'F07', nombre: 'Lengua Nacional y Literatura' },
    { codigoFacultad: 'F08', nombre: 'Enfermería de la Mujer, Niño y Adolescente' },
    { codigoFacultad: 'F08', nombre: 'Salud del Adulto' },
    { codigoFacultad: 'F08', nombre: 'Salud Familiar y Comunitaria' },
    { codigoFacultad: 'F09', nombre: 'Ciencias Básicas Estomatológicas' },
    { codigoFacultad: 'F09', nombre: 'Estomatología' },
    { codigoFacultad: 'F10', nombre: 'Farmacotecnia' },
    { codigoFacultad: 'F10', nombre: 'Farmacología' },
    { codigoFacultad: 'F10', nombre: 'Bioquímica' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería Civil, Arquitectura y Urbanismo' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería Industrial' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería de Materiales' },
    { codigoFacultad: 'F11', nombre: 'Mecánica y Energía' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería Metalúrgica' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería de Minas' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería de Sistemas' },
    { codigoFacultad: 'F12', nombre: 'Ingeniería Química' },
    { codigoFacultad: 'F12', nombre: 'Ingeniería Ambiental' },
    { codigoFacultad: 'F12', nombre: 'Química' },
    { codigoFacultad: 'F13', nombre: 'Ciencias Básicas Médicas' },
    { codigoFacultad: 'F13', nombre: 'Cirugía' },
    { codigoFacultad: 'F13', nombre: 'Fisiología Humana' },
    { codigoFacultad: 'F13', nombre: 'Ginecología-Obstetricia' },
    { codigoFacultad: 'F13', nombre: 'Medicina' },
    { codigoFacultad: 'F13', nombre: 'Medicina Preventiva y Salud Pública' },
    { codigoFacultad: 'F13', nombre: 'Morfología Humana' },
    { codigoFacultad: 'F13', nombre: 'Pediatría' },
  ];

  for (const dep of departamentosData) {
    const facultadId = facultades[dep.codigoFacultad]?.id;
    if (!facultadId) {
      console.warn(`⚠️ Facultad ${dep.codigoFacultad} no encontrada, saltando departamento ${dep.nombre}.`);
      continue;
    }
    await prisma.departamentoAcademico.upsert({
      where: { nombre_facultadId: { nombre: dep.nombre, facultadId } },
      update: { nombre: dep.nombre, facultadId },
      create: { nombre: dep.nombre, facultadId },
    });
    console.log(`✅ Departamento: ${dep.nombre} (${dep.codigoFacultad}) asegurado.`);
  }

  // Escuelas Profesionales
  const escuelasData = [
    { codigoFacultad: 'F01', nombre: 'Agronomía' },
    { codigoFacultad: 'F01', nombre: 'Ingeniería Agrícola' },
    { codigoFacultad: 'F01', nombre: 'Ingeniería Agroindustrial' },
    { codigoFacultad: 'F01', nombre: 'Zootecnia' },
    { codigoFacultad: 'F02', nombre: 'Ciencias Biológicas' },
    { codigoFacultad: 'F02', nombre: 'Microbiología y Parasitología' },
    { codigoFacultad: 'F02', nombre: 'Biología Pesquera' },
    { codigoFacultad: 'F03', nombre: 'Administración' },
    { codigoFacultad: 'F03', nombre: 'Contabilidad y Finanzas' },
    { codigoFacultad: 'F03', nombre: 'Economía' },
    { codigoFacultad: 'F04', nombre: 'Estadística' },
    { codigoFacultad: 'F04', nombre: 'Física' },
    { codigoFacultad: 'F04', nombre: 'Informática' },
    { codigoFacultad: 'F04', nombre: 'Matemáticas' },
    { codigoFacultad: 'F05', nombre: 'Antropología' },
    { codigoFacultad: 'F05', nombre: 'Arqueología' },
    { codigoFacultad: 'F05', nombre: 'Historia' },
    { codigoFacultad: 'F05', nombre: 'Trabajo Social' },
    { codigoFacultad: 'F05', nombre: 'Turismo' },
    { codigoFacultad: 'F06', nombre: 'Derecho' },
    { codigoFacultad: 'F06', nombre: 'Ciencias Políticas y Gobernabilidad' },
    { codigoFacultad: 'F07', nombre: 'Educación Inicial' },
    { codigoFacultad: 'F07', nombre: 'Educación Primaria' },
    { codigoFacultad: 'F07', nombre: 'Educación Secundaria' },
    { codigoFacultad: 'F07', nombre: 'Ciencias de la Comunicación' },
    { codigoFacultad: 'F08', nombre: 'Enfermería' },
    { codigoFacultad: 'F09', nombre: 'Estomatología' },
    { codigoFacultad: 'F10', nombre: 'Farmacia y Bioquímica' },
    { codigoFacultad: 'F11', nombre: 'Arquitectura y Urbanismo' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería Civil' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería de Materiales' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería Industrial' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería Mecánica' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería Mecatrónica' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería Metalúrgica' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería de Minas' },
    { codigoFacultad: 'F11', nombre: 'Ingeniería de Sistemas' },
    { codigoFacultad: 'F12', nombre: 'Ingeniería Química' },
    { codigoFacultad: 'F12', nombre: 'Ingeniería Ambiental' },
    { codigoFacultad: 'F13', nombre: 'Medicina' },
  ];

  for (const esc of escuelasData) {
    const facultadId = facultades[esc.codigoFacultad]?.id;
    if (!facultadId) {
      console.warn(`⚠️ Facultad ${esc.codigoFacultad} no encontrada, saltando escuela ${esc.nombre}.`);
      continue;
    }
    await prisma.escuelaProfesional.upsert({
      where: { nombre_facultadId: { nombre: esc.nombre, facultadId } },
      update: { nombre: esc.nombre, facultadId },
      create: { nombre: esc.nombre, facultadId },
    });
    console.log(`✅ Escuela: ${esc.nombre} (${esc.codigoFacultad}) asegurada.`);
  }

  console.log('\n✅ Sembrado de Facultades, Departamentos y Escuelas completado.');
  return facultades;
}
