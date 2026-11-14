import Database from 'better-sqlite3';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const db = new Database(path.join(process.cwd(), 'data', 'auction.db'));

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, title: string, details?: any) {
  if (condition) {
    console.log(`  [✅ PASS] ${title}`);
    passCount++;
  } else {
    console.error(`  [❌ FAIL] ${title}`);
    if (details) console.error('  Details:', details);
    failCount++;
  }
}

async function runCompletePerfectionAudit() {
  console.log('========================================================================');
  console.log('AUDITORÍA DE PERFECCIÓN TOTAL: SALA ÚNICA CONTINUA COPART VB3');
  console.log('========================================================================\n');

  // --- FASE 1: SALUD DEL SERVIDOR Y RESETEO A LOTE BASE ---
  console.log('--- FASE 1: RESTABLECIMIENTO Y VERIFICACIÓN DE ESTADO INICIAL ---');
  const resetRes = await fetch(`${BASE_URL}/api/sessions/ses-live-001/reset?admin=true`, { method: 'POST' });
  const resetData = await resetRes.json();
  assert(resetData.success === true, '1.1 Reset administrativo de la sala ejecutado');

  const roomRes = await fetch(`${BASE_URL}/api/sessions/ses-live-001`);
  const roomData = await roomRes.json();
  assert(roomData.session?.status === 'prepared', '1.2 Sala en estado prepared');
  assert(roomData.session?.startingPrice === 5000, '1.3 Precio inicial restaurado a $5,000 USD');
  assert(roomData.session?.clientMaxBudget === 7500, '1.4 Presupuesto del cliente inicial fijado a $7,500 USD');
  assert(roomData.session?.brokerAccessToken === 'bdr_broker_m729k1', '1.5 Token broker base asignado');
  assert(roomData.session?.buyerAccessToken === 'bdr_buyer_m729k1', '1.6 Token comprador base asignado');

  // --- FASE 2: VERIFICACIÓN DE ROLES EN LA SALA ---
  console.log('\n--- FASE 2: DETECCIÓN Y PERMISOS DE ROLES (SUBASTADOR, BROKER, CLIENTE) ---');
  
  // Subastador
  const auctioneerCheck = await fetch(`${BASE_URL}/api/room/copart-live-m729k1?auctioneer=true`);
  const auctioneerData = await auctioneerCheck.json();
  assert(auctioneerData.role === 'auctioneer', '2.1 Rol Subastador Principal detectado');

  // Broker
  const brokerCheck = await fetch(`${BASE_URL}/api/room/copart-live-m729k1?broker=bdr_broker_m729k1`);
  const brokerData = await brokerCheck.json();
  assert(brokerData.role === 'broker', '2.2 Rol Broker Autorizado detectado');

  // Comprador
  const buyerCheck = await fetch(`${BASE_URL}/api/room/copart-live-m729k1?cliente=bdr_buyer_m729k1`);
  const buyerData = await buyerCheck.json();
  assert(buyerData.role === 'buyer', '2.3 Rol Comprador Real detectado');

  // --- FASE 3: PUJAS, RELOJ Y DISPARO DE COMPETIDORES FICTICIOS ---
  console.log('\n--- FASE 3: DINAMIZACIÓN CON COMPETIDORES Y PUJAS DEL BROKER REAL ---');
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/start`, { method: 'POST' });
  const startCheck = await fetch(`${BASE_URL}/api/sessions/ses-live-001`);
  const startData = await startCheck.json();
  assert(startData.session?.status === 'open', '3.1 Subasta abierta e iniciada');

  // Oferta competidor simulado 1
  const comp1 = await fetch(`${BASE_URL}/api/sessions/ses-live-001/trigger-competitor-bid`, { method: 'POST' });
  const comp1Data = await comp1.json();
  assert(comp1Data.success === true, '3.2 Oferta competidor 1 emitida', comp1Data);

  // Oferta broker real ($5,500)
  const brokerBid1 = await fetch(`${BASE_URL}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'ses-live-001',
      participantToken: 'bdr_broker_m729k1',
      amount: 5500
    })
  });
  const brokerBid1Data = await brokerBid1.json();
  assert(brokerBid1Data.success === true && brokerBid1Data.bid?.amount === 5500, '3.3 Oferta Broker Real de $5,500 USD aceptada');

  // Competidor simulado 2 ($5,750)
  const comp2 = await fetch(`${BASE_URL}/api/sessions/ses-live-001/trigger-competitor-bid`, { method: 'POST' });
  const comp2Data = await comp2.json();
  assert(comp2Data.success === true, '3.4 Oferta competidor 2 emitida');

  // Broker real sobrepuja a $6,000
  const brokerBid2 = await fetch(`${BASE_URL}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'ses-live-001',
      participantToken: 'bdr_broker_m729k1',
      amount: 6000
    })
  });
  const brokerBid2Data = await brokerBid2.json();
  assert(brokerBid2Data.success === true && brokerBid2Data.bid?.amount === 6000, '3.5 Broker Real toma el liderato con $6,000 USD');

  // --- FASE 4: GARANTÍA INMUTABLE DE ADJUDICACIÓN AL BROKER REAL ---
  console.log('\n--- FASE 4: ADJUDICACIÓN DEFINITIVA CON MARTILLO (SOLD) ---');
  const soldRes = await fetch(`${BASE_URL}/api/sessions/ses-live-001/sold`, { method: 'POST' });
  const soldData = await soldRes.json();
  assert(soldData.success === true, '4.1 Orden SOLD ejecutada');

  const sessionDb = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get('ses-live-001') as any;
  const resultDb = db.prepare('SELECT * FROM auction_results WHERE session_id = ?').get('ses-live-001') as any;

  assert(sessionDb.status === 'sold', '4.2 Estado de sesión en SQLite es sold');
  assert(sessionDb.current_winner_paddle === 'Paleta #101', '4.3 Ganador en sesión es Paleta #101 (Broker Real)');
  assert(resultDb.winner_paddle === 'Paleta #101', '4.4 Historial inmutable registra victoria de Paleta #101');
  assert(resultDb.final_price === 6000, '4.5 Precio final adjudicado es de $6,000 USD');

  // Comprobar que el acceso del cliente 1 quedó revocado
  const oldBuyerCheck = await fetch(`${BASE_URL}/api/room/copart-live-m729k1?cliente=bdr_buyer_m729k1`);
  assert(oldBuyerCheck.status === 403, '4.6 Reingreso del cliente 1 rechazado con HTTP 403');
  const oldBuyerErr = await oldBuyerCheck.json();
  assert(oldBuyerErr.isRevoked === true || oldBuyerErr.isExpired === true, '4.7 Mensaje de acceso revocado entregado');

  // --- FASE 5: DOCUMENTACIÓN INDEPENDIENTE DEL LOTE 1 ---
  console.log('\n--- FASE 5: ENTREGA DOCUMENTAL INDEPENDIENTE ---');
  const docCreateRes = await fetch(`${BASE_URL}/api/sessions/ses-live-001/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientName: 'Carlos Mendoza',
      clientEmail: 'carlos.mendoza@email.com',
      expiresInDays: 30
    })
  });
  const docCreateData = await docCreateRes.json();
  assert(docCreateData.success === true && Boolean(docCreateData.docToken), '5.1 Enlace documental generado');

  const docFetchRes = await fetch(`${BASE_URL}/api/documents/${docCreateData.docToken}`);
  const docFetchData = await docFetchRes.json();
  assert(docFetchData.success === true && docFetchData.auction?.finalPrice === 6000, '5.2 Documento consultable de forma independiente');

  // --- FASE 6: EN LA MISMA SALA, CARGAR SIGUIENTE LOTE (CLIENTE 2 / BROKER 2) ---
  console.log('\n--- FASE 6: CARGAR SIGUIENTE LOTE Y CLIENTE EN LA MISMA SALA (LANE A) ---');
  const nextLotRes = await fetch(`${BASE_URL}/api/sessions/ses-live-001/next-lot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lotNumber: '88192003',
      vehicle: {
        brand: 'Porsche',
        model: '911 Carrera 4S',
        year: 2024,
        vin: 'WP0AB2A98RS991203',
        vehicle_condition: 'run_and_drive',
        title_type: 'Clean Title',
        primary_damage: 'Ninguno',
        odometer: 1800,
        odometer_unit: 'mi',
      },
      startingPrice: 12000,
      minIncrement: 500,
      reservePrice: 25000,
      clientMaxBudget: 18000,
      buyerName: 'Roberto Valenzuela',
      buyerEmail: 'roberto.v@inversiones.com',
      buyerPhone: '+1 (786) 555-0391',
      brokerName: 'Broker Fernando Torres',
      brokerEmail: 'fernando.torres@broker.com',
      brokerPhone: '+1 (786) 555-0919'
    })
  });

  const nextLotData = await nextLotRes.json();
  assert(nextLotData.success === true, '6.1 Siguiente lote cargado exitosamente en la misma sala');
  assert(nextLotData.session?.lotNumber === '88192003', '6.2 Lote #88192003 en pantalla');
  assert(nextLotData.session?.buyerName === 'Roberto Valenzuela', '6.3 Nuevo comprador asignado');
  assert(nextLotData.session?.clientMaxBudget === 18000, '6.4 Nuevo presupuesto asignado: $18,000 USD');
  assert(nextLotData.session?.brokerName === 'Broker Fernando Torres', '6.5 Nuevo broker asignado');
  assert(Boolean(nextLotData.session?.brokerAccessToken), '6.6 Nuevo token único de broker generado');
  assert(Boolean(nextLotData.session?.buyerAccessToken), '6.7 Nuevo token único de comprador generado');

  const newBrokerToken = nextLotData.session.brokerAccessToken;
  const newBuyerToken = nextLotData.session.buyerAccessToken;

  // Verificar que el token viejo del Cliente 1 sigue bloqueado
  const oldBuyerCheck2 = await fetch(`${BASE_URL}/api/room/copart-live-m729k1?cliente=bdr_buyer_m729k1`);
  assert(oldBuyerCheck2.status === 403, '6.8 Cliente 1 antiguo bloqueado en el nuevo lote');

  // Verificar que el nuevo cliente 2 entra sin problemas
  const newBuyerCheck = await fetch(`${BASE_URL}/api/room/copart-live-m729k1?cliente=${newBuyerToken}`);
  const newBuyerData = await newBuyerCheck.json();
  assert(newBuyerCheck.status === 200 && newBuyerData.role === 'buyer', '6.9 Nuevo Cliente 2 entra como comprador a la misma sala');
  assert(newBuyerData.session?.lotNumber === '88192003', '6.10 Cliente 2 observa el nuevo Porsche 911');

  // Iniciar subasta del Lote 2 y realizar ofertas
  console.log('\n--- FASE 7: REMATE DEL NUEVO LOTE 2 Y ADJUDICACIÓN AL NUEVO BROKER ---');
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/start`, { method: 'POST' });

  // Competidor puja en Lote 2
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/trigger-competitor-bid`, { method: 'POST' });

  // Nuevo Broker 2 puja en Lote 2 ($14,000 USD)
  const broker2Bid = await fetch(`${BASE_URL}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'ses-live-001',
      participantToken: newBrokerToken,
      amount: 14000
    })
  });
  const broker2BidData = await broker2Bid.json();
  assert(broker2BidData.success === true && broker2BidData.bid?.amount === 14000, '7.1 Nuevo Broker 2 oferta $14,000 USD dentro de presupuesto');

  // Bajar martillo para Lote 2 (SOLD)
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/sold`, { method: 'POST' });
  const sessionDb2 = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get('ses-live-001') as any;
  assert(sessionDb2.current_winner_paddle === 'Paleta #101', '7.2 Nuevo Broker 2 (Paleta #101) gana el Lote 2');
  assert(sessionDb2.current_winner_name?.includes('Roberto Valenzuela'), '7.3 Lote 2 adjudicado a Roberto Valenzuela');

  console.log('\n========================================================================');
  console.log(`TOTAL PRUEBAS EJECUTADAS: ${passCount + failCount}`);
  console.log(`PRUEBAS APROBADAS: ${passCount}`);
  console.log(`PRUEBAS FALLIDAS: ${failCount}`);
  console.log(`RESULTADO FINAL: ${failCount === 0 ? '✅ 100% PERFECTO — TODOS LOS FLUJOS VERIFICADOS' : '❌ ERRORES DETECTADOS'}`);
  console.log('========================================================================');
}

runCompletePerfectionAudit().catch(console.error);
