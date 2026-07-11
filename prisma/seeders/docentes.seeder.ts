// prisma/seeders/05_docentes.seeder.ts
import { PrismaClient, CondicionDocente, CategoriaDocente, RegimenDedicacion, TipoContrato } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedDocentes(prisma: PrismaClient) {
  console.log('🌱 Sembrando Docentes (con datos completos según Reglamento)...');

  // Función para generar correo institucional
  function generarCorreo(nombres: string, apellidos: string): string {
    const nombreParts = nombres.trim().toLowerCase().split(/\s+/);
    const apellidoParts = apellidos.trim().toLowerCase().split(/\s+/);
    const inicialNombre = nombreParts[0].charAt(0);
    const primerApellido = apellidoParts[0];
    const segundoApellido = apellidoParts[1] || '';
    let base = inicialNombre + primerApellido + segundoApellido;
    base = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    return `${base}@unitru.edu.pe`;
  }

  // Obtener o crear mapeo de facultades y departamentos
  const facultades = await prisma.facultad.findMany();
  const departamentos = await prisma.departamentoAcademico.findMany();

  // Mapear nombre de facultad a ID
  const facultadMap = new Map<string, string>();
  for (const fac of facultades) {
    facultadMap.set(fac.nombre, fac.id);
  }

  // Mapear nombre de departamento a ID
  const departamentoMap = new Map<string, string>();
  for (const dep of departamentos) {
    departamentoMap.set(dep.nombre, dep.id);
  }

  // Función para obtener facultad y departamento según especialidad
  function getUbicacionPorEspecialidad(especialidad: string): { facultadId: string | null, departamentoId: string | null } {
    const especialidadLower = especialidad.toLowerCase();

    // Mapeo de especialidad -> facultad (nombre exacto o parcial)
    if (especialidadLower.includes('sistemas') || especialidadLower.includes('informática')) {
      const facId = facultadMap.get('Facultad de Ingeniería') || null;
      const depId = departamentoMap.get('Ingeniería de Sistemas') || null;
      return { facultadId: facId, departamentoId: depId };
    }
    if (especialidadLower.includes('psicológica') || especialidadLower.includes('psicología')) {
      const facId = facultadMap.get('Facultad de Educación y Ciencias de la Comunicación') || null;
      const depId = departamentoMap.get('Ciencias Psicológicas') || null;
      return { facultadId: facId, departamentoId: depId };
    }
    if (especialidadLower.includes('matemática')) {
      const facId = facultadMap.get('Facultad de Ciencias Físicas y Matemáticas') || null;
      const depId = departamentoMap.get('Matemáticas') || null;
      return { facultadId: facId, departamentoId: depId };
    }
    if (especialidadLower.includes('estadística')) {
      const facId = facultadMap.get('Facultad de Ciencias Físicas y Matemáticas') || null;
      const depId = departamentoMap.get('Estadística') || null;
      return { facultadId: facId, departamentoId: depId };
    }
    if (especialidadLower.includes('física')) {
      const facId = facultadMap.get('Facultad de Ciencias Físicas y Matemáticas') || null;
      const depId = departamentoMap.get('Física') || null;
      return { facultadId: facId, departamentoId: depId };
    }
    if (especialidadLower.includes('administración') || especialidadLower.includes('economía')) {
      const facId = facultadMap.get('Facultad de Ciencias Económicas') || null;
      const depId = especialidadLower.includes('administración') ? departamentoMap.get('Administración') : departamentoMap.get('Economía');
      return { facultadId: facId, departamentoId: depId || null };
    }
    if (especialidadLower.includes('lengua') || especialidadLower.includes('literatura') || especialidadLower.includes('comunicación')) {
      const facId = facultadMap.get('Facultad de Educación y Ciencias de la Comunicación') || null;
      const depId = especialidadLower.includes('lengua') ? departamentoMap.get('Lengua Nacional y Literatura') : departamentoMap.get('Comunicación Social');
      return { facultadId: facId, departamentoId: depId || null };
    }
    if (especialidadLower.includes('metalúrgica') || especialidadLower.includes('minas')) {
      const facId = facultadMap.get('Facultad de Ingeniería') || null;
      const depId = departamentoMap.get('Ingeniería de Minas') || null;
      return { facultadId: facId, departamentoId: depId };
    }
    // Por defecto, asignar a Ingeniería (F11) si no se encuentra
    const facId = facultadMap.get('Facultad de Ingeniería') || null;
    const depId = departamentoMap.get('Ingeniería de Sistemas') || null;
    return { facultadId: facId, departamentoId: depId };
  }

  // Lista completa de docentes (datos reales)
  const docentesData = [
    // ==================== DOCENTES DEL DEPARTAMENTO DE INGENIERÍA DE SISTEMAS ====================
    {
      nombres: 'Everson David',
      apellidos: 'Agreda Gamboa',
      dni: '18161457',
      telefono: '966243289',
      fecha_ingreso: new Date('2002-08-19'),
      modalidad: 'nombrado',
      categoria: 'principal',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Oscar Romel',
      apellidos: 'Alcántara Moreno',
      dni: '18126940',
      telefono: '947403830',
      fecha_ingreso: new Date('2011-04-25'),
      modalidad: 'nombrado',
      categoria: 'auxiliar',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'César Augusto',
      apellidos: 'Arellano Salazar',
      dni: '18147714',
      telefono: '961000035',
      fecha_ingreso: new Date('2002-04-23'),
      modalidad: 'nombrado',
      categoria: 'auxiliar',
      grado: 'BACHILLER',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Luis Enrique',
      apellidos: 'Boy Chavil',
      dni: '18842081',
      telefono: '995959450',
      fecha_ingreso: new Date('1999-10-05'),
      modalidad: 'nombrado',
      categoria: 'principal',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería de Sistemas',
      esJefeDepartamento: true,
    },
    {
      nombres: 'José Alberto',
      apellidos: 'Gómez Ávila',
      dni: '40990648',
      telefono: '949700322',
      fecha_ingreso: new Date('2013-05-15'),
      modalidad: 'nombrado',
      categoria: 'auxiliar',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Alberto Carlos',
      apellidos: 'Mendoza de los Santos',
      dni: '17434055',
      telefono: '949677444',
      fecha_ingreso: new Date('2011-09-05'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Ricardo Darío',
      apellidos: 'Mendoza Rivera',
      dni: '18070765',
      telefono: '949511552',
      fecha_ingreso: new Date('2016-12-14'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Juan Carlos',
      apellidos: 'Obando Roldán',
      dni: '18122605',
      telefono: '949865222',
      fecha_ingreso: new Date('2001-09-21'),
      modalidad: 'nombrado',
      categoria: 'principal',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Marcos',
      apellidos: 'Baca López',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2020-03-01'),
      modalidad: 'contratado',
      categoria: 'auxiliar',
      grado: null,
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Ana',
      apellidos: 'Cuadra Mitzugaray',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2020-03-01'),
      modalidad: 'contratado',
      categoria: 'auxiliar',
      grado: null,
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Jhoe',
      apellidos: 'González Vásquez',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2021-03-01'),
      modalidad: 'contratado',
      categoria: 'auxiliar',
      grado: null,
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Robert Jerry',
      apellidos: 'Sánchez Ticona',
      dni: '19082305',
      telefono: '963990262',
      fecha_ingreso: new Date('2008-12-05'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: 'MAGISTER',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Juan Pedro',
      apellidos: 'Santos Fernández',
      dni: '17896289',
      telefono: '947879773',
      fecha_ingreso: new Date('1992-07-07'),
      modalidad: 'nombrado',
      categoria: 'principal',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Camilo Ernesto',
      apellidos: 'Suárez Rebaza',
      dni: '32978627',
      telefono: '943013613',
      fecha_ingreso: new Date('2017-05-18'),
      modalidad: 'nombrado',
      categoria: 'auxiliar',
      grado: 'MAGISTER',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Marcelino',
      apellidos: 'Torres Villanueva',
      dni: '17865408',
      telefono: '948331398',
      fecha_ingreso: new Date('2006-01-03'),
      modalidad: 'nombrado',
      categoria: 'auxiliar',
      grado: 'MAGISTER',
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Zoraida Yanet',
      apellidos: 'Vidal Melgarejo',
      dni: '18153095',
      telefono: '949171710',
      fecha_ingreso: new Date('2002-04-22'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: 'MAGISTER',
      especialidad: 'Ingeniería de Sistemas',
    },

    // ==================== DOCENTES DE OTROS DEPARTAMENTOS ====================
    {
      nombres: 'Paul',
      apellidos: 'Cotrina Castellanos',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2021-03-01'),
      modalidad: 'contratado',
      categoria: 'auxiliar',
      grado: null,
      especialidad: 'Ingeniería de Sistemas',
    },
    {
      nombres: 'Bertha',
      apellidos: 'Urtecho Zavaleta',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2016-03-01'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: null,
      especialidad: 'Ciencias Psicológicas',
    },
    {
      nombres: 'Jose Luis',
      apellidos: 'Ponte Bejarano',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2018-03-01'),
      modalidad: 'nombrado',
      categoria: 'principal',
      grado: null,
      especialidad: 'Matemáticas',
    },
    {
      nombres: 'Jorge Luis',
      apellidos: 'Rios Gonzales',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2017-03-01'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: null,
      especialidad: 'Lengua y Literatura',
    },
    {
      nombres: 'Segunda',
      apellidos: 'Gubar Obeso',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2006-03-01'),
      modalidad: 'nombrado',
      categoria: 'principal',
      grado: null,
      especialidad: 'Matemáticas',
    },
    {
      nombres: 'Miguel',
      apellidos: 'Ipanaque Zapata',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2019-03-01'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: null,
      especialidad: 'Estadística',
    },
    {
      nombres: 'Martha',
      apellidos: 'Cardoso',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2023-03-01'),
      modalidad: 'contratado',
      categoria: 'auxiliar',
      grado: null,
      especialidad: 'Estadística',
    },
    {
      nombres: 'Marcos',
      apellidos: 'Ferrer Reyna',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2020-03-01'),
      modalidad: 'contratado',
      categoria: 'auxiliar',
      grado: null,
      especialidad: 'Matemáticas',
    },
    {
      nombres: 'Teresita',
      apellidos: 'Rojas García',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2018-03-01'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: null,
      especialidad: 'Estadística',
    },
    {
      nombres: 'Juan',
      apellidos: 'Carrascal Cabanillas',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2019-03-01'),
      modalidad: 'contratado',
      categoria: 'auxiliar',
      grado: null,
      especialidad: 'Administración',
    },
    {
      nombres: 'Vilma',
      apellidos: 'Mendez Gil',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2016-03-01'),
      modalidad: 'nombrado',
      categoria: 'asociado',
      grado: null,
      especialidad: 'Física',
    },
    {
      nombres: 'Sheyla Laura',
      apellidos: 'Escobedo Rodríguez',
      dni: null,
      telefono: null,
      fecha_ingreso: new Date('2022-03-01'),
      modalidad: 'contratado',
      categoria: 'auxiliar',
      grado: null,
      especialidad: 'Psicología',
    },
    {
      nombres: 'Iván Alberto',
      apellidos: 'Reyes López',
      dni: '17898446', // Confirmado en el directorio de la UNT[reference:0]
      telefono: '949639858', // Del directorio institucional[reference:1]
      fecha_ingreso: new Date('1985-02-01'), // Según CTI Vitae[reference:2]
      modalidad: 'nombrado',
      categoria: 'principal',
      grado: 'DOCTOR',
      especialidad: 'Ingeniería Metalúrgica', // Docente del Departamento de Minas y Metalurgia[reference:3]
      esDecano: true, // 👈 Nuevo flag
    },
  ];

  let contadorDniDefault = 1;
  for (const data of docentesData) {
    // Generar DNI si no tiene
    let dni = data.dni;
    if (!dni) {
      dni = `9${String(contadorDniDefault++).padStart(7, '0')}`;
    }

    const primerNombre = data.nombres.split(' ')[0];
    const inicial = primerNombre.charAt(0).toLowerCase();
    const codigoDocente = `${inicial}${dni}`;
    const correo = generarCorreo(data.nombres, data.apellidos);
    const contrasenaHash = await bcrypt.hash(dni, 10);
    const nombresMayusculas = data.nombres.toUpperCase();
    const apellidosMayusculas = data.apellidos.toUpperCase();

    // Determinar facultad y departamento según especialidad
    const { facultadId, departamentoId } = getUbicacionPorEspecialidad(data.especialidad);

    // Mapear modalidad -> condicion
    const esNombrado = data.modalidad.toLowerCase() === 'nombrado';
    const condicion = esNombrado ? CondicionDocente.ORDINARIO : CondicionDocente.CONTRATADO;

    // Mapear categoria -> categoriaDocente
    let categoriaDocente: CategoriaDocente | undefined;
    const catLower = data.categoria.toLowerCase();
    if (catLower === 'principal') categoriaDocente = CategoriaDocente.PRINCIPAL;
    else if (catLower === 'asociado') categoriaDocente = CategoriaDocente.ASOCIADO;
    else if (catLower === 'auxiliar') categoriaDocente = CategoriaDocente.AUXILIAR;

    // Asignar régimen de dedicación según modalidad y categoría
    let regimenDedicacion: RegimenDedicacion | undefined;
    if (esNombrado) {
      // Si es Principal y tiene más de 20 años de servicio -> DE (Dedicación Exclusiva)
      const antiguedad = new Date().getFullYear() - data.fecha_ingreso.getFullYear();
      if (data.categoria.toLowerCase() === 'principal' && antiguedad >= 20) {
        regimenDedicacion = RegimenDedicacion.DE;
      } else if (data.categoria.toLowerCase() === 'principal' || data.categoria.toLowerCase() === 'asociado') {
        regimenDedicacion = RegimenDedicacion.TC; // Tiempo Completo
      } else {
        regimenDedicacion = RegimenDedicacion.TP1; // Tiempo Parcial 20h
      }
    } else {
      regimenDedicacion = RegimenDedicacion.TP1;
    }

    // Asignar tipo de contrato solo si es CONTRATADO
    let tipoContrato: TipoContrato | undefined;
    if (condicion === CondicionDocente.CONTRATADO) {
      // Según el grado académico: Doctor -> A1, Magister -> B1, otro -> B2
      const grado = data.grado?.toLowerCase() || '';
      if (grado.includes('doctor')) tipoContrato = TipoContrato.A1;
      else if (grado.includes('magister') || grado.includes('maestro')) tipoContrato = TipoContrato.B1;
      else tipoContrato = TipoContrato.B2;
    }

    // Asignar esInvestigadorAcreditado (RENACYT simulado)
    // Para docentes principales con grado de Doctor, es probable que sean investigadores
    const esInvestigadorAcreditado = data.categoria.toLowerCase() === 'principal' && 
                                     data.grado?.toLowerCase().includes('doctor') && 
                                     Math.random() > 0.3; // 70% de los principales doctores son investigadores

    // Nivel RENACYT (simulado) solo para investigadores
    const nivelesRenacyt = ['I', 'II', 'III', 'IV', 'V'];
    const nivelRenacyt = esInvestigadorAcreditado ? nivelesRenacyt[Math.floor(Math.random() * nivelesRenacyt.length)] : null;

    // Sanciones (todas inactivas por defecto)
    const sancionActiva = false;
    const sancionHasta = null;

    // Crear o actualizar usuario
    const usuario = await prisma.usuario.upsert({
      where: { correo_electronico: correo },
      update: {
        nombres: nombresMayusculas,
        apellidos: apellidosMayusculas,
        dni: dni,
        contrasena_hash: contrasenaHash,
        rol: 'docente',
      },
      create: {
        codigo: dni,
        nombres: nombresMayusculas,
        apellidos: apellidosMayusculas,
        dni: dni,
        correo_electronico: correo,
        contrasena_hash: contrasenaHash,
        rol: 'docente',
      },
    });

    // Crear o actualizar docente
    await prisma.docente.upsert({
      where: { codigo_docente: codigoDocente },
      update: {
        id_usuario: usuario.id_usuario,
        nombres: nombresMayusculas,
        apellidos: apellidosMayusculas,
        fecha_ingreso: data.fecha_ingreso,
        grado_academico: data.grado,
        especialidad: data.especialidad,
        correo_electronico: correo,
        dni: dni,
        telefono: data.telefono,
        departamentoId: departamentoId,
        facultadId: facultadId,
        condicion: condicion,
        categoriaDocente: categoriaDocente,
        regimenDedicacion: regimenDedicacion,
        tipoContrato: tipoContrato,
        esInvestigadorAcreditado: esInvestigadorAcreditado,
        nivelRenacyt: nivelRenacyt,
        sancionActiva: sancionActiva,
        sancionHasta: sancionHasta,
      },
      create: {
        codigo_docente: codigoDocente,
        id_usuario: usuario.id_usuario,
        nombres: nombresMayusculas,
        apellidos: apellidosMayusculas,
        fecha_ingreso: data.fecha_ingreso,
        grado_academico: data.grado,
        especialidad: data.especialidad,
        correo_electronico: correo,
        dni: dni,
        telefono: data.telefono,
        departamentoId: departamentoId,
        facultadId: facultadId,
        condicion: condicion,
        categoriaDocente: categoriaDocente,
        regimenDedicacion: regimenDedicacion,
        tipoContrato: tipoContrato,
        esInvestigadorAcreditado: esInvestigadorAcreditado,
        nivelRenacyt: nivelRenacyt,
        sancionActiva: sancionActiva,
        sancionHasta: sancionHasta,
      },
    });

    console.log(`✅ Docente: ${data.nombres} ${data.apellidos} (${codigoDocente}) - ${condicion} - ${categoriaDocente || 'N/A'} - ${regimenDedicacion || 'N/A'} - Tel: ${data.telefono || 'N/A'}`);
  }
  // ==================== ASIGNACIÓN DE ROLES JERÁRQUICOS ====================
  console.log('\n👔 Asignando roles jerárquicos...');

  // Buscar a Luis Boy Chavil (Jefe de Departamento)
  const jefeDepto = await prisma.docente.findFirst({
    where: { 
      nombres: 'LUIS ENRIQUE',
      apellidos: 'BOY CHAVIL'
    },
    include: { usuario: true }
  });

  if (jefeDepto?.usuario) {
    await prisma.usuario.update({
      where: { id_usuario: jefeDepto.usuario.id_usuario },
      data: { rol: 'director_departamento' }
    });
    console.log(`✅ ${jefeDepto.nombres} ${jefeDepto.apellidos} → director_departamento`);
  } else {
    console.warn('⚠️ No se encontró a Luis Boy Chavil para asignar rol de director_departamento');
  }

  // Buscar a Iván Reyes López (Decano)
  const decano = await prisma.docente.findFirst({
    where: { 
      nombres: 'IVÁN ALBERTO',
      apellidos: 'REYES LÓPEZ'
    },
    include: { usuario: true }
  });

  if (decano?.usuario) {
    await prisma.usuario.update({
      where: { id_usuario: decano.usuario.id_usuario },
      data: { rol: 'decano' }
    });
    console.log(`✅ ${decano.nombres} ${decano.apellidos} → decano`);
  } else {
    console.warn('⚠️ No se encontró a Iván Reyes López para asignar rol de decano');
  }

  const totalDocentes = await prisma.docente.count();
  console.log(`✅ ${totalDocentes} docentes sembrados.\n`);
  return totalDocentes;
  
}