import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import multer from 'multer';
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

// Setup Multer for image and PDF uploads
const upload = multer({ storage: multer.memoryStorage() });

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

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

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
    const { amount, currency = "INR" } = req.body;
    
    // In test mode without real keys, just return a mock response if it fails
    if (!process.env.RAZORPAY_KEY_ID) {
      return res.json({
        id: "order_mock_" + Date.now(),
        amount: amount,
        currency: currency,
        isMock: true
      });
    }

    const options = {
      amount: amount, // amount in smallest currency unit
      currency,
      receipt: "receipt_" + Date.now(),
    };
    
    const order = await getRazorpay().orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error('Razorpay error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Route: Chat with AI (General / Thinking / High Thinking)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], isComplex = false } = req.body;
    
    // Choose model based on complexity request
    const model = isComplex ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash';
    
    const config: any = {
      systemInstruction: 'You are an AI assistant for LEKHIX. You help users understand our services, prices, and tools. Be polite, concise, and helpful. Do not make up prices. Prices: B/W Print 2/page, Color Print 10/page, Lamination 20/page, Internet Browsing 30/hr. Cafe is located locally, open 9 AM to 9 PM, Monday closed.',
      temperature: 0.7,
    };

    if (isComplex) {
       config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const chat = getAI().chats.create({
      model: model,
      config: config
    });

    // Send previous history
    for (const msg of history) {
      await chat.sendMessage({ message: msg.parts[0].text }); // Simplistic history repopulation for now, better to pass history to create
    }
    
    // Better way to do history:
    // Actually, we can just send the current message, but to keep history we should just use generateContent if we pass full history, or use chat.
    // For simplicity, we'll use generateContent with the full conversation history.
    
    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.parts
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await getAI().models.generateContent({
      model: model,
      contents: contents,
      config: config
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Route: Image Analysis
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { prompt = "What is this image about?" } = req.body;

    const response = await getAI().models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype
              }
            }
          ]
        }
      ]
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Route: Image Generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;

    const response = await getAI().models.generateImages({
      model: 'gemini-3.1-flash-image-preview',
      prompt: prompt,
      config: {
        aspectRatio: aspectRatio,
        outputMimeType: 'image/jpeg',
      }
    });

    const base64Image = response.generatedImages[0].image.imageBytes;
    res.json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (error: any) {
    console.error('Image generation error:', error);
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
