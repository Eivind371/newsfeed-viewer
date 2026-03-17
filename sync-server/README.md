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

## Notes

- Works best when all clients are on the same machine/network and can reach `localhost:3001`.
- If you want to share across devices, you can run this server on a machine with a reachable IP and change the client URL accordingly.
