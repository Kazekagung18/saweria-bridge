import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';                 // 1) tambah import cors

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());                        // 2) aktifkan CORS untuk semua route
app.use(express.json());                // supaya bisa parse JSON

// simpan client overlay yang konek via WebSocket
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Overlay connected, total:', clients.size);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Overlay disconnected, total:', clients.size);
  });
});

// endpoint untuk webhook Saweria
app.post('/saweria-webhook', (req, res) => {
  const payload = req.body;
  console.log('Saweria webhook payload:', payload);

  const data = {
    type: 'saweria-donation',
    name: payload.name || payload.donator || 'Anonymous',
    amount: payload.amount || 0,
    currency: payload.currency || 'Rp',
    message: payload.message || ''
  };

  const json = JSON.stringify(data);
  for (const ws of clients) {
    ws.send(json);
  }

  res.status(200).json({ ok: true });
});

app.get('/', (req, res) => {
  res.send('Saweria bridge is running');
});

server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
