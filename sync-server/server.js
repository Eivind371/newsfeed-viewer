const WebSocket = require('ws');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const wss = new WebSocket.Server({ port: PORT });
console.log(`Sync server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(message.toString());
      if (payload?.type === 'reload') {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'reload' }));
          }
        });
      }
    } catch (err) {
      // ignore invalid messages
    }
  });
});
