const BASE_URL = 'http://127.0.0.1:3001';
const SESSION_ID = 'ses-live-001';
const BROKER_TOKEN = 'bdr_broker_m729k1';
const BUYER_TOKEN = 'bdr_buyer_m729k1';
const FAKE_BUYER_TOKEN = 'bdr_fake_buyer_999999';

interface TestResult {
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
  evidence: any;
}

const results: TestResult[] = [];

function record(scenario: string, expected: string, actual: string, passed: boolean, evidence: any) {
  results.push({ scenario, expected, actual, passed, evidence });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${scenario}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
  if (!passed) console.error('  Evidence:', evidence);
}

async function runTests() {
  console.log('================================================================');
  console.log('AUDITORÍA INTEGRAL: AUTORIZACIÓN EXTRAORDINARIA DE PRESUPUESTO');
  console.log('================================================================\n');

  try {
    // 0. Resetear y abrir la subasta para un estado limpio
    await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/reset?admin=true`, { method: 'POST' });
    await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/start?admin=true`, { method: 'POST' });

    // Establecer presupuesto inicial en $7,500
    await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxBudget: 7500 })
    });

    // 1. Verificar estado inicial de la sesión
    const initialSessionRes = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}`);
    const initialSession = await initialSessionRes.json();
    const currentPrice = initialSession.session.currentPrice;
    const clientMaxBudget = initialSession.session.clientMaxBudget;

    record(
      'Verificación de Presupuesto Inicial Asignado',
      'Presupuesto debe ser $7,500 USD',
      `Presupuesto: $${clientMaxBudget} USD (Precio actual: $${currentPrice} USD)`,
      clientMaxBudget === 7500,
      { clientMaxBudget, currentPrice }
    );

    // 2. Escenario A: Intento de oferta a $7,800 SIN autorización
    // Debe ser rechazado categóricamente por el motor atómico en backend
    const bidWithoutAuthRes = await fetch(`${BASE_URL}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        participantToken: BROKER_TOKEN,
        amount: 7800
      })
    });
    const bidWithoutAuthData = await bidWithoutAuthRes.json();

    record(
      'Escenario A: Oferta de $7,800 USD sin autorización previa',
      'Rechazo con HTTP 400 y mensaje de superación de presupuesto',
      `Status HTTP ${bidWithoutAuthRes.status}: "${bidWithoutAuthData.error}"`,
      bidWithoutAuthRes.status === 400 && String(bidWithoutAuthData.error).includes('presupuesto'),
      bidWithoutAuthData
    );

    // 3. Escenario B: Solicitud de autorización del Broker por $7,800 USD
    const reqBudgetRes = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/budget-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brokerToken: BROKER_TOKEN,
        requestedAmount: 7800
      })
    });
    const reqBudgetData = await reqBudgetRes.json();

    record(
      'Escenario B: Broker crea solicitud de aumento a $7,800 USD',
      'HTTP 200 con status "pending", TTL 120s e id de autorización generado',
      `Status HTTP ${reqBudgetRes.status}: id="${reqBudgetData.request?.id}", status="${reqBudgetData.request?.status}", diff=+$${reqBudgetData.request?.difference}`,
      reqBudgetRes.status === 200 && reqBudgetData.request?.status === 'pending' && reqBudgetData.request?.requestedAmount === 7800,
      reqBudgetData
    );

    const authId = reqBudgetData.request?.id;

    // 4. Escenario C: Intento de respuesta con token de Comprador incorrecto/falso
    const fakeBuyerRes = await fetch(`${BASE_URL}/api/budget-authorizations/${authId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerToken: FAKE_BUYER_TOKEN,
        decision: 'approve'
      })
    });
    const fakeBuyerData = await fakeBuyerRes.json();

    record(
      'Escenario C: Intento de autorización con token de comprador ajeno',
      'HTTP 403 con error de comprador no autorizado',
      `Status HTTP ${fakeBuyerRes.status}: "${fakeBuyerData.error}"`,
      fakeBuyerRes.status === 403,
      fakeBuyerData
    );

    // 5. Escenario D: Aprobación legítima por el Comprador asignado
    const approveRes = await fetch(`${BASE_URL}/api/budget-authorizations/${authId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerToken: BUYER_TOKEN,
        decision: 'approve'
      })
    });
    const approveData = await approveRes.json();

    record(
      'Escenario D: Comprador aprueba expresamente la oferta de $7,800 USD',
      'HTTP 200 con status "approved" y responded_at registrado',
      `Status HTTP ${approveRes.status}: status="${approveData.request?.status}", respondedAt="${approveData.request?.respondedAt}"`,
      approveRes.status === 200 && approveData.request?.status === 'approved',
      approveData
    );

    // 6. Escenario E: Ejecución de la oferta autorizada de $7,800 USD por el Broker
    const authorizedBidRes = await fetch(`${BASE_URL}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        participantToken: BROKER_TOKEN,
        amount: 7800
      })
    });
    const authorizedBidData = await authorizedBidRes.json();

    record(
      'Escenario E: Broker coloca la oferta autorizada de $7,800 USD',
      'HTTP 200 aceptada atómicamente por el motor de subasta',
      `Status HTTP ${authorizedBidRes.status}: Precio actual nuevo=$${authorizedBidData.bid?.amount} USD`,
      authorizedBidRes.status === 200 && authorizedBidData.bid?.amount === 7800,
      authorizedBidData
    );

    // 7. Escenario F: Verificar que la autorización quedó consumida (monouso/status='used')
    const auditRes = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/budget-requests`);
    const auditList = await auditRes.json();
    const consumedAuth = auditList.find((a: any) => a.id === authId);

    record(
      'Escenario F: Monouso de autorización (marcada como "used")',
      'Status "used" con usedAt timestamp no nulo en base de datos',
      `Status="${consumedAuth?.status}", usedAt="${consumedAuth?.usedAt}"`,
      consumedAuth?.status === 'used' && Boolean(consumedAuth?.usedAt),
      consumedAuth
    );

    // 8. Escenario G: Siguiente oferta a $8,000 USD sin nueva autorización
    // Debe ser rechazada porque la autorización anterior ya fue consumida
    const nextBidRes = await fetch(`${BASE_URL}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        participantToken: BROKER_TOKEN,
        amount: 8000
      })
    });
    const nextBidData = await nextBidRes.json();

    record(
      'Escenario G: Nueva oferta a $8,000 USD sin nueva autorización',
      'Rechazo con HTTP 400 (la autorización de 7,800 no cubre 8,000 ni es reutilizable)',
      `Status HTTP ${nextBidRes.status}: "${nextBidData.error}"`,
      nextBidRes.status === 400 && String(nextBidData.error).includes('presupuesto'),
      nextBidData
    );

    // 9. Escenario H: Solicitud rechazada por el Comprador
    const rejectReqRes = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/budget-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brokerToken: BROKER_TOKEN,
        requestedAmount: 8200
      })
    });
    const rejectReqData = await rejectReqRes.json();
    const rejectAuthId = rejectReqData.request?.id;

    const rejectActionRes = await fetch(`${BASE_URL}/api/budget-authorizations/${rejectAuthId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerToken: BUYER_TOKEN,
        decision: 'reject',
        rejectionReason: 'Límite personal alcanzado'
      })
    });
    const rejectActionData = await rejectActionRes.json();

    const bidAfterRejectRes = await fetch(`${BASE_URL}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        participantToken: BROKER_TOKEN,
        amount: 8200
      })
    });
    const bidAfterRejectData = await bidAfterRejectRes.json();

    record(
      'Escenario H: Comprador rechaza solicitud de aumento a $8,200 USD',
      'Status "rejected", oferta a $8,200 sigue bloqueada',
      `Reject HTTP ${rejectActionRes.status} (status="${rejectActionData.request?.status}"); Bid HTTP ${bidAfterRejectRes.status}`,
      rejectActionData.request?.status === 'rejected' && bidAfterRejectRes.status === 400,
      { rejectActionData, bidAfterRejectData }
    );

    // 10. Escenario I: Revocación y Restauración independiente de accesos
    const roomToken = initialSession.session.roomToken || 'copart-live-m729k1';
    const revokeBrokerRes = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/revoke-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'broker' })
    });
    const checkBrokerRevokedRes = await fetch(`${BASE_URL}/api/room/${roomToken}?broker=${BROKER_TOKEN}`);
    const checkBrokerRevokedData = await checkBrokerRevokedRes.json();

    record(
      'Escenario I: Subastador revoca acceso independiente al Broker',
      'GET /api/room devuelve isRevoked=true para el broker',
      `isRevoked=${checkBrokerRevokedData.isRevoked}`,
      checkBrokerRevokedData.isRevoked === true,
      checkBrokerRevokedData
    );

    // Restaurar acceso del broker
    await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/restore-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'broker' })
    });

  } catch (err: any) {
    console.error('ERROR DURANTE AUDITORÍA:', err);
  }

  console.log('\n================================================================');
  console.log('RESUMEN DE PRUEBAS AUTOMATIZADAS');
  console.log('================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`Total Pruebas: ${results.length} | Aprobadas: ${results.filter(r => r.passed).length} | Fallidas: ${results.filter(r => !r.passed).length}`);
  console.log(`Resultado Global: ${allPassed ? '✅ APROBADO SATISFACTORIAMENTE' : '❌ HAY PRUEBAS FALLIDAS'}`);
  console.log('================================================================\n');

  if (!allPassed) process.exit(1);
}

runTests();
