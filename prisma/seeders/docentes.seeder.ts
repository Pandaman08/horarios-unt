// prisma/seeders/05_docentes.seeder.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedDocentes(prisma: PrismaClient) {
  console.log('🌱 Sembrando Docentes (con teléfonos reales del Excel)...');

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

  // Obtener Departamento de Ingeniería de Sistemas and Facultad de Ingeniería
  const departamentoSistemas = await prisma.departamentoAcademico.findFirst({
    where: { nombre: { contains: 'Ingeniería de Sistemas' } }
  });
  const facultadIngenieria = await prisma.facultad.findFirst({
    where: { codigo: 'F11' }
  });
  const departamentoId = departamentoSistemas?.id;
  const facultadId = facultadIngenieria?.id;

  // Lista completa de docentes que enseñan en la Escuela de Ingeniería de Sistemas
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

    // ==================== DOCENTES DE OTROS DEPARTAMENTOS QUE ENSEÑAN EN SISTEMAS ====================
    // (con sus teléfonos si se encontraron en el Excel)
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
      especialidad: 'CC. Psicológicas',
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
    }
  ];

  let contadorDniDefault = 1;
  for (const data of docentesData) {
    const primerNombre = data.nombres.split(' ')[0];
    const inicial = primerNombre.charAt(0).toLowerCase();
    let dni = data.dni;
    if (!dni) {
      dni = `9${String(contadorDniDefault++).padStart(7, '0')}`;
    }
    const codigoDocente = `${inicial}${dni}`; // formato: inicial + DNI
    const correo = generarCorreo(data.nombres, data.apellidos);
    const contrasenaHash = await bcrypt.hash(dni, 10);
    const nombresMayusculas = data.nombres.toUpperCase();
    const apellidosMayusculas = data.apellidos.toUpperCase();

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

    // Crear o actualizar docente (con teléfono si existe)
    await prisma.docente.upsert({
      where: { codigo_docente: codigoDocente },
      update: {
        id_usuario: usuario.id_usuario,
        nombres: nombresMayusculas,
        apellidos: apellidosMayusculas,
        modalidad: data.modalidad,
        categoria: data.categoria,
        fecha_ingreso: data.fecha_ingreso,
        grado_academico: data.grado,
        especialidad: data.especialidad,
        correo_electronico: correo,
        dni: dni,
        telefono: data.telefono, // se agrega el teléfono
        departamentoId: data.especialidad?.includes('Ingeniería de Sistemas') ? departamentoId : undefined,
        facultadId: facultadId,
      },
      create: {
        codigo_docente: codigoDocente,
        id_usuario: usuario.id_usuario,
        nombres: nombresMayusculas,
        apellidos: apellidosMayusculas,
        modalidad: data.modalidad,
        categoria: data.categoria,
        fecha_ingreso: data.fecha_ingreso,
        grado_academico: data.grado,
        especialidad: data.especialidad,
        correo_electronico: correo,
        dni: dni,
        telefono: data.telefono,
        departamentoId: data.especialidad?.includes('Ingeniería de Sistemas') ? departamentoId : undefined,
        facultadId: facultadId,
      },
    });

    console.log(`✅ Docente: ${data.nombres} ${data.apellidos} (${codigoDocente}) - Tel: ${data.telefono || 'N/A'}`);
  }

  const totalDocentes = await prisma.docente.count();
  console.log(`✅ ${totalDocentes} docentes sembrados.\n`);
  return totalDocentes;
}