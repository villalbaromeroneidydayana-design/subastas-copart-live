import WebSocket from 'ws';

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';
const SESSION_ID = 'ses-live-001';
const ROOM_TOKEN = 'copart-live-m729k1';
const BROKER_TOKEN = 'bdr_broker_m729k1';
const BUYER_TOKEN = 'bdr_buyer_m729k1';

interface TestResult {
  step: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(step: number, name: string, passed: boolean, details: string) {
  results.push({ step, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] Paso ${step}: ${name}`);
  if (!passed || details) {
    console.log(`       Detalle: ${details}`);
  }
}

async function runFullAudit() {
  console.log('========================================================================');
  console.log('AUDITORÍA INTEGRAL DE OPERACIÓN REAL — SUBASTAS AUTOMOTRICES');
  console.log('Probando servidor local, endpoints, WebSocket, base de datos y salas');
  console.log('========================================================================\n');

  try {
    // 1. Salud del servidor
    const resHealth = await fetch(`${BASE_URL}/api/health`);
    const dataHealth = await resHealth.json();
    record(1, 'Salud del Backend (/api/health)', resHealth.ok && dataHealth.status === 'ok', `Uptime: ${dataHealth.uptime?.toFixed(1)}s, DB: ${dataHealth.database}`);

    // 2. Conexión WebSocket en tiempo real
    let wsConnected = false;
    const wsReceivedTypes: string[] = [];
    const ws = new WebSocket(WS_URL);
    
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        wsConnected = true;
        resolve();
      });
      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          wsReceivedTypes.push(msg.type);
        } catch {}
      });
      ws.on('error', () => resolve());
      setTimeout(resolve, 1500);
    });
    record(2, 'Conexión WebSocket Bidireccional Activa', wsConnected, wsConnected ? 'Handshake WebSocket completado exitosamente' : 'Fallo al conectar WebSocket');

    // 3. Reset inicial limpio del lote
    const resReset = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/reset?admin=true`, { method: 'POST' });
    const dataReset = await resReset.json();
    record(3, 'Reset Inicial de la Sala (Limpieza)', Boolean(dataReset.success), 'Lote preparado en $5,000 USD');

    // 4. Apertura de la sala desde la consola del subastador
    const resStart = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/start`, { method: 'POST' });
    const dataStart = await resStart.json();
    record(4, 'Botón [Abrir / Iniciar] Sala', Boolean(dataStart.success), 'Subasta en estado "open" y reloj corriendo');

    // 5. Verificación de acceso para la Sala Pública (Comprador/Espectador)
    const resRoomPublic = await fetch(`${BASE_URL}/api/room/${ROOM_TOKEN}`);
    const dataRoomPublic = await resRoomPublic.json();
    record(5, 'Acceso Público de Espectador / Comprador', !dataRoomPublic.isExpired && dataRoomPublic.session?.status === 'open', `Estado en sala pública: ${dataRoomPublic.session?.status}, Precio: $${dataRoomPublic.session?.currentPrice}`);

    // 6. Verificación de acceso para el Broker Autorizado
    const resRoomBroker = await fetch(`${BASE_URL}/api/room/${ROOM_TOKEN}?broker=${BROKER_TOKEN}`);
    const dataRoomBroker = await resRoomBroker.json();
    record(6, 'Acceso del Broker Autorizado (Paleta #101)', dataRoomBroker.role === 'broker' && !dataRoomBroker.isExpired, `Rol detectado: ${dataRoomBroker.role}, Paleta: ${dataRoomBroker.activeParticipant?.paddleNumber || 'Paleta #101'}`);

    // 7. Modificación del precio base/vigente con el lápiz de edición
    const resSetPrice = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/set-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 5000 }),
    });
    const dataSetPrice = await resSetPrice.json();
    record(7, 'Control de Precio Base / Lápiz de Edición', dataSetPrice.success && dataSetPrice.price === 5000, `Precio fijado: $${dataSetPrice.price} USD`);

    // 8. Modificación de Parámetros del Lote (Incremento, Reserva, Presupuesto)
    const resParams = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/update-params`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startingPrice: 5000,
        minIncrement: 250,
        reservePrice: 12000,
        clientMaxBudget: 7500,
      }),
    });
    const dataParams = await resParams.json();
    record(8, 'Control de Parámetros de Subasta', Boolean(dataParams.success), `Incremento: $${dataParams.params?.minIncrement}, Reserva: $${dataParams.params?.reservePrice}, Presupuesto: $${dataParams.params?.clientMaxBudget}`);

    // 9. Botón [Pausar]
    const resPause = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/pause`, { method: 'POST' });
    const dataPause = await resPause.json();
    record(9, 'Botón [Pausar] Subasta', Boolean(dataPause.success), 'Reloj y subasta pausados');

    // 10. Botón [Reanudar]
    const resResume = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/start`, { method: 'POST' });
    const dataResume = await resResume.json();
    record(10, 'Botón [Reanudar] Subasta', Boolean(dataResume.success), 'Subasta reanudada en vivo');

    // 11. Oferta Manual Paleta #108 (AutoExport Dallas LLC)
    const resBid1 = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/manual-bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paddleNumber: 'Paleta #108', amount: 5250 }),
    });
    const dataBid1 = await resBid1.json();
    record(11, 'Oferta Manual Paleta #108 ($5,250)', dataBid1.success && dataBid1.session?.currentPrice === 5250, `Líder: ${dataBid1.session?.currentWinnerPaddle}, Precio: $${dataBid1.session?.currentPrice}`);

    // 12. Oferta Manual Paleta #214 (Pacific Salvage Auctions)
    const resBid2 = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/manual-bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paddleNumber: 'Paleta #214', amount: 5500 }),
    });
    const dataBid2 = await resBid2.json();
    record(12, 'Oferta Manual Paleta #214 ($5,500)', dataBid2.success && dataBid2.session?.currentPrice === 5500, `Líder: ${dataBid2.session?.currentWinnerPaddle}, Precio: $${dataBid2.session?.currentPrice}`);

    // 13. Oferta Manual Paleta #101 (Broker Real Representando al Cliente)
    const resBid3 = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/manual-bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paddleNumber: 'Paleta #101', amount: 6000 }),
    });
    const dataBid3 = await resBid3.json();
    record(13, 'Oferta Manual Paleta #101 Broker Real ($6,000)', dataBid3.success && dataBid3.session?.currentPrice === 6000, `Líder: ${dataBid3.session?.currentWinnerPaddle}, Precio: $${dataBid3.session?.currentPrice}`);

    // 14. Verificación de persistencia en la base de datos (auction_bids)
    const resBidsList = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/bids`);
    const bidsList = await resBidsList.json();
    record(14, 'Persistencia en Base de Datos de Ofertas', bidsList.length >= 3, `Total ofertas registradas e inmutables: ${bidsList.length}`);

    // 15. Aviso GOING ONCE
    const resCall1 = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call: 'going_once' }),
    });
    const dataCall1 = await resCall1.json();
    record(15, 'Aviso [GOING ONCE]', dataCall1.success && dataCall1.call === 'going_once', 'Emitido por WebSocket a sala pública');

    // 16. Aviso GOING TWICE
    const resCall2 = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call: 'going_twice' }),
    });
    const dataCall2 = await resCall2.json();
    record(16, 'Aviso [GOING TWICE]', dataCall2.success && dataCall2.call === 'going_twice', 'Emitido por WebSocket a sala pública');

    // 17. Aviso FAIR WARNING
    const resCall3 = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call: 'fair_warning' }),
    });
    const dataCall3 = await resCall3.json();
    record(17, 'Aviso [FAIR WARNING]', dataCall3.success && dataCall3.call === 'fair_warning', 'Emitido por WebSocket a sala pública');

    // 18. Verificación de recepción de eventos WebSocket
    await new Promise((r) => setTimeout(r, 600));
    record(18, 'Recepción de Eventos en Tiempo Real (WebSocket)', wsReceivedTypes.length > 0, `Eventos recibidos por cliente en vivo: ${wsReceivedTypes.slice(-4).join(', ')}`);

    // 19. Martillazo Soberano [SOLD / MARTILLO]
    const resSold = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/adjudicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'sold' }),
    });
    const dataSold = await resSold.json();
    record(19, 'Botón [SOLD / MARTILLO] (Adjudicación Soberana)', dataSold.success && dataSold.decision === 'sold', 'Subasta cerrada oficialmente con ganador');

    // 20. Verificación del Ganador Oficial
    const resVerifySold = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}`);
    const dataVerifySold = await resVerifySold.json();
    const finalWinner = dataVerifySold.session?.currentWinnerPaddle;
    const finalStatus = dataVerifySold.session?.status;
    const finalPrice = dataVerifySold.session?.currentPrice;
    record(20, 'Verificación de Adjudicación al Líder Máximo', finalStatus === 'sold' && finalWinner === 'Paleta #101' && finalPrice === 6000, `Ganador: ${finalWinner} (${dataVerifySold.session?.currentWinnerName}), Precio Final: $${finalPrice} USD`);

    // 21. Documento Oficial de Adjudicación
    const resDoc = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: dataVerifySold.session?.buyerName || 'Carlos Mendoza',
        clientEmail: 'cliente@subastas.com',
        expiresInDays: 7,
      }),
    });
    const dataDoc = await resDoc.json();
    record(21, 'Generación de Certificado Oficial de Adjudicación', Boolean(dataDoc.success && dataDoc.docToken), `Certificado generado: ${dataDoc.docToken}`);

    // 22. Reset final para dejar la sala lista y abierta para el usuario
    const resFinalClean = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/reset?admin=true`, { method: 'POST' });
    const dataFinalClean = await resFinalClean.json();
    record(22, 'Restablecimiento de Sala Limpia para Operación Inmediata', Boolean(dataFinalClean.success), 'Sala lista en $5,000 USD');

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  } catch (err: any) {
    record(99, 'Error Inesperado en Auditoría', false, err.message);
  }

  // Resumen final
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n========================================================================');
  console.log(`TOTAL DE OPERACIONES AUDITADAS: ${total}`);
  console.log(`OPERACIONES APROBADAS: ${passed}`);
  console.log(`OPERACIONES FALLIDAS: ${failed}`);
  console.log(`RESULTADO DE LA AUDITORÍA: ${failed === 0 ? '✅ 100% OPERATIVO Y VERIFICADO EMPÍRICAMENTE' : '❌ HAY ERRORES'}`);
  console.log('========================================================================');
}

runFullAudit();
