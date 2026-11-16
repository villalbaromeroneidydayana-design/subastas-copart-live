import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

async function generatePdf() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log(`Iniciando navegador headless desde: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const htmlPath = path.resolve('scripts', 'manual_capacitacion.html');
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

  console.log(`Cargando archivo HTML: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  const outputPath = path.resolve('MANUAL_CAPACITACION_BROKER_PUJAMOTOR.pdf');
  console.log(`Generando PDF en: ${outputPath}`);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '14mm',
      right: '14mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-family: -apple-system, sans-serif; font-size: 8pt; width: 100%; text-align: right; padding-right: 14mm; color: #94a3b8;">
        Página <span class="pageNumber"></span> de <span class="totalPages"></span> • Pujamotor USA
      </div>
    `,
  });

  await browser.close();
  console.log(`✓ PDF generado exitosamente: ${outputPath}`);
}

generatePdf().catch((err) => {
  console.error('Error al generar PDF:', err);
  process.exit(1);
});

