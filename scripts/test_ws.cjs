const WebSocket = require('ws');

async function test(url) {
  return new Promise((resolve) => {
    console.log('Testing:', url);
    const ws = new WebSocket(url);
    ws.on('open', () => {
      console.log('OPEN:', url);
      ws.close();
      resolve(true);
    });
    ws.on('error', (err) => {
      console.log('ERROR:', url, err.message);
      resolve(false);
    });
  });
}

async function run() {
  await test('ws://localhost:3001');
  await test('wss://seat-fleece-dakota-textile.trycloudflare.com');
}

run();
