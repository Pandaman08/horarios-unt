
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando usuario y docente...');
  
  // Buscar usuario por código o nombre
  const usuario = await prisma.usuario.findFirst({
    where: {
      OR: [
        { codigo: { contains: 'santos' } },
        { nombres: { contains: 'santos' } },
        { apellidos: { contains: 'santos' } },
        { codigo: 'jsantosfernandez' }
      ]
    },
    include: {
      docente: true
    }
  });

  if (!usuario) {
    console.log('❌ Usuario no encontrado');
    // Mostrar algunos usuarios
    const usuarios = await prisma.usuario.findMany({ take: 10, include: { docente: true } });
    console.log('📋 Usuarios disponibles (primeros 10):');
    usuarios.forEach(u =&gt; {
      console.log(`  - ${u.codigo}: ${u.nombres} ${u.apellidos} (Rol: ${u.rol}, Docente: ${u.docente ? 'Sí' : 'No'})`);
    });
    return;
  }

  console.log(`✅ Usuario encontrado: ${usuario.codigo} - ${usuario.nombres} ${usuario.apellidos}`);
  
  if (!usuario.docente) {
    console.log('❌ Este usuario NO está vinculado a un docente');
    return;
  }

  console.log(`✅ Docente vinculado: ID=${usuario.docente.id_docente}, Código=${usuario.docente.codigo_docente}`);
  console.log(`   Nombre: ${usuario.docente.nombres} ${usuario.docente.apellidos}`);

  // Obtener todos los períodos
  const periodos = await prisma.periodoAcademico.findMany();
  console.log(`\n📊 Períodos disponibles: ${periodos.map(p =&gt; p.codigo).join(', ')}`);

  // Buscar horarios para este docente
  for (const periodo of periodos) {
    const horarios = await prisma.horarioAsignado.findMany({
      where: {
        id_docente: usuario.docente.id_docente,
        id_periodo: periodo.id_periodo
      },
      include: {
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    console.log(`\n📅 ${periodo.codigo} - ${periodo.nombre}:`);
    console.log(`   Horarios encontrados: ${horarios.length}`);

    if (horarios.length &gt; 0) {
      horarios.forEach((h, i) =&gt; {
        console.log(`   ${i+1}. ${h.curso.codigo} - ${h.curso.nombre}`);
        console.log(`      Tipo: ${h.tipo_clase} | Grupo: ${h.grupo.codigo_grupo} | Ambiente: ${h.ambiente.codigo}`);
        console.log(`      Día: ${h.dia_semana} | Hora: ${h.hora_inicio}-${h.hora_fin} | Estado: ${h.estado}`);
      });
    }
  }

  // Verificar todos los horarios en la BD para este docente
  const todosHorarios = await prisma.horarioAsignado.findMany({
    where: { id_docente: usuario.docente.id_docente },
    include: { periodo: true }
  });

  console.log(`\n📊 TOTAL de horarios para este docente en la BD: ${todosHorarios.length}`);
  todosHorarios.forEach(h =&gt; {
    console.log(`   - ${h.periodo.codigo}: ${h.tipo_clase} (${h.estado})`);
  });
}

main()
  .catch(e =&gt; {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () =&gt; {
    await prisma.$disconnect();
  });
