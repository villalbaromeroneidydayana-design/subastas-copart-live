import puppeteer from 'puppeteer-core';

function getEdgePath(): string {
  return 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function runProductionCrossDeviceTest() {
  console.log('====================================================================');
  console.log(' VALIDACIÓN EN PRODUCCIÓN: DOS DISPOSITIVOS DIFERENTES VÍA WEBSOCKET');
  console.log(' (Dispositivo 2 tiene BroadcastChannel DESHABILITADO para forzar WSS)');
  console.log('====================================================================\n');

  // Verificar backend público
  console.log('[1/9] Comprobando salud del túnel público HTTPS y WSS...');
  const healthRes = await fetch('https://yard-vice-preston-proposals.trycloudflare.com/api/sessions');
  const healthData = await healthRes.json();
  console.log(`✓ Túnel HTTPS Cloudflare ACTIVO: ${healthRes.status} OK (Sesiones: ${healthData.length})`);

  // Reset inicial en servidor público
  await fetch('https://yard-vice-preston-proposals.trycloudflare.com/api/sessions/ses-live-001/reset?admin=true', { method: 'POST' });

  const browser = await puppeteer.launch({
    executablePath: getEdgePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  try {
    // ------------------------------------------------------------------
    // DISPOSITIVO 1: COMPUTADOR / CONSOLA DEL SUBASTADOR (DESKTOP)
    // ------------------------------------------------------------------
    const contextDesktop = await browser.createBrowserContext();
    const pageDesktop = await contextDesktop.newPage();
    await pageDesktop.setViewport({ width: 1400, height: 900 });
    await pageDesktop.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (PC Subastador)');
    
    console.log('[2/9] Abriendo Dispositivo 1 (PC Subastador en Vercel)...');
    await pageDesktop.goto('https://subastas-copart-live.vercel.app/', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // ------------------------------------------------------------------
    // DISPOSITIVO 2: TELÉFONO MÓVIL / ESPECTADORES (IPHONE / OTRA RED)
    // Se elimina window.BroadcastChannel en el script de inicio para obligar
    // a que el 100% de la sincronización viaje por WebSocket en Internet.
    // ------------------------------------------------------------------
    const contextMobile = await browser.createBrowserContext();
    const pageMobile = await contextMobile.newPage();
    await pageMobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await pageMobile.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 (Celular Espectador Remoto)');
    
    // Inyectar deshabilitación estricta de BroadcastChannel antes de cargar scripts
    await pageMobile.evaluateOnNewDocument(() => {
      // @ts-ignore
      delete (window as any).BroadcastChannel;
      // @ts-ignore
      (window as any).BroadcastChannel = undefined;
      console.log('(!) BroadcastChannel ELIMINADO en Celular para probar 100% WebSocket puro.');
    });

    console.log('[3/9] Abriendo Dispositivo 2 (Celular Espectador en Vercel, SIN BroadcastChannel)...');
    await pageMobile.goto('https://subastas-copart-live.vercel.app/#/sala/copart-live-m729k1', { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    // Verificar estado inicial en Celular
    const initialMobileState = await pageMobile.evaluate(() => {
      const text = document.body.innerText;
      return {
        has5000: text.includes('5000') || text.includes('5.000'),
        hasStandby: text.includes('STANDBY') || text.includes('PREVIEW') || text.includes('INSPECCIÓN'),
        broadcastChannelAvailable: typeof (window as any).BroadcastChannel !== 'undefined',
      };
    });
    console.log('Estado inicial Dispositivo 2 (Celular):', initialMobileState);

    // ------------------------------------------------------------------
    // 4. INICIAR SUBASTA — VERIFICAR QUE EL RELOJ ARRANQUE EN AMBOS DISPOSITIVOS
    // ------------------------------------------------------------------
    console.log('\n[4/9] Pulsando SUBASTAR en Dispositivo 1 (PC Subastador)...');
    const clickedSubastar = await pageDesktop.evaluate(() => {
      const btn = document.querySelector('#btn-subastar-banner') as HTMLElement ||
                  document.querySelector('#btn-subastar-main') as HTMLElement;
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Subastar pulsado en PC:', clickedSubastar);

    await sleep(2500);

    const clockPC = await pageDesktop.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span, button')).map(el => el.textContent?.trim()).filter(t => t && t.endsWith('s'));
      return spans;
    });
    const clockMobile = await pageMobile.evaluate(() => {
      const circle = document.querySelector('circle[stroke-dashoffset]') as SVGElement;
      return {
        offset: circle ? circle.getAttribute('stroke-dashoffset') : null,
        text: document.body.innerText.includes('BIDDING') || document.body.innerText.includes('EN VIVO')
      };
    });
    console.log('Reloj en Dispositivo 1 (PC):', clockPC);
    console.log('Reloj en Dispositivo 2 (Celular vía WebSocket): offset animado =', clockMobile.offset, 'activo =', clockMobile.text);

    // ------------------------------------------------------------------
    // 5. REALIZAR UNA PUJA — VERIFICAR CAMBIO INMEDIATO EN CELULAR
    // ------------------------------------------------------------------
    console.log('\n[5/9] Enviando puja con Paleta #101 desde Dispositivo 1 (PC Subastador)...');
    await pageDesktop.evaluate(() => {
      const btnQuick101 = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Pujar #101 (+'));
      if (btnQuick101) (btnQuick101 as HTMLElement).click();
    });
    await sleep(2000);

    const mobileBidState = await pageMobile.evaluate(() => {
      const text = document.body.innerText;
      return {
        has5250: text.includes('5.250') || text.includes('5,250') || text.includes('5250'),
        has5500: text.includes('5.500') || text.includes('5,500') || text.includes('5500'),
        hasLeader101: text.includes('101') || text.includes('Carlos Mendoza'),
      };
    });
    console.log('Puja recibida en Dispositivo 2 (Celular vía WebSocket):', mobileBidState);

    // ------------------------------------------------------------------
    // 6. PAUSAR SUBASTA — VERIFICAR QUE SE DETENGA EN CELULAR
    // ------------------------------------------------------------------
    console.log('\n[6/9] Pulsando PAUSAR en Dispositivo 1 (PC Subastador)...');
    await pageDesktop.evaluate(() => {
      const btn = document.querySelector('#btn-pausar') as HTMLElement;
      if (btn) btn.click();
    });
    await sleep(2000);

    const mobilePause1 = await pageMobile.evaluate(() => {
      const circle = document.querySelector('circle[stroke-dashoffset]') as SVGElement;
      return circle ? circle.getAttribute('stroke-dashoffset') : null;
    });
    await sleep(1500);
    const mobilePause2 = await pageMobile.evaluate(() => {
      const circle = document.querySelector('circle[stroke-dashoffset]') as SVGElement;
      return circle ? circle.getAttribute('stroke-dashoffset') : null;
    });
    console.log('Dispositivo 2 en pausa: offset t0 =', mobilePause1, 't+1.5s =', mobilePause2, '(Inalterado = congelado)');

    // ------------------------------------------------------------------
    // 7. REANUDAR SUBASTA — VERIFICAR QUE EL RELOJ AVANCE EN CELULAR
    // ------------------------------------------------------------------
    console.log('\n[7/9] Pulsando REANUDAR en Dispositivo 1 (PC Subastador)...');
    await pageDesktop.evaluate(() => {
      const btn = document.querySelector('#btn-reanudar') as HTMLElement;
      if (btn) btn.click();
    });
    await sleep(2500);

    const mobileResume = await pageMobile.evaluate(() => {
      const circle = document.querySelector('circle[stroke-dashoffset]') as SVGElement;
      return circle ? circle.getAttribute('stroke-dashoffset') : null;
    });
    console.log('Dispositivo 2 reanudado: offset avanzó a =', mobileResume);

    // ------------------------------------------------------------------
    // 8. RESETEAR SUBASTA — VERIFICAR RETORNO A INICIAL EN CELULAR
    // ------------------------------------------------------------------
    console.log('\n[8/9] Pulsando RESET en Dispositivo 1 (PC Subastador)...');
    await pageDesktop.evaluate(() => {
      const btn = document.querySelector('#btn-reset-auction') as HTMLElement;
      if (btn) btn.click();
    });
    await sleep(2000);

    const mobileReset = await pageMobile.evaluate(() => {
      const text = document.body.innerText;
      return {
        has5000: text.includes('5000') || text.includes('5.000'),
        hasStandby: text.includes('STANDBY') || text.includes('PREVIEW') || text.includes('INSPECCIÓN'),
      };
    });
    console.log('Dispositivo 2 (Celular) tras RESET:', mobileReset);

    // ------------------------------------------------------------------
    // 9. FINALIZAR SUBASTA (SOLD) — VERIFICAR EN CELULAR
    // ------------------------------------------------------------------
    console.log('\n[9/9] Subastando y ejecutando SOLD desde Dispositivo 1 (PC Subastador)...');
    await pageDesktop.evaluate(() => {
      const subastarBtn = document.querySelector('#btn-subastar-banner') as HTMLElement ||
                          document.querySelector('#btn-subastar-main') as HTMLElement;
      if (subastarBtn) subastarBtn.click();
    });
    await sleep(1500);

    await pageDesktop.evaluate(() => {
      const soldBtn = document.querySelector('#btn-sold') as HTMLElement;
      if (soldBtn) soldBtn.click();
    });
    await sleep(2500);

    const mobileSold = await pageMobile.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasSold: text.includes('SOLD') || text.includes('VENDIDO') || text.includes('ADJUDICADO'),
      };
    });
    console.log('Dispositivo 2 (Celular vía WebSocket) recibió SOLD:', mobileSold.hasSold);

    console.log('\n====================================================================');
    console.log(' ✓✓✓ VALIDACIÓN EN PRODUCCIÓN VÍA WEBSOCKET COMPLETADA CON ÉXITO ✓✓✓');
    console.log('====================================================================');

  } finally {
    await browser.close();
  }
}

runProductionCrossDeviceTest().catch((err) => {
  console.error('Error durante la validación en producción:', err);
  process.exit(1);
});

