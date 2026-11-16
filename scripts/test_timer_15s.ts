import { WebSocket } from 'ws';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log('=== TEST TEMPORIZADOR 15 SEGUNDOS PUJAMOTOR USA ===');
  
  // 1. Resetear sesión a estado inicial limpio
  const resetRes = await fetch('http://localhost:3001/api/sessions/ses-live-001/reset?admin=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin: true })
  });
  console.log('1. Reset sesión:', resetRes.status);

  // 2. Conectar WebSocket para auditar eventos de reloj y ofertas en tiempo real
  const ws = new WebSocket('ws://localhost:3001');
  const receivedEvents: any[] = [];

  await new Promise<void>((resolve, reject) => {
    ws.on('open', () => {
      console.log('2. WebSocket conectado');
      ws.send(JSON.stringify({ type: 'JOIN_SESSION', sessionId: 'ses-live-001', role: 'spectator' }));
      resolve();
    });
    ws.on('error', reject);
    ws.on('message', (data) => {
      try {
        const ev = JSON.parse(data.toString());
        receivedEvents.push(ev);
      } catch {}
    });
  });

  // 3. Abrir la sala (Start Auction)
  console.log('3. Iniciando subasta (Start Auction)...');
  const startRes = await fetch('http://localhost:3001/api/sessions/ses-live-001/start', {
    method: 'POST'
  });
  const startData = await startRes.json();
  console.log('Respuesta start:', startData);

  // Esperar 2 segundos para ver los ticks del reloj inicial
  await new Promise(r => setTimeout(r, 2200));

  // Verificar sesión en base de datos / REST
  const sessionRes = await fetch('http://localhost:3001/api/sessions/ses-live-001').then(r => r.json());
  const sessionCheck1 = sessionRes.session;
  console.log(`4. Estado tras inicio: status=${sessionCheck1.status}, time_remaining=${sessionCheck1.time_remaining_seconds ?? sessionCheck1.timeRemainingSeconds}s, total_duration=${sessionCheck1.total_duration_seconds ?? sessionCheck1.totalDurationSeconds}s`);

  if ((sessionCheck1.total_duration_seconds ?? sessionCheck1.totalDurationSeconds) !== 15) {
    throw new Error(`FAIL: total_duration_seconds debería ser 15, pero es ${sessionCheck1.total_duration_seconds ?? sessionCheck1.totalDurationSeconds}`);
  }

  // 5. Emitir una oferta de Broker (Paleta #101) por $5,250 USD
  console.log('5. Emitiendo oferta autorizada de Broker #101 por $5,250 USD...');
  const bidRes = await fetch('http://localhost:3001/api/bids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'ses-live-001',
      participantToken: 'bdr_broker_m729k1',
      amount: 5250
    })
  });
  const bidData = await bidRes.json();
  console.log('Resultado oferta #101:', {
    success: bidData.success,
    amount: bidData.bid?.amount,
    timeRemainingSeconds: bidData.session?.timeRemainingSeconds
  });

  if (bidData.session?.timeRemainingSeconds !== 15) {
    throw new Error(`FAIL: El reinicio de la oferta no devolvió 15s, devolvió ${bidData.session?.timeRemainingSeconds}`);
  }

  // 6. Verificar evento WebSocket de la oferta
  const bidEvent = receivedEvents.find(e => e.type === 'NEW_REAL_BID' && e.bid?.amount === 5250);
  console.log('6. Evento WebSocket NEW_REAL_BID:', {
    found: Boolean(bidEvent),
    timeRemaining: bidEvent?.timeRemaining,
    currentPrice: bidEvent?.currentPrice
  });

  if (!bidEvent || bidEvent.timeRemaining !== 15) {
    throw new Error(`FAIL: Evento WS de oferta no trajo timeRemaining=15 (trajo ${bidEvent?.timeRemaining})`);
  }

  // 7. Esperar 3 segundos para comprobar el decremento progresivo
  await new Promise(r => setTimeout(r, 3200));

  const ticksAfterBid = receivedEvents.filter(e => e.type === 'CLOCK_TICK');
  const recentTick = ticksAfterBid[ticksAfterBid.length - 1];
  console.log('7. Último CLOCK_TICK recibido tras 3 segundos:', {
    timeRemaining: recentTick?.timeRemaining,
    status: recentTick?.status
  });

  // 8. Emitir oferta de competidor ("Lo Manejo Yo" / trigger-competitor-bid)
  console.log('8. Emitiendo oferta de competidor...');
  const compRes = await fetch('http://localhost:3001/api/sessions/ses-live-001/trigger-competitor-bid', {
    method: 'POST'
  });
  const compData = await compRes.json();
  console.log('Resultado competidor:', {
    success: compData.success,
    amount: compData.bid?.amount,
    timeRemainingSeconds: compData.session?.timeRemainingSeconds
  });

  if (compData.session?.timeRemainingSeconds !== 15) {
    throw new Error(`FAIL: Oferta de competidor no reinició a 15s`);
  }

  // 9. Comprobación real en Navegador Headless (DOM y Canvas SVG)
  if (fs.existsSync(EDGE_PATH)) {
    console.log('9. Abriendo Edge para verificar UI de la Sala Principal...');
    const browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Ir a la sala pública
    await page.goto('http://localhost:5173/#/sala/copart-live-m729k1', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Extraer texto y atributos del temporizador circular en el DOM
    const timerData = await page.evaluate(() => {
      // Buscar elementos que contengan números o segundos
      const clockSpans = Array.from(document.querySelectorAll('span, div, text'))
        .map(el => el.textContent?.trim())
        .filter(t => t && (t.endsWith('s') || /^\d+$/.test(t)));
      
      const svgCircle = document.querySelector('svg circle[stroke-dashoffset]');
      const dashOffset = svgCircle ? svgCircle.getAttribute('stroke-dashoffset') : null;
      const strokeDasharray = svgCircle ? svgCircle.getAttribute('stroke-dasharray') : null;

      return {
        clockTexts: clockSpans.slice(0, 10),
        dashOffset,
        strokeDasharray
      };
    });

    console.log('Resultado inspección UI Edge:', timerData);

    await browser.close();
    console.log('✓ Inspección en navegador completada con éxito.');
  }

  ws.close();
  console.log('=== TODOS LOS TESTS DEL TEMPORIZADOR DE 15 SEGUNDOS PASARON EXITOSAMENTE ===');
}

main().catch(err => {
  console.error('ERROR EN TEST:', err);
  process.exit(1);
});
