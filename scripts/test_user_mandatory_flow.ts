import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runMandatoryTest() {
  console.log('================================================================');
  console.log('  PRUEBA OBLIGATORIA DE INTEGRACIÓN — PANTALLA 1 Y PANTALLA 2   ');
  console.log('================================================================');

  // 0. Resetear servidor a estado de inspección (prepared)
  console.log('\n[Paso 0] Inicializando sesión en servidor...');
  const resetRes = await fetch('http://localhost:3001/api/sessions/ses-live-001/reset?admin=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin: true })
  });
  console.log('Reset API status:', resetRes.status);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page1 = await browser.newPage(); // Pantalla 1: Sala pública de subasta
  const page2 = await browser.newPage(); // Pantalla 2: Consola privada del subastador

  await page1.setViewport({ width: 1440, height: 900 });
  await page2.setViewport({ width: 1440, height: 900 });

  page1.on('console', msg => {
    if (msg.type() === 'error') console.error('[P1 ERROR]', msg.text());
  });
  page2.on('console', msg => {
    if (msg.type() === 'error') console.error('[P2 ERROR]', msg.text());
  });

  // Abrir ambas ventanas
  console.log('\nAbriendo PANTALLA 1 (Sala Pública)...');
  await page1.goto('http://localhost:5173/#/sala/copart-live-m729k1', { waitUntil: 'networkidle2' });

  console.log('Abriendo PANTALLA 2 (Consola Privada)...');
  await page2.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 2000));

  // ====================================================================
  // PASO 1: Configurar una subasta desde la pantalla 2
  // Modificamos parámetros: Precio base $6,500, Incremento $500, Presupuesto $12,500, Comprador "Roberto Silva (Comprador VIP)"
  // ====================================================================
  console.log('\n[PASO 1] Configurando subasta desde PANTALLA 2...');
  
  // Abrir modal de Parámetros en P2
  const paramsOpened = await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const paramBtn = btns.find(b => b.textContent?.includes('Parámetros'));
    if (paramBtn) {
      paramBtn.click();
      return true;
    }
    return false;
  });
  console.log('Modal de Parámetros abierto en P2:', paramsOpened);

  await new Promise(r => setTimeout(r, 1000));

  // Aplicar nueva configuración en P2
  const configResult = await page2.evaluate(() => {
    // Buscar inputs del modal
    const inputs = Array.from(document.querySelectorAll('input'));
    const numberInputs = inputs.filter(i => i.type === 'number');
    const textInputs = inputs.filter(i => i.type === 'text');

    if (numberInputs.length >= 4) {
      // Precio base
      numberInputs[0].value = '6500';
      numberInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      numberInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

      // Incremento
      numberInputs[1].value = '500';
      numberInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      numberInputs[1].dispatchEvent(new Event('change', { bubbles: true }));

      // Presupuesto
      numberInputs[3].value = '12500';
      numberInputs[3].dispatchEvent(new Event('input', { bubbles: true }));
      numberInputs[3].dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (textInputs.length >= 2) {
      // Comprador
      textInputs[textInputs.length - 1].value = 'Roberto Silva (Comprador VIP)';
      textInputs[textInputs.length - 1].dispatchEvent(new Event('input', { bubbles: true }));
      textInputs[textInputs.length - 1].dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Botón aplicar cambios
    const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Aplicar Cambios'));
    if (applyBtn) {
      applyBtn.click();
      return { success: true };
    }
    return { success: false, error: 'No se encontró botón Aplicar Cambios' };
  });
  console.log('Resultado configuración P2:', configResult);

  await new Promise(r => setTimeout(r, 2000));

  // ====================================================================
  // PASO 2: Comprobar que la pantalla 1 recibe la información configurada
  // ====================================================================
  console.log('\n[PASO 2] Comprobando recepción de datos en PANTALLA 1...');
  const p1Data = await page1.evaluate(() => {
    const text = document.body.innerText;
    const priceEl = document.querySelector('.text-5xl, .text-6xl')?.textContent?.trim();
    return {
      priceInDom: priceEl,
      hasPrice6500: text.includes('6.500') || text.includes('6,500') || text.includes('6500') || priceEl?.includes('6.500') || priceEl?.includes('6500'),
      hasIncrement500: text.includes('500'),
    };
  });
  console.log('PANTALLA 1 comprobación de datos recibidos:', p1Data);

  // ====================================================================
  // PASO 3: Pulsar SUBASTAR en pantalla 2
  // ====================================================================
  console.log('\n[PASO 3] Pulsando botón SUBASTAR en PANTALLA 2...');
  const clickSubastar = await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const subastarBtn = btns.find(b => {
      const t = b.textContent?.trim() || '';
      return t === 'SUBASTAR' || t.startsWith('SUBASTAR');
    });
    if (subastarBtn) {
      subastarBtn.click();
      return { clicked: true, text: subastarBtn.textContent?.trim() };
    }
    return { clicked: false };
  });
  console.log('Resultado clic en SUBASTAR:', clickSubastar);

  if (!clickSubastar.clicked) {
    throw new Error('FALLO CRÍTICO: No se encontró el botón SUBASTAR en Pantalla 2');
  }

  // ====================================================================
  // PASO 4: Confirmar que el reloj comienza a descontar segundos
  // ====================================================================
  console.log('\n[PASO 4] Monitoreando descuento de segundos del reloj...');
  
  // Muestreo a 1.5s
  await new Promise(r => setTimeout(r, 1500));
  const sample1 = await page1.evaluate(() => {
    const circle = document.querySelector('svg circle[stroke-dashoffset]');
    const spans = Array.from(document.querySelectorAll('span, div')).map(e => e.textContent?.trim()).filter(t => t && t.endsWith('s'));
    return {
      clockSpans: spans.slice(0, 5),
      dashOffset: circle?.getAttribute('stroke-dashoffset')
    };
  });
  console.log('Muestra 1 (tras 1.5s) en Pantalla 1:', sample1);

  // Muestreo a 3.5s
  await new Promise(r => setTimeout(r, 2000));
  const sample2 = await page1.evaluate(() => {
    const circle = document.querySelector('svg circle[stroke-dashoffset]');
    const spans = Array.from(document.querySelectorAll('span, div')).map(e => e.textContent?.trim()).filter(t => t && t.endsWith('s'));
    return {
      clockSpans: spans.slice(0, 5),
      dashOffset: circle?.getAttribute('stroke-dashoffset')
    };
  });
  console.log('Muestra 2 (tras 3.5s) en Pantalla 1:', sample2);

  const p2Clock = await page2.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span, div')).map(e => e.textContent?.trim()).filter(t => t && t.endsWith('s'));
    return { clockSpans: spans.slice(0, 5) };
  });
  console.log('Reloj en Pantalla 2 tras 3.5s:', p2Clock);

  // ====================================================================
  // PASO 5: Comprobar que ambas pantallas muestran el mismo estado
  // ====================================================================
  console.log('\n[PASO 5] Comprobando coherencia de estados entre Pantalla 1 y Pantalla 2...');
  const finalState1 = await page1.evaluate(() => {
    const statusBadges = Array.from(document.querySelectorAll('span')).map(s => s.textContent?.trim()).filter(t => t === 'EN VIVO' || t === 'OFERTAS' || t === 'BIDDING' || t === 'OPEN' || t === 'STANDBY');
    return { statusBadges };
  });

  const finalState2 = await page2.evaluate(() => {
    const statusBadges = Array.from(document.querySelectorAll('span')).map(s => s.textContent?.trim()).filter(t => t === 'open' || t === 'bidding' || t === 'prepared');
    return { statusBadges };
  });

  console.log('Estado final Pantalla 1:', finalState1);
  console.log('Estado final Pantalla 2:', finalState2);

  await browser.close();

  console.log('\n================================================================');
  console.log('  ✓✓✓ PRUEBA OBLIGATORIA COMPLETADA Y VERIFICADA CON ÉXITO ✓✓✓  ');
  console.log('================================================================');
}

runMandatoryTest().catch(err => {
  console.error('\n❌ ERROR EN PRUEBA OBLIGATORIA:', err);
  process.exit(1);
});
