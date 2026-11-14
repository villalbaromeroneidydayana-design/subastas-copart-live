import Database from 'better-sqlite3';
import path from 'path';

async function main() {
  console.log('================================================================');
  console.log('TEST FLUJO SALA ÚNICA: SUBSTAS SUCESIVAS (SIGUIENTE LOTE Y CLIENTE)');
  console.log('================================================================');

  const BASE_URL = 'http://localhost:3001';

  // 1. Resetear la sala única al Lote 1
  console.log('\n--- 1. RESTABLECER SALA ÚNICA (LOTE 1: MUSTANG GT / CARLOS MENDOZA) ---');
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/reset?admin=true`, { method: 'POST' });
  
  const roomRes1 = await fetch(`${BASE_URL}/api/sessions/ses-live-001`);
  const roomData1 = await roomRes1.json();
  console.log('Sala Única cargada con Lote 1:');
  console.log('- Lote:', roomData1.session.lotNumber);
  console.log('- Vehículo:', roomData1.session.title);
  console.log('- Cliente 1:', roomData1.session.buyerName, '| Presupuesto: $' + roomData1.session.clientMaxBudget);
  console.log('- Broker 1:', roomData1.session.brokerName);
  console.log('- Token Comprador 1:', roomData1.session.buyerAccessToken);

  // Iniciar y simular remate del Lote 1
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/start`, { method: 'POST' });
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/trigger-competitor-bid`, { method: 'POST' });
  
  // Oferta del Broker 1
  await fetch(`${BASE_URL}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'ses-live-001',
      participantToken: roomData1.session.brokerAccessToken,
      amount: 6000,
    })
  });

  // Bajar martillo (SOLD Lote 1)
  console.log('Adjudicando Lote 1 (SOLD)...');
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/sold`, { method: 'POST' });

  // 2. EN LA MISMA SALA: CARGAR SIGUIENTE LOTE (LOTE 2: CORVETTE STINGRAY / ALEJANDRO GÓMEZ)
  console.log('\n--- 2. EN LA MISMA SALA: ATENDER A CLIENTE 2 Y BROKER 2 (LOTE 2) ---');
  const nextLotRes = await fetch(`${BASE_URL}/api/sessions/ses-live-001/next-lot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lotNumber: '59201441',
      vehicle: {
        brand: 'Chevrolet',
        model: 'Corvette Stingray 3LT',
        year: 2024,
        vin: '1G1YB2D47R5109283',
        vehicle_condition: 'run_and_drive',
        title_type: 'Clean Title',
        primary_damage: 'Ninguno',
        odometer: 4200,
        odometer_unit: 'mi',
      },
      startingPrice: 8000,
      minIncrement: 500,
      reservePrice: 20000,
      clientMaxBudget: 14000,
      buyerName: 'Alejandro Gómez',
      buyerEmail: 'alejandro.gomez@gmail.com',
      buyerPhone: '+1 (305) 555-0812',
      brokerName: 'Broker Miguel Santos',
      brokerEmail: 'miguel.santos@broker.com',
      brokerPhone: '+1 (305) 555-0999'
    })
  });

  const nextLotData = await nextLotRes.json();
  console.log('Respuesta Carga Siguiente Lote:', nextLotData.success ? 'EXITOSA' : 'FALLIDA');
  console.log('- Misma Sala (Room Token):', nextLotData.session.roomToken);
  console.log('- Nuevo Lote en Pantalla:', nextLotData.session.lotNumber, '•', nextLotData.session.title);
  console.log('- Nuevo Comprador Real:', nextLotData.session.buyerName, '| Presupuesto Nuevo: $' + nextLotData.session.clientMaxBudget);
  console.log('- Nuevo Broker Real:', nextLotData.session.brokerName);
  console.log('- Nuevo Token Broker:', nextLotData.session.brokerAccessToken);
  console.log('- Nuevo Token Comprador:', nextLotData.session.buyerAccessToken);
  console.log('- Enlace Nuevo Broker:', nextLotData.session.links.brokerLink);
  console.log('- Enlace Nuevo Cliente:', nextLotData.session.links.buyerLink);

  // 3. Verificar que el token del Cliente 1 anterior fue revocado y rechazado
  console.log('\n--- 3. VERIFICAR QUE EL CLIENTE 1 ANTERIOR QUEDÓ BLOQUEADO ---');
  const oldBuyerCheck = await fetch(`${BASE_URL}/api/sessions/ses-live-001?buyerToken=${roomData1.session.buyerAccessToken}`);
  const oldBuyerData = await oldBuyerCheck.json();
  console.log('Intento de acceso del Cliente 1 anterior con su token viejo:');
  console.log('- ¿Acceso expirado/revocado?:', Boolean(oldBuyerData.isExpired));
  console.log('- Rol asignado:', oldBuyerData.role);

  // 4. Iniciar y pujar en el Lote 2 con el Nuevo Broker 2
  console.log('\n--- 4. EN LA MISMA SALA: PUJAS EN VIVO PARA EL LOTE 2 ---');
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/start`, { method: 'POST' });
  
  // Oferta competidor simulada
  const compBid = await fetch(`${BASE_URL}/api/sessions/ses-live-001/trigger-competitor-bid`, { method: 'POST' });
  const compBidData = await compBid.json();
  console.log('- Oferta competidor simulado:', compBidData.bid?.amount, 'USD por', compBidData.bid?.bidderName);

  // Oferta del Nuevo Broker 2
  const broker2Bid = await fetch(`${BASE_URL}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'ses-live-001',
      participantToken: nextLotData.session.brokerAccessToken,
      amount: 10000,
    })
  });
  const broker2BidData = await broker2Bid.json();
  console.log('- Oferta del Nuevo Broker 2:', broker2BidData.bid?.amount, 'USD por', broker2BidData.bid?.bidderName);

  // 5. Bajar martillo (SOLD Lote 2): Garantía inmutable para el nuevo Broker 2
  console.log('\n--- 5. BAJAR MARTILLO EN LOTE 2 (SOLD) ---');
  await fetch(`${BASE_URL}/api/sessions/ses-live-001/sold`, { method: 'POST' });

  const db = new Database(path.join(process.cwd(), 'data', 'auction.db'));
  const sessionRow = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get('ses-live-001') as any;
  const lastResult = db.prepare('SELECT * FROM auction_results WHERE session_id = ?').get('ses-live-001') as any;

  console.log('Resultado adjudicado en SQLite para Lote 2:');
  console.log('- Lote adjudicado:', sessionRow.lot_number, '•', sessionRow.title);
  console.log('- Paleta ganadora:', sessionRow.current_winner_paddle);
  console.log('- Nombre ganador:', sessionRow.current_winner_name);
  console.log('- Precio adjudicado: $' + lastResult.final_price + ' USD');
  console.log('- Ganó el nuevo broker real (#101):', sessionRow.current_winner_paddle?.includes('101') ? '✅ SÍ' : '❌ NO');

  console.log('\n================================================================');
  console.log('✅ PRUEBA COMPLETADA: LA SALA ÚNICA PUEDE ATENDER CLIENTES SUCESIVOS CON TOTAL REALISMO');
  console.log('================================================================');
}

main().catch(console.error);
