import { startTunnel } from 'untun';

async function runCloudflareTunnel() {
  console.log('[Tunnel Monitor] Levantando túnel HTTPS/WSS con Cloudflare Edge...');
  try {
    const tunnel = await startTunnel({ port: 3001 });
    const url = await tunnel.getURL();
    console.log(`[Tunnel Monitor] ✅ TÚNEL CLOUDFLARE ACTIVO: ${url}`);
  } catch (err) {
    console.error('[Tunnel Monitor] Error al iniciar túnel:', err);
    setTimeout(runCloudflareTunnel, 5000);
  }
}

runCloudflareTunnel();

