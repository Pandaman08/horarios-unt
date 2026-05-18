const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const p = await prisma.periodoAcademico.findFirst();
    if (!p) {
      console.log('NO_PERIODO');
      return;
    }
    const url = 'http://localhost:3000/api/reportes?tipo=consolidado&id_periodo=' + p.id_periodo;
    console.log('Probando URL:', url);
    const startTime = Date.now();
    
    const res = await fetch(url);
    console.log('Tiempo transcurrido:', Date.now() - startTime, 'ms');
    console.log('Status:', res.status);
    
    if (!res.ok) {
      console.log('Error Body:', await res.text());
    } else {
      console.log('Content-Type:', res.headers.get('content-type'));
      const buffer = await res.arrayBuffer();
      console.log('Buffer size:', buffer.byteLength);
    }
  } catch (e) {
    console.error('ERROR_TEST:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
