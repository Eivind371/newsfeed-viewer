# Newsfeed Viewer Sync Server

This small server provides a **WebSocket broadcast channel** so multiple open clients (e.g. on different screens/devices) can sync when one client triggers a refresh.

## How it works

- Clients connect to `ws://localhost:3001`.
- When a client presses **Load**, it sends a `{"type":"reload"}` message.
- The server broadcasts `{"type":"reload"}` to all connected clients.
- Each client then reloads the RSS feed.

## Run

```bash
cd sync-server
npm install
npm start
```

If you want other devices on the same network to connect, start the server bound to all interfaces and use the host machine's IP address in the client:

```bash
HOST=0.0.0.0 npm start
```

Then set the client sync URL to something like `ws://192.168.1.5:3001` (replace with your machine's IP).

## Notes

- Works best when all clients are on the same machine/network and can reach the sync server host.
- When running on the same machine as the client, `ws://localhost:3001` is fine.
- If you want to share across devices, ensure your firewall allows incoming connections on port 3001 and use the host machine's IP address.
