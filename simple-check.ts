
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Usuarios ===');
  const usuarios = await prisma.usuario.findMany({ include: { docente: true } });
  usuarios.forEach(u =&gt; {
    console.log(`- ${u.codigo}: ${u.nombres} ${u.apellidos} (Rol: ${u.rol})`);
    if (u.docente) {
      console.log(`  -> Docente: ${u.docente.codigo_docente} (ID: ${u.docente.id_docente})`);
    }
  });

  console.log('\n=== Horarios Asignados ===');
  const horarios = await prisma.horarioAsignado.findMany({
    include: { docente: true, curso: true, periodo: true },
    take: 20
  });
  horarios.forEach(h =&gt; {
    console.log(`- Docente: ${h.docente?.nombres} ${h.docente?.apellidos}`);
    console.log(`  Curso: ${h.curso?.codigo} - ${h.curso?.nombre}`);
    console.log(`  Periodo: ${h.periodo?.codigo}`);
    console.log(`  Tipo: ${h.tipo_clase} | Estado: ${h.estado}`);
    console.log('');
  });
}

main()
  .catch(e =&gt; { console.error(e); process.exit(1); })
  .finally(async () =&gt; { await prisma.$disconnect(); });
