import Database from 'better-sqlite3';
import path from 'path';

async function main() {
  console.log('--- TEST CREACIÓN DE SUBASTA CON BROKER Y CLIENTE REAL ---');
  
  const createRes = await fetch('http://localhost:3001/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lotNumber: '77294100',
      vehicle: {
        brand: 'Porsche',
        model: '911 Carrera S',
        year: 2024,
        vin: 'WP0AB2A98RS123456',
        vehicle_condition: 'run_and_drive',
        title_type: 'Clean Title',
        primary_damage: 'Ninguno',
        odometer: 3100,
        odometer_unit: 'mi',
      },
      startingPrice: 15000,
      minIncrement: 500,
      reservePrice: 35000,
      clientMaxBudget: 28000,
      buyerName: 'Javier Morales',
      buyerEmail: 'javier.morales@vip.com',
      buyerPhone: '+1 (786) 555-0144',
      brokerName: 'Broker Fernando Torres',
      brokerEmail: 'fernando.torres@broker.com',
      brokerPhone: '+1 (786) 555-0922'
    })
  });

  const createData = await createRes.json();
  const sessionId = createData.session.id;
  console.log('Subasta creada con éxito:');
  console.log('- Session ID:', sessionId);
  console.log('- Room Token:', createData.session.roomToken);
  console.log('- Broker Token:', createData.session.brokerAccessToken);
  console.log('- Buyer Token:', createData.session.buyerAccessToken);
  console.log('- Enlaces generados:', createData.session.links);

  // 1. Iniciar subasta
  console.log('\n--- 1. INICIAR SUBASTA ---');
  await fetch(`http://localhost:3001/api/sessions/${sessionId}/start`, { method: 'POST' });

  // 2. Disparar ofertas competidoras ficticias
  console.log('\n--- 2. OFERTAS COMPETIDORAS SIMULADAS ---');
  for (let i = 0; i < 3; i++) {
    const compRes = await fetch(`http://localhost:3001/api/sessions/${sessionId}/trigger-competitor-bid`, { method: 'POST' });
    const compData = await compRes.json();
    console.log(`- Oferta competidor ${i + 1}:`, compData.bid?.amount, 'USD por', compData.bid?.bidderName, `(${compData.bid?.paddleNumber})`);
  }

  // 3. Oferta del Broker Real
  console.log('\n--- 3. OFERTA DEL BROKER REAL (PALETA #101) ---');
  const brokerBidRes = await fetch('http://localhost:3001/api/bids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      participantToken: createData.session.brokerAccessToken,
      amount: 18000,
    })
  });
  const brokerBidData = await brokerBidRes.json();
  console.log('Oferta broker real:', brokerBidData.bid?.amount, 'USD - Ganador provisional:', brokerBidData.bid?.bidderName);

  // 4. Bajar martillo (SOLD): Garantía inmutable de adjudicación
  console.log('\n--- 4. BAJAR MARTILLO (SOLD) ---');
  const soldRes = await fetch(`http://localhost:3001/api/sessions/${sessionId}/sold`, { method: 'POST' });
  const soldData = await soldRes.json();
  console.log('Respuesta SOLD:', soldData);

  // Consultar en la base de datos authoritative
  const db = new Database(path.join(process.cwd(), 'data', 'auction.db'));
  const sessionRow = db.prepare('SELECT * FROM auction_sessions WHERE id = ?').get(sessionId) as any;
  const resultRow = db.prepare('SELECT * FROM auction_results WHERE session_id = ?').get(sessionId) as any;

  console.log('\n--- 5. VERIFICACIÓN DE ADJUDICACIÓN EN SQLITE ---');
  console.log('- Estado de la sesión:', sessionRow.status);
  console.log('- Paleta Ganadora en Sesión:', sessionRow.current_winner_paddle);
  console.log('- Nombre Ganador en Sesión:', sessionRow.current_winner_name);
  console.log('- Paleta Ganadora en Resultados Históricos:', resultRow.winner_paddle);
  console.log('- Nombre Ganador en Resultados Históricos:', resultRow.winner_name);
  console.log('- Precio Final de Adjudicación: $' + resultRow.final_price + ' USD');
  console.log('- Acceso de sala revocado:', Boolean(sessionRow.is_token_revoked));

  const wonByRealBroker = sessionRow.current_winner_paddle?.includes('101') && resultRow.winner_paddle?.includes('101');
  console.log('\n¿GARANTÍA DE VICTORIA PARA EL BROKER REAL CUMPLIDA?:', wonByRealBroker ? '✅ SÍ (100% VERIFICADO)' : '❌ NO');

  // 6. Listado general
  console.log('\n--- 6. LISTADO GENERAL DE SUBASTAS EN SQLITE ---');
  const listRes = await fetch('http://localhost:3001/api/sessions');
  const list = await listRes.json();
  console.log('Total subastas activas registradas:', list.length);
  list.forEach((s: any) => {
    console.log(`* Lote #${s.lotNumber} | ${s.title} | Cliente: ${s.buyerName} ($${s.clientMaxBudget?.toLocaleString()} USD) | Broker: ${s.brokerName} | Estado: ${s.status}`);
  });
}

main().catch(console.error);
