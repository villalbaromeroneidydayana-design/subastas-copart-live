const TUNNEL_URL = 'https://geological-overview-coins-became.trycloudflare.com';
const ORIGIN = 'https://subastas-copart-live.vercel.app';
const SESSION_ID = 'ses-live-001';

async function req(path: string, options: RequestInit = {}) {
  const headers = {
    'Origin': ORIGIN,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(`${TUNNEL_URL}${path}`, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function testTwoScreensAndManualBids() {
  console.log('========================================================================');
  console.log('VERIFICACIÓN DEL SISTEMA DE DOS PANTALLAS Y OFERTAS MANUALES');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, cond: boolean, details?: any) {
    total++;
    if (cond) {
      console.log(`  [✅ PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [❌ FAIL] ${desc}`);
      if (details) console.error('  Detalles:', details);
    }
  }

  // 1. Reset inicial
  const resetRes = await req(`/api/sessions/${SESSION_ID}/reset?admin=true`, { method: 'POST' });
  assert('1. Reset inicial de lote', resetRes.status === 200 && resetRes.data.success);

  // 2. Abrir subasta
  const startRes = await req(`/api/sessions/${SESSION_ID}/start`, { method: 'POST' });
  assert('2. Apertura de sala desde consola', startRes.status === 200 && startRes.data.success);

  // 3. Oferta Manual 1: Paleta #108 (Dallas, TX) por $5,250
  const bid1 = await req(`/api/sessions/${SESSION_ID}/manual-bid`, {
    method: 'POST',
    body: JSON.stringify({
      paddleNumber: 'Paleta #108',
      amount: 5250
    })
  });
  assert('3. Oferta manual Paleta #108 ($5,250)', bid1.status === 200 && bid1.data.success && bid1.data.bid?.amount === 5250);

  // 4. Oferta Manual 2: Paleta #214 (Los Angeles, CA) por $5,500
  const bid2 = await req(`/api/sessions/${SESSION_ID}/manual-bid`, {
    method: 'POST',
    body: JSON.stringify({
      paddleNumber: 'Paleta #214',
      amount: 5500
    })
  });
  assert('4. Oferta manual Paleta #214 ($5,500)', bid2.status === 200 && bid2.data.success && bid2.data.bid?.amount === 5500);

  // 5. Oferta Manual 3: Paleta #101 (Broker Real) por $6,000
  const bid3 = await req(`/api/sessions/${SESSION_ID}/manual-bid`, {
    method: 'POST',
    body: JSON.stringify({
      paddleNumber: 'Paleta #101',
      amount: 6000
    })
  });
  assert('5. Oferta manual Paleta #101 Broker Real ($6,000)', bid3.status === 200 && bid3.data.success && bid3.data.bid?.amount === 6000);

  // 6. Verificar que el precio actual en sala es $6,000 y el líder es Paleta #101
  const sessionCheck = await req(`/api/sessions/${SESSION_ID}`);
  assert('6. Verificación de precio en sala ($6,000 USD)', sessionCheck.data.session?.currentPrice === 6000);
  assert('7. Verificación de líder en sala (Paleta #101)', sessionCheck.data.session?.currentWinnerPaddle === 'Paleta #101');

  // 8. Llamadas del Subastador: GOING ONCE
  const call1 = await req(`/api/sessions/${SESSION_ID}/call`, {
    method: 'POST',
    body: JSON.stringify({ call: 'going_once' })
  });
  assert('8. Llamada GOING ONCE emitida a sala', call1.status === 200 && call1.data.success);

  // 9. Llamadas del Subastador: GOING TWICE
  const call2 = await req(`/api/sessions/${SESSION_ID}/call`, {
    method: 'POST',
    body: JSON.stringify({ call: 'going_twice' })
  });
  assert('9. Llamada GOING TWICE emitida a sala', call2.status === 200 && call2.data.success);

  // 10. Martillazo final: SOLD
  const soldRes = await req(`/api/sessions/${SESSION_ID}/adjudicate`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'sold' })
  });
  assert('10. Martillazo SOLD ejecutado soberanamente', soldRes.status === 200 && soldRes.data.success);

  // 11. Comprobar que el ganador es Paleta #101 porque tenía la última oferta
  const finalCheck = await req(`/api/sessions/${SESSION_ID}`);
  assert('11. Ganador oficial registrado es Paleta #101', finalCheck.data.session?.currentWinnerPaddle === 'Paleta #101');
  assert('12. Estado oficial es sold', finalCheck.data.session?.status === 'sold');

  // 12. Reset lote inicial
  await req(`/api/sessions/${SESSION_ID}/reset?admin=true`, { method: 'POST' });

  console.log('\n========================================================================');
  console.log(`TOTAL PRUEBAS EJECUTADAS: ${total}`);
  console.log(`TOTAL APROBADAS: ${passed}`);
  console.log(`RESULTADO: ${passed === total ? '✅ 100% OPERATIVO' : '⚠️ ATENCIÓN REQUERIDA'}`);
  console.log('========================================================================');
}

testTwoScreensAndManualBids();
