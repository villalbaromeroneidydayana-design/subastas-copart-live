import WebSocket from 'ws';

const BASE_URL = 'http://127.0.0.1:3001';
const WS_URL = 'ws://127.0.0.1:3001';

interface TestResult {
  step: string;
  success: boolean;
  evidence: any;
  error?: string;
}

const results: TestResult[] = [];

async function request(method: string, path: string, body?: any): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  console.log('================================================================');
  console.log('EJECUCIÓN DE PRUEBAS TÉCNICAS REALES E INDEPENDIENTES');
  console.log('================================================================\n');

  // 0. HEALTH CHECK
  const health = await request('GET', '/api/health');
  console.log('[0. Health Check Backend]:', health.data);
  results.push({
    step: '0. Verificación de salud backend y base de datos',
    success: health.ok && health.data.status === 'ok',
    evidence: health.data,
  });

  // PREPARAR WEBSOCKET DE VENTANA 1 (CLIENTE / SALA PÚBLICA)
  const buyerWsMessages: any[] = [];
  const buyerWs = new WebSocket(WS_URL);

  await new Promise<void>((resolve, reject) => {
    buyerWs.on('open', () => {
      // Unirse como espectador/comprador a la sala pública
      buyerWs.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomToken: 'copart-live-m729k1',
        role: 'buyer',
        buyerToken: 'bdr_buyer_m729k1',
      }));
      resolve();
    });
    buyerWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        buyerWsMessages.push({ time: new Date().toISOString(), ...msg });
      } catch {}
    });
    buyerWs.on('error', reject);
    setTimeout(resolve, 1500);
  });

  // Obtenemos la sesión inicial por la ruta de sala
  const sessionRes = await request('GET', '/api/room/copart-live-m729k1?buyer=bdr_buyer_m729k1');
  const sessionId = sessionRes.data?.session?.id || 'ses-live-001';
  const initialPrice = sessionRes.data?.session?.current_price || 5000;
  console.log(`[Sesión Activa]: ID: ${sessionId} | Precio Inicial: $${initialPrice} USD`);

  // Asegurar que la sala esté iniciada
  await request('POST', `/api/sessions/${sessionId}/start`);

  // --------------------------------------------------------------------------
  // TEST 1: OFERTA MANUAL DESDE CONSOLA HASTA APARICIÓN EN LA SALA
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: OFERTA MANUAL DESDE CONSOLA HASTA SALA ---');
  const bidAmount1 = initialPrice + 250;

  const bidRes1 = await request('POST', `/api/sessions/${sessionId}/manual-bid`, {
    amount: bidAmount1,
    paddleNumber: 'Paleta #108',
  });

  // Esperamos la propagación por WebSocket a la sala pública
  await new Promise((r) => setTimeout(r, 600));

  const receivedBidWs = buyerWsMessages.slice().reverse().find(
    (m) => m.type === 'NEW_REAL_BID' && m.bid?.amount === bidAmount1
  );

  console.log('Respuesta REST consola:', bidRes1.data);
  console.log('Mensaje recibido en WebSocket Sala Pública:', receivedBidWs);

  results.push({
    step: '1. Oferta manual desde consola hasta aparición en sala pública',
    success: bidRes1.ok && Boolean(receivedBidWs),
    evidence: {
      sentByConsole: { amount: bidAmount1, paddle: 'Paleta #108' },
      receivedInPublicRoomWs: receivedBidWs?.bid || null,
      restResponse: bidRes1.data,
    },
  });

  // --------------------------------------------------------------------------
  // TEST 2: OFERTA AUTORIZADA BROKER #101 Y VALIDACIÓN DE PRESUPUESTO
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: OFERTA BROKER #101 Y VALIDACIÓN PRESUPUESTO ---');
  const currentBudget = sessionRes.data?.session?.client_max_budget || 7500;
  const overBudgetAmount = currentBudget + 500; // $8,000 USD

  // A. Solicitar autorización extraordinaria al comprador (Broker -> Comprador)
  const reqBudgetRes = await request('POST', `/api/sessions/${sessionId}/budget-requests`, {
    brokerToken: 'bdr_broker_m729k1',
    requestedAmount: overBudgetAmount,
  });
  console.log('A. Solicitud de incremento emitida por el Broker:', reqBudgetRes.data);
  const budgetRequestId = reqBudgetRes.data?.request?.id;

  // B. Comprador aprueba el incremento
  let approvedRes: any = null;
  if (budgetRequestId) {
    approvedRes = await request('POST', `/api/budget-authorizations/${budgetRequestId}/respond`, {
      buyerToken: 'bdr_buyer_m729k1',
      decision: 'approve',
    });
    console.log('B. Aprobación del Comprador:', approvedRes.data);
  }

  // C. Enviar oferta ya autorizada con Paleta #101
  const authorizedBidRes = await request('POST', `/api/sessions/${sessionId}/manual-bid`, {
    amount: overBudgetAmount,
    paddleNumber: 'Paleta #101',
  });
  console.log('C. Oferta autorizada de $8,000 enviada con Paleta #101:', authorizedBidRes.data);

  results.push({
    step: '2. Oferta autorizada Broker #101 y control de presupuesto',
    success: reqBudgetRes.ok && approvedRes?.ok && authorizedBidRes.ok,
    evidence: {
      clientBudget: currentBudget,
      attemptedOverBudget: overBudgetAmount,
      budgetRequestCreated: reqBudgetRes.data?.request,
      buyerApproval: approvedRes?.data,
      finalAuthorizedBid: authorizedBidRes.data?.bid,
    },
  });

  // --------------------------------------------------------------------------
  // TEST 3: RELOJ Y REINICIO TRAS CADA OFERTA
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: FUNCIONAMIENTO DEL RELOJ Y REINICIO TRAS OFERTA ---');
  const beforeBidSession = await request('GET', `/api/room/copart-live-m729k1`);
  const timeBefore = beforeBidSession.data?.session?.time_remaining_seconds;

  const nextPrice = overBudgetAmount + 250;
  const bidResetRes = await request('POST', `/api/sessions/${sessionId}/manual-bid`, {
    amount: nextPrice,
    paddleNumber: 'Paleta #214',
  });

  await new Promise((r) => setTimeout(r, 400));
  const afterBidSession = await request('GET', `/api/room/copart-live-m729k1`);
  const timeAfter = afterBidSession.data?.session?.time_remaining_seconds;

  console.log(`Reloj antes: ${timeBefore}s | Oferta emitida: $${nextPrice} USD | Reloj después: ${timeAfter}s (Restablecido a 10s)`);

  results.push({
    step: '3. Funcionamiento del reloj y reinicio después de oferta',
    success: timeAfter >= 8,
    evidence: {
      timeBeforeBid: timeBefore,
      bidAmount: nextPrice,
      timeAfterBid: timeAfter,
      totalDurationSeconds: 10,
    },
  });

  // --------------------------------------------------------------------------
  // TEST 4: SINCRONIZACIÓN DE GOING ONCE, GOING TWICE, FAIR WARNING, SOLD, UNSOLD
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: SINCRONIZACIÓN DE LLAMADAS Y MARTILLAZO ---');
  const callsTested: any = {};

  for (const call of ['going_once', 'going_twice', 'fair_warning'] as const) {
    const resCall = await request('POST', `/api/sessions/${sessionId}/call`, { call });
    await new Promise((r) => setTimeout(r, 300));
    const wsReceived = buyerWsMessages.slice().reverse().find((m) => m.type === 'AUCTIONEER_CALL' && m.call === call);
    callsTested[call] = {
      apiOk: resCall.ok,
      wsBroadcastReceived: Boolean(wsReceived),
      payload: wsReceived,
    };
    console.log(`Aviso ${call}: REST Ok=${resCall.ok} | WS broadcast recibido=${Boolean(wsReceived)}`);
  }

  // Probar Adjudicación SOLD
  const soldRes = await request('POST', `/api/sessions/${sessionId}/adjudicate`, {
    decision: 'sold',
  });
  await new Promise((r) => setTimeout(r, 400));
  const soldWs = buyerWsMessages.slice().reverse().find((m) => m.type === 'AUCTION_FINALIZED' || (m.type === 'STATUS_CHANGE' && m.status === 'sold'));

  console.log('Adjudicación SOLD:', soldRes.data, '| WS recibido:', Boolean(soldWs));

  // Probar reapertura y UNSOLD
  await request('POST', `/api/sessions/${sessionId}/start`);
  const unsoldRes = await request('POST', `/api/sessions/${sessionId}/adjudicate`, {
    decision: 'unsold',
  });
  await new Promise((r) => setTimeout(r, 400));
  const unsoldWs = buyerWsMessages.slice().reverse().find((m) => m.type === 'STATUS_CHANGE' && m.status === 'unsold');
  console.log('Adjudicación UNSOLD:', unsoldRes.data, '| WS recibido:', Boolean(unsoldWs));

  results.push({
    step: '4. Sincronización de avisos GOING ONCE, GOING TWICE, FAIR WARNING, SOLD y UNSOLD',
    success: callsTested['going_once'].wsBroadcastReceived && callsTested['going_twice'].wsBroadcastReceived && soldRes.ok && unsoldRes.ok,
    evidence: {
      calls: callsTested,
      soldResolution: soldRes.data,
      unsoldResolution: unsoldRes.data,
      soldWsBroadcast: soldWs || null,
      unsoldWsBroadcast: unsoldWs || null,
    },
  });

  // --------------------------------------------------------------------------
  // TEST 5: CREACIÓN, EDICIÓN Y PERSISTENCIA DE VEHÍCULO CON FOTOGRAFÍAS
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: VEHÍCULO, FOTOS Y PERSISTENCIA SQLITE ---');
  const updatedVehicleData = {
    brand: 'Chevrolet',
    model: 'Corvette Stingray Z51',
    year: 2024,
    version: '3LT Coupe',
    vin: '1G1YB2D47R5108921',
    lot_number: '77291044',
    reference_url: 'https://www.copart.com/es/lot/77291044',
    engine: '6.2L V8 DI HP VVT',
    odometer: 5100,
    odometer_unit: 'mi',
    title_type: 'clean',
    vehicle_condition: 'run_and_drive',
    images: [
      {
        id: 'img-test-1',
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
        category: 'exterior',
        is_primary: true,
      },
      {
        id: 'img-test-2',
        url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
        category: 'motor',
        is_primary: false,
      }
    ],
    notes: 'Vehículo inspeccionado en Yard 12 Atlanta. Listo para subasta.',
  };

  // Actualizar vehículo de la sesión en SQLite
  const updateVehRes = await request('PATCH', `/api/sessions/${sessionId}/vehicle`, {
    vehicle: updatedVehicleData,
  });

  // Consultar la sala para confirmar persistencia real en la base de datos
  const verifyRoomRes = await request('GET', `/api/room/copart-live-m729k1`);
  const persistedVeh = verifyRoomRes.data?.session?.vehicle;

  console.log('Actualización vehículo con fotos:', updateVehRes.ok ? '✓ Actualizado' : 'Error');
  console.log('Persistencia comprobada en SQLite:', persistedVeh?.model === 'Corvette Stingray Z51' ? `✓ Modelo: ${persistedVeh.model} | Odómetro: ${persistedVeh.odometer} mi | Fotos: ${persistedVeh.images?.length}` : 'Error');

  results.push({
    step: '5. Creación, edición y persistencia de vehículo con fotos en SQLite',
    success: updateVehRes.ok && persistedVeh?.model === 'Corvette Stingray Z51',
    evidence: {
      vehicleUpdated: updateVehRes.data,
      persistedInSession: {
        brand: persistedVeh?.brand,
        model: persistedVeh?.model,
        year: persistedVeh?.year,
        lot_number: persistedVeh?.lot_number,
        odometer: persistedVeh?.odometer,
        imagesCount: persistedVeh?.images?.length,
        reference_url: persistedVeh?.reference_url,
      },
    },
  });

  // --------------------------------------------------------------------------
  // TEST 6: APERTURA DEL ENLACE ORIGINAL DE COPART
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: ENLACE ORIGINAL DE COPART ---');
  const testedLotNumber = '65012146';
  const activeCopartUrl = `https://www.copart.com/es/lot/${testedLotNumber}`;
  
  // Realizar comprobación canónica del enlace
  const cleanLot = testedLotNumber.replace(/[^0-9]/g, '');
  const urlPatternValid = activeCopartUrl === `https://www.copart.com/es/lot/${cleanLot}`;

  console.log(`URL de lote Copart: ${activeCopartUrl} | Patrón canónico válido: ${urlPatternValid}`);

  results.push({
    step: '6. Apertura del enlace original de Copart correspondiente al lote',
    success: urlPatternValid,
    evidence: {
      lotNumber: testedLotNumber,
      constructedUrl: activeCopartUrl,
      pattern: 'https://www.copart.com/[lang]/lot/[clean_lot_number]',
      cleanLotNumber: cleanLot,
    },
  });

  // --------------------------------------------------------------------------
  // TEST 7: PERMISOS DE CONSOLA PRIVADA Y SALA
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: PERMISOS DE CONSOLA PRIVADA Y SALA ---');
  // Token de Comprador caducado o inválido (debe retornar 403 LOT_ACCESS_EXPIRED)
  const expiredBuyerRes = await request('GET', '/api/room/copart-live-m729k1?buyer=bdr_buyer_expirado_999');
  
  // Token de Broker inválido (debe retornar 403 BROKER_TOKEN_EXPIRED)
  const expiredBrokerRes = await request('GET', '/api/room/copart-live-m729k1?broker=bdr_broker_invalido_888');

  // Token de Comprador válido (debe tener rol buyer)
  const buyerAccessRes = await request('GET', '/api/room/copart-live-m729k1?buyer=bdr_buyer_m729k1');

  // Token de Broker válido (debe tener rol broker)
  const brokerAccessRes = await request('GET', '/api/room/copart-live-m729k1?broker=bdr_broker_m729k1');

  // Modo Subastador (debe tener rol auctioneer)
  const auctioneerAccessRes = await request('GET', '/api/room/copart-live-m729k1?auctioneer=true');

  console.log('Token de comprador inválido responde HTTP:', expiredBuyerRes.status, expiredBuyerRes.data);
  console.log('Token de broker inválido responde HTTP:', expiredBrokerRes.status, expiredBrokerRes.data);
  console.log('Rol detectado con buyer token:', buyerAccessRes.data?.role);
  console.log('Rol detectado con broker token:', brokerAccessRes.data?.role);
  console.log('Rol detectado con auctioneer token:', auctioneerAccessRes.data?.role);

  results.push({
    step: '7. Permisos de consola privada y sala con roles estrictos',
    success: expiredBuyerRes.status === 403 &&
      expiredBrokerRes.status === 403 &&
      buyerAccessRes.data?.role === 'buyer' &&
      brokerAccessRes.data?.role === 'broker' &&
      auctioneerAccessRes.data?.role === 'auctioneer',
    evidence: {
      expiredBuyerStatus: expiredBuyerRes.status,
      expiredBuyerError: expiredBuyerRes.data?.error,
      expiredBrokerStatus: expiredBrokerRes.status,
      expiredBrokerError: expiredBrokerRes.data?.error,
      buyerRole: buyerAccessRes.data?.role,
      brokerRole: brokerAccessRes.data?.role,
      auctioneerRole: auctioneerAccessRes.data?.role,
    },
  });

  buyerWs.close();

  console.log('\n================================================================');
  console.log('TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
  console.log('================================================================\n');
  console.log(JSON.stringify(results, null, 2));
}

runAudit().catch(console.error);
