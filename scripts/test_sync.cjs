const WebSocket = require('ws');

async function testSync() {
  const ws = new WebSocket('wss://seat-fleece-dakota-textile.trycloudflare.com');
  
  ws.on('open', () => {
    console.log('WS Open! Subscribing to copart-live-m729k1...');
    ws.send(JSON.stringify({
      type: 'SUBSCRIBE',
      roomToken: 'copart-live-m729k1',
      role: 'spectator'
    }));
  });

  ws.on('message', (data) => {
    const parsed = JSON.parse(data.toString());
    console.log('RECEIVED WS EVENT:', parsed.type, parsed.currentPrice || '');
  });

  // Wait 2 seconds, then trigger a manual bid via HTTP
  setTimeout(async () => {
    console.log('Sending manual bid via HTTP to localhost:3001...');
    try {
      const res = await fetch('http://localhost:3001/api/sessions/ses-live-001/manual-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paddleNumber: 'Paleta #101',
          amount: 5250,
          customName: 'Richard',
          location: 'Miami, FL'
        })
      });
      const json = await res.json();
      console.log('HTTP response:', json.success, json.bid?.amount);
    } catch (e) {
      console.error('HTTP error:', e.message);
    }
  }, 2000);

  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 5000);
}

testSync();
