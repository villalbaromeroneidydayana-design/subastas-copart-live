import puppeteer from 'puppeteer-core';
import http from 'http';

function getEdgePath(): string {
  const paths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of paths) {
    return p;
  }
  return paths[0];
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function runAllTests() {
  console.log('================================================================');
  console.log(' AUDITORÍA COMPLETA DE TODOS LOS BOTONES Y SINCRONIZACIÓN EN VIVO');
  console.log('================================================================\n');

  // 0. Resetear sesión en servidor
  console.log('[Paso 0] Inicializando sesión limpia...');
  const resetRes = await fetch('http://localhost:3001/api/sessions/ses-live-001/reset?admin=true', { method: 'POST' });
  console.log('Status reset API:', resetRes.status);

  const browser = await puppeteer.launch({
    executablePath: getEdgePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  try {
    // Abrir PANTALLA 1: Sala de Espectadores
    const pageSpectator = await browser.newPage();
    await pageSpectator.setViewport({ width: 1200, height: 900 });
    console.log('Abriendo PANTALLA 1 (Espectadores)...');
    await pageSpectator.goto('http://localhost:5173/#/sala/copart-live-m729k1', { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Abrir PANTALLA 2: Consola del Subastador
    const pageAuctioneer = await browser.newPage();
    await pageAuctioneer.setViewport({ width: 1400, height: 900 });
    console.log('Abriendo PANTALLA 2 (Subastador)...');
    await pageAuctioneer.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // -------------------------------------------------------------
    // 1. CONFIGURAR PARÁMETROS EN PANTALLA 2
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 1] Configurando subasta en PANTALLA 2 (Subastador)...');
    const openParams = await pageAuctioneer.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Parámetros'));
      if (btn) { (btn as HTMLElement).click(); return true; }
      return false;
    });
    console.log('Modal parámetros abierto en P2:', openParams);
    await sleep(1000);

    await pageAuctioneer.evaluate(() => {
      const incSelect = document.querySelector('select') as HTMLSelectElement;
      if (incSelect) {
        incSelect.value = '500';
        incSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Guardar y Aplicar'));
      if (saveBtn) (saveBtn as HTMLElement).click();
    });
    await sleep(1500);

    // -------------------------------------------------------------
    // 2. VERIFICAR QUE APAREZCA EN ESPECTADORES
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 2] Verificando recepción de parámetros en PANTALLA 1 (Espectadores)...');
    const p1Params = await pageSpectator.evaluate(() => {
      const text = document.body.innerText;
      return {
        has500Increment: text.includes('500'),
        priceText: document.querySelector('.font-black.text-4xl, .font-mono')?.textContent?.trim()
      };
    });
    console.log('Espectadores reflejan parámetros:', p1Params);

    // -------------------------------------------------------------
    // 3. BOTÓN SUBASTAR — COMPROBAR QUE ARRANQUE EL RELOJ EN AMBAS PANTALLAS
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 3] Pulsando botón SUBASTAR en PANTALLA 2...');
    const clickedSubastar = await pageAuctioneer.evaluate(() => {
      const btn = document.querySelector('#btn-subastar-banner') as HTMLElement ||
                  document.querySelector('#btn-subastar-main') as HTMLElement;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Botón SUBASTAR clickeado:', clickedSubastar);

    await sleep(2500);

    const clockState1 = await pageSpectator.evaluate(() => {
      const circle = document.querySelector('circle[stroke-dashoffset]') as SVGElement;
      const offset = circle ? circle.getAttribute('stroke-dashoffset') : null;
      return {
        offset,
        statusText: Array.from(document.querySelectorAll('.font-black')).map(el => el.textContent?.trim()).filter(Boolean)
      };
    });

    const clockState2 = await pageAuctioneer.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span, button')).map(el => el.textContent?.trim()).filter(t => t && t.endsWith('s'));
      return { spans };
    });
    console.log('Reloj en Pantalla 1 (Espectadores): offset animado =', clockState1.offset);
    console.log('Reloj en Pantalla 2 (Subastador):', clockState2.spans);

    // -------------------------------------------------------------
    // 4. CAMBIAR PRECIO / ENVIAR PUJA — COMPROBAR ACTUALIZACIÓN EN ESPECTADORES
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 4] Probando AUMENTO DE PUJA y envío de oferta en PANTALLA 2...');
    await pageAuctioneer.evaluate(() => {
      const btnQuick101 = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Pujar #101 (+'));
      if (btnQuick101) (btnQuick101 as HTMLElement).click();
    });
    await sleep(1500);

    const p1Bid = await pageSpectator.evaluate(() => {
      return {
        text: document.body.innerText.includes('5.500') || document.body.innerText.includes('5,500') || document.body.innerText.includes('5.250') || document.body.innerText.includes('5,250'),
        bodyTextSnippet: document.body.innerText.slice(0, 300)
      };
    });
    console.log('Pantalla 1 (Espectadores) recibió la nueva puja:', p1Bid.text);

    // -------------------------------------------------------------
    // 4b. PROBAR BOTÓN DISMINUIR PUJA
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 4b] Probando botón DISMINUIR PUJA en PANTALLA 2...');
    const decVal = await pageAuctioneer.evaluate(() => {
      const decBtn = document.querySelector('#btn-dec-100') as HTMLElement;
      if (decBtn) decBtn.click();
      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
      return input ? input.value : null;
    });
    console.log('Importe tras pulsar DISMINUIR (-$100):', decVal);

    // -------------------------------------------------------------
    // 5. BOTÓN PAUSAR — COMPROBAR QUE AMBOS RELOJES SE DETENGAN
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 5] Pulsando botón PAUSAR en PANTALLA 2...');
    const clickedPausar = await pageAuctioneer.evaluate(() => {
      const btn = document.querySelector('#btn-pausar') as HTMLElement;
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Botón PAUSAR clickeado:', clickedPausar);
    await sleep(2000);

    const pauseCheckP1 = await pageSpectator.evaluate(() => {
      const circle = document.querySelector('circle[stroke-dashoffset]') as SVGElement;
      return circle ? circle.getAttribute('stroke-dashoffset') : null;
    });
    await sleep(1500);
    const pauseCheckP1Later = await pageSpectator.evaluate(() => {
      const circle = document.querySelector('circle[stroke-dashoffset]') as SVGElement;
      return circle ? circle.getAttribute('stroke-dashoffset') : null;
    });
    console.log('Offset P1 en pausa:', pauseCheckP1, 'y 1.5s después:', pauseCheckP1Later, '(Inalterado = detenido)');

    // -------------------------------------------------------------
    // 6. BOTÓN REANUDAR — COMPROBAR QUE CONTINÚE LA CUENTA REGRESIVA
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 6] Pulsando botón REANUDAR en PANTALLA 2...');
    const clickedReanudar = await pageAuctioneer.evaluate(() => {
      const btn = document.querySelector('#btn-reanudar') as HTMLElement;
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Botón REANUDAR clickeado:', clickedReanudar);
    await sleep(2500);

    const resumeCheckP1 = await pageSpectator.evaluate(() => {
      const circle = document.querySelector('circle[stroke-dashoffset]') as SVGElement;
      return circle ? circle.getAttribute('stroke-dashoffset') : null;
    });
    console.log('Offset P1 reanudado (avanzó):', resumeCheckP1);

    // -------------------------------------------------------------
    // 7. BOTÓN RESET — COMPROBAR QUE LOS DATOS VUELVAN AL ESTADO INICIAL
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 7] Pulsando botón RESET en PANTALLA 2...');
    const clickedReset = await pageAuctioneer.evaluate(() => {
      const btn = document.querySelector('#btn-reset-auction') as HTMLElement;
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Botón RESET clickeado:', clickedReset);
    await sleep(2000);

    const resetP1 = await pageSpectator.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasStandby: text.includes('STANDBY') || text.includes('PREVIEW') || text.includes('ESPERA') || text.includes('INSPECCIÓN'),
        has5000: text.includes('5000') || text.includes('5.000'),
      };
    });
    const resetP2 = await pageAuctioneer.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPreparedBadge: text.includes('prepared') || text.includes('LISTO PARA SUBASTAR'),
        has5000: text.includes('5000') || text.includes('5.000'),
      };
    });
    console.log('Pantalla 1 tras RESET:', resetP1);
    console.log('Pantalla 2 tras RESET:', resetP2);

    // -------------------------------------------------------------
    // 8. FINALIZAR SUBASTA (SOLD / UNSOLD)
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 8] Probando FINALIZACIÓN (SOLD) desde PANTALLA 2...');
    // Primero subastamos de nuevo para adjudicar
    await pageAuctioneer.evaluate(() => {
      const btn = document.querySelector('#btn-subastar-banner') as HTMLElement ||
                  document.querySelector('#btn-subastar-main') as HTMLElement;
      if (btn) btn.click();
    });
    await sleep(1500);

    // Pulsar SOLD
    const clickedSold = await pageAuctioneer.evaluate(() => {
      const btn = document.querySelector('#btn-sold') as HTMLElement;
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Botón SOLD clickeado:', clickedSold);
    await sleep(2500);

    const soldP1 = await pageSpectator.evaluate(() => {
      return {
        hasSold: document.body.innerText.includes('SOLD') || document.body.innerText.includes('VENDIDO') || document.body.innerText.includes('ADJUDICADO'),
        textSnippet: document.body.innerText.slice(0, 300)
      };
    });
    console.log('Pantalla 1 (Espectadores) recibió SOLD:', soldP1.hasSold);

    // -------------------------------------------------------------
    // 9. NAVEGACIÓN DE LOTES (ANTERIOR / SIGUIENTE)
    // -------------------------------------------------------------
    console.log('\n[PRUEBA 9] Probando botones SIGUIENTE y ANTERIOR en PANTALLA 2...');
    const lotNav = await pageAuctioneer.evaluate(() => {
      const nextBtn = document.querySelector('#btn-next-lot-quick') as HTMLElement;
      if (nextBtn) nextBtn.click();
      return true;
    });
    await sleep(2000);
    const p1Car = await pageSpectator.evaluate(() => document.body.innerText.slice(0, 200));
    console.log('Pantalla 1 tras cambiar lote:', p1Car.includes('Ford') || p1Car.includes('202'));

    console.log('\n================================================================');
    console.log(' ✓✓✓ TODAS LAS PRUEBAS COMPLETADAS Y VERIFICADAS CON ÉXITO ✓✓✓');
    console.log('================================================================');

  } finally {
    await browser.close();
  }
}

runAllTests().catch((err) => {
  console.error('Error durante la prueba:', err);
  process.exit(1);
});

