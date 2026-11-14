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
  return { status: res.status, data, headers: res.headers };
}

async function runProductionTests() {
  console.log('========================================================================');
  console.log('VERIFICACIÓN REAL DE PRODUCCIÓN (HTTPS / VERCEL ORIGIN)');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function check(desc: string, cond: boolean, details?: any) {
    total++;
    if (cond) {
      console.log(`  [✅ PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [❌ FAIL] ${desc}`);
      if (details) console.error('  Detalles:', details);
    }
  }

  // 1. Reset administrativo
  const resetRes = await req(`/api/sessions/${SESSION_ID}/reset?admin=true`, { method: 'POST' });
  check('1. Reset administrativo inicial', resetRes.status === 200 && resetRes.data.success);

  // 2. Comprobar 3 accesos independientes
  const auctioneerCheck = await req(`/api/room/copart-live-m729k1?auctioneer=true`);
  check('2.1 Acceso Subastador (Dirección de sala)', auctioneerCheck.status === 200 && auctioneerCheck.data.role === 'auctioneer');

  const brokerCheck = await req(`/api/room/copart-live-m729k1?broker=bdr_broker_m729k1`);
  check('2.2 Acceso Broker Autorizado (Paleta #101)', brokerCheck.status === 200 && brokerCheck.data.role === 'broker');

  const buyerCheck = await req(`/api/room/copart-live-m729k1?cliente=bdr_buyer_m729k1`);
  check('2.3 Acceso Cliente / Comprador (Modo Espectador)', buyerCheck.status === 200 && buyerCheck.data.role === 'buyer');

  // 3. Abrir subasta (Start Sale)
  const startRes = await req(`/api/sessions/${SESSION_ID}/start`, { method: 'POST' });
  check('3. Operación: ABRIR SUBASTA (Start Sale)', startRes.status === 200 && startRes.data.success);

  // 4. Pausar y reanudar
  const pauseRes = await req(`/api/sessions/${SESSION_ID}/pause`, { method: 'POST' });
  check('4.1 Operación: PAUSAR SUBASTA (Pause)', pauseRes.status === 200 && pauseRes.data.success);

  const resumeRes = await req(`/api/sessions/${SESSION_ID}/resume`, { method: 'POST' });
  check('4.2 Operación: REANUDAR SUBASTA (Resume)', resumeRes.status === 200 && resumeRes.data.success);

  // 5. Oferta de competidor simulado (Pujador virtual de EE.UU.)
  const compBid = await req(`/api/sessions/${SESSION_ID}/trigger-competitor-bid`, { method: 'POST' });
  check('5. Operación: PUJA COMPETIDOR SIMULADO (EE.UU.)', compBid.status === 200 && compBid.data.success, compBid.data);

  // 6. Oferta real del Broker (Paleta #101)
  const brokerBid = await req(`/api/bids`, {
    method: 'POST',
    body: JSON.stringify({
      sessionId: SESSION_ID,
      participantToken: 'bdr_broker_m729k1',
      amount: 5500
    })
  });
  check('6. Operación: REGISTRAR OFERTA REAL DEL BROKER ($5,500)', brokerBid.status === 200 && brokerBid.data.success && brokerBid.data.bid?.amount === 5500);

  // 7. Actualización de precio e incrementos
  const sessionCheck = await req(`/api/sessions/${SESSION_ID}`);
  check('7. Comprobación: PRECIO ACTUALIZADO A $5,500', sessionCheck.data.session?.currentPrice === 5500 && sessionCheck.data.session?.currentWinnerPaddle === 'Paleta #101');

  // 8. Solicitud y autorización de presupuesto extraordinario (Broker -> Comprador)
  const budgetReq = await req(`/api/sessions/${SESSION_ID}/budget-requests`, {
    method: 'POST',
    body: JSON.stringify({
      brokerToken: 'bdr_broker_m729k1',
      requestedAmount: 8500
    })
  });
  check('8.1 Solicitud de Presupuesto Extraordinario emitida', budgetReq.status === 200 && budgetReq.data.success);
  const reqId = budgetReq.data.request?.id;

  if (reqId) {
    const authRes = await req(`/api/budget-authorizations/${reqId}/respond`, {
      method: 'POST',
      body: JSON.stringify({
        buyerToken: 'bdr_buyer_m729k1',
        decision: 'approve'
      })
    });
    check('8.2 Autorización del Comprador ejecutada', authRes.status === 200 && authRes.data.success);
  }

  // 9. Bajar Martillo (SOLD / Hammer Down)
  const soldRes = await req(`/api/sessions/${SESSION_ID}/sold`, { method: 'POST' });
  check('9. Operación: BAJAR MARTILLO (SOLD)', soldRes.status === 200 && soldRes.data.success);

  // 10. Verificación inmutable de ganador y bloqueo de cliente
  const soldState = await req(`/api/sessions/${SESSION_ID}`);
  check('10.1 Ganador oficial inmutable es Broker Real (#101)', soldState.data.session?.currentWinnerPaddle === 'Paleta #101');
  check('10.2 Estado de sesión en SOLD', soldState.data.session?.status === 'sold');

  const buyerBlocked = await req(`/api/room/copart-live-m729k1?cliente=bdr_buyer_m729k1`);
  check('10.3 Acceso de cliente revocado por fin de subasta (HTTP 403)', buyerBlocked.status === 403);

  // 11. Generación y consulta de documentos oficiales
  const docRes = await req(`/api/sessions/${SESSION_ID}/documents`, {
    method: 'POST',
    body: JSON.stringify({
      clientName: 'Carlos Mendoza',
      clientEmail: 'carlos@ejemplo.com',
      expiresInDays: 30
    })
  });
  check('11.1 Operación: GENERAR DOCUMENTO DE ADJUDICACIÓN', docRes.status === 200 && !!docRes.data.docToken);

  const docToken = docRes.data.docToken;
  if (docToken) {
    const getDoc = await req(`/api/documents/${docToken}`);
    check('11.2 Operación: CONSULTA INDEPENDIENTE DE DOCUMENTO', getDoc.status === 200 && !!getDoc.data.document);
  }

  // 12. Pasar al Siguiente Lote (Next Lot / Client)
  const nextLot = await req(`/api/sessions/${SESSION_ID}/next-lot`, {
    method: 'POST',
    body: JSON.stringify({
      lotNumber: '88192003',
      buyerName: 'Roberto Valenzuela',
      clientMaxBudget: 18000,
      startingPrice: 12000,
      minIncrement: 500,
      vehicle: {
        brand: 'Porsche',
        model: '911 Carrera 4S',
        year: 2024,
        lot_number: '88192003',
        vin: 'WP0AB2A99RS129038',
        odometer: 4890,
        odometer_unit: 'mi',
        title_type: 'clean',
        vehicle_condition: 'run_and_drive',
        primary_damage: 'None',
        secondary_damage: 'None',
        has_keys: true,
        location: 'Atlanta East (GA)',
        est_retail_value: 142000,
        images: []
      }
    })
  });
  check('12.1 Operación: PASAR AL SIGUIENTE LOTE Y CLIENTE', nextLot.status === 200 && nextLot.data.success);

  const nextSession = await req(`/api/sessions/${SESSION_ID}`);
  check('12.2 Nuevo lote cargado en pantalla (Porsche 911)', nextSession.data.session?.lotNumber === '88192003');
  check('12.3 Nuevo comprador asignado (Roberto Valenzuela)', nextSession.data.session?.buyerName?.includes('Roberto'));

  // 13. Cerrar sala (Close Lane)
  const closeRes = await req(`/api/sessions/${SESSION_ID}/close`, { method: 'POST' });
  check('13. Operación: CERRAR SALA (Close Lane)', closeRes.status === 200 && closeRes.data.success);

  // Restaurar lote original
  await req(`/api/sessions/${SESSION_ID}/reset?admin=true`, { method: 'POST' });

  console.log('\n========================================================================');
  console.log(`TOTAL PRUEBAS EJECUTADAS SOBRE LA NUBE: ${total}`);
  console.log(`TOTAL APROBADAS: ${passed}`);
  console.log(`FALLOS: ${total - passed}`);
  console.log(`RESULTADO: ${passed === total ? '✅ 100% OPERATIVO EN PRODUCCIÓN' : '⚠️ ATENCIÓN REQUERIDA'}`);
  console.log('========================================================================');
}

runProductionTests();
