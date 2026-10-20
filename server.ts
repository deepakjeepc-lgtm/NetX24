import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Ensure public/ebooks directory exists and is served statically
const ebooksDir = path.join(process.cwd(), 'public', 'ebooks');
if (!fs.existsSync(ebooksDir)) {
  fs.mkdirSync(ebooksDir, { recursive: true });
}
app.use('/ebooks', express.static(ebooksDir));

// API Route: Upload eBook PDF from Admin Console
app.post('/api/upload-pdf', (req, res) => {
  try {
    const { fileName, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Missing PDF data' });
    }
    const cleanBase = String(fileName || 'ebook.pdf')
      .replace(/\.pdf$/i, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 60);
    const finalName = `${cleanBase}-${Date.now()}.pdf`;
    const rawBase64 = String(base64Data).replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(rawBase64, 'base64');
    fs.writeFileSync(path.join(ebooksDir, finalName), buffer);
    return res.json({
      url: `/ebooks/${finalName}`,
      fileName: fileName || finalName,
    });
  } catch (err: any) {
    console.error('PDF upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to save PDF' });
  }
});

let razorpayClient: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
    });
  }
  return razorpayClient;
}

// API Route: Create Razorpay Order
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!process.env.RAZORPAY_KEY_ID) {
      return res.json({
        id: 'order_mock_' + Date.now(),
        amount,
        currency,
        isMock: true,
      });
    }

    const options = {
      amount,
      currency,
      receipt: 'receipt_' + Date.now(),
    };

    const order = await getRazorpay().orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error('Razorpay error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
