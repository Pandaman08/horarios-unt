const puppeteer = require('puppeteer');

async function testLaunch() {
  console.log('[TEST] Iniciando lanzamiento...');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    console.log('[TEST] Browser lanzado con éxito!');
    const page = await browser.newPage();
    console.log('[TEST] Nueva página creada.');
    await page.setContent('<h1>Test PDF</h1>');
    console.log('[TEST] Contenido seteado.');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('[TEST] PDF generado:', pdf.length, 'bytes');
    await browser.close();
    console.log('[TEST] Browser cerrado.');
  } catch (err) {
    console.error('[TEST] ERROR FATAL:', err.message);
    if (browser) await browser.close();
  }
}

testLaunch();
