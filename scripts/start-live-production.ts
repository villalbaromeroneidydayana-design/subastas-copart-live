import { startTunnel } from 'untun';
import http from 'http';

const PORT = 3001;

async function checkServerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.clear();
  console.log('==============================================================================');
  console.log('🚀 PLATAFORMA DE SUBASTAS COPART VB3 LIVE — MODO TRANSMISIÓN EN VIVO');
  console.log('==============================================================================\n');

  // 1. Verificar si el backend ya está corriendo
  const isRunning = await checkServerRunning();
  if (!isRunning) {
    console.log('[1/2] Iniciando Servidor Backend Autorizado (Puerto 3001)...');
    // Importamos dinámicamente el servidor para que corra en el mismo proceso
    await import('../server/index.js').catch(async () => {
      await import('../server/index.ts');
    });
    // Esperar 1.5s para estabilización
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    console.log('[1/2] ✅ Servidor Backend ya está activo en http://localhost:3001');
  }

  // 2. Levantar el Túnel Seguro Cloudflare Edge (HTTPS y WSS)
  console.log('[2/2] Conectando túnel seguro de alta velocidad con Cloudflare Edge...');
  try {
    const tunnel = await startTunnel({ port: PORT });
    const tunnelUrl = await tunnel.getURL();

    console.clear();
    console.log('==============================================================================');
    console.log('✅ SUBASTA EN VIVO CONECTADA A INTERNET (HTTPS Y WSS LISTOS PARA CELULARES)');
    console.log('==============================================================================\n');

    console.log('💻 1. TU CONSOLA PRIVADA (Para operar tú en tu computadora):');
    console.log(`   🔗 ${tunnelUrl}/#/`);
    console.log(`   (O también de forma local: http://localhost:3001/#/)\n`);

    console.log('📱 2. ENLACE UNIVERSAL PARA CLIENTE Y BROKER (Toyota Camry SE - Lote #76061096):');
    console.log(`   🔗 ${tunnelUrl}/#/sala/copart-live-johan101`);
    console.log(`   (O en Vercel: https://subastas-copart-live.vercel.app/#/sala/copart-live-johan101?server=${tunnelUrl})\n`);

    console.log('------------------------------------------------------------------------------');
    console.log('📞 INSTRUCCIÓN RÁPIDA:');
    console.log('1. Envía el enlace (2) al Broker y el enlace (3) al Cliente por WhatsApp.');
    console.log('2. El Broker llama al Cliente por WhatsApp.');
    console.log('3. En tu pantalla (1), pulsa SUBASTAR y maneja a los competidores rivales.');
    console.log('------------------------------------------------------------------------------\n');
    console.log('[Listo] Servidor y túnel transmitiendo... No cierres esta ventana durante la subasta.');
  } catch (err) {
    console.error('❌ Error al iniciar el túnel:', err);
  }
}

main();
