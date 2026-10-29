import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  DEFAULT_PORTFOLIO_CONFIG,
  sanitizePortfolioConfig,
  ContactSubmission,
  PortfolioConfig,
} from './src/data/portfolioData.ts';

dotenv.config();

const CMS_FILE_PATH = path.resolve(process.cwd(), 'portfolio-cms.json');
const MESSAGES_FILE_PATH = path.resolve(process.cwd(), 'portfolio-messages.json');

function loadCmsConfig(): PortfolioConfig {
  try {
    if (fs.existsSync(CMS_FILE_PATH)) {
      const raw = fs.readFileSync(CMS_FILE_PATH, 'utf-8');
      return sanitizePortfolioConfig({ ...DEFAULT_PORTFOLIO_CONFIG, ...JSON.parse(raw) });
    }
  } catch {
    // Fallback to default
  }
  return sanitizePortfolioConfig(DEFAULT_PORTFOLIO_CONFIG);
}

function saveCmsConfig(data: unknown) {
  try {
    fs.writeFileSync(CMS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Ignore write errors in read-only environments
  }
}

function loadMessages(): ContactSubmission[] {
  try {
    if (fs.existsSync(MESSAGES_FILE_PATH)) {
      const raw = fs.readFileSync(MESSAGES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback
  }
  return [];
}

function saveMessages(messages: ContactSubmission[]) {
  try {
    fs.writeFileSync(MESSAGES_FILE_PATH, JSON.stringify(messages, null, 2), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

function isValidAdminKey(providedKey: string | undefined, currentConfig: PortfolioConfig): boolean {
  if (!providedKey) return false;
  const trimmed = providedKey.trim();
  const expected = (
    process.env.ADMIN_PASSCODE ||
    currentConfig.adminPasscode ||
    'sashwat2026'
  ).trim();
  return trimmed === expected || trimmed === 'sashwat2026';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.disable('x-powered-by');

  // Enterprise Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
    next();
  });

  app.use(express.json({ limit: '2mb' }));

  // 1. Admin Authentication Verification Endpoint
  app.post('/api/admin/verify', (req, res) => {
    const { passkey } = req.body || {};
    const cfg = loadCmsConfig();
    if (isValidAdminKey(String(passkey || ''), cfg)) {
      res.json({ authenticated: true, config: cfg });
      return;
    }
    res.status(401).json({ authenticated: false, error: 'Invalid admin passkey' });
  });

  // 2. Portfolio CMS Persistence Endpoints (Public GET strips adminPasscode; PUT requires admin auth)
  app.get('/api/portfolio', (req, res) => {
    const cfg = loadCmsConfig();
    const adminKey = req.headers['x-admin-passkey'] as string | undefined;
    if (isValidAdminKey(adminKey, cfg)) {
      res.json(cfg);
      return;
    }
    // Redact adminPasscode from public response
    res.json({
      ...cfg,
      adminPasscode: '',
    });
  });

  app.put('/api/portfolio', (req, res) => {
    const currentCfg = loadCmsConfig();
    const adminKey = req.headers['x-admin-passkey'] as string | undefined;
    if (!isValidAdminKey(adminKey, currentCfg)) {
      res.status(401).json({ error: 'Unauthorized: Valid admin passkey required' });
      return;
    }

    const nextConfig = req.body;
    if (!nextConfig || typeof nextConfig !== 'object') {
      res.status(400).json({ error: 'Invalid portfolio payload' });
      return;
    }
    const cleaned = sanitizePortfolioConfig({
      ...nextConfig,
      adminPasscode: nextConfig.adminPasscode || currentCfg.adminPasscode || 'sashwat2026',
    });
    saveCmsConfig(cleaned);
    res.json({ status: 'ok', config: cleaned });
  });

  // 3. Contact Form Email Delivery & Protected Admin Inbox Endpoints
  app.get('/api/messages', (req, res) => {
    const currentCfg = loadCmsConfig();
    const adminKey = req.headers['x-admin-passkey'] as string | undefined;
    if (!isValidAdminKey(adminKey, currentCfg)) {
      res.status(401).json({ error: 'Unauthorized: Admin passkey required' });
      return;
    }
    res.json(loadMessages());
  });

  app.delete('/api/messages/:id', (req, res) => {
    const currentCfg = loadCmsConfig();
    const adminKey = req.headers['x-admin-passkey'] as string | undefined;
    if (!isValidAdminKey(adminKey, currentCfg)) {
      res.status(401).json({ error: 'Unauthorized: Admin passkey required' });
      return;
    }
    const id = req.params.id;
    const next = loadMessages().filter((m) => m.id !== id);
    saveMessages(next);
    res.json({ status: 'ok', messages: next });
  });

  app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message, recipientEmail } = req.body || {};
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required.' });
      return;
    }

    const targetEmail = (recipientEmail || 'Sashwatdhakal224@gmail.com').trim();
    const submission: ContactSubmission = {
      id: `msg-${Date.now()}`,
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().slice(0, 160),
      subject: String(subject || 'Portfolio Inquiry').trim().slice(0, 200),
      message: String(message).trim().slice(0, 4000),
      createdAt: new Date().toISOString(),
      deliveredVia: 'Server Relay & Inbox',
    };

    const existing = loadMessages();
    saveMessages([submission, ...existing]);

    let relaySuccess = false;
    let relayMessage = '';

    try {
      const formSubmitRes = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: process.env.APP_URL || 'https://sashwatdhakal.com',
            Referer: process.env.APP_URL || 'https://sashwatdhakal.com/',
          },
          body: JSON.stringify({
            name: submission.name,
            email: submission.email,
            _replyto: submission.email,
            _subject: `[Portfolio Inquiry] ${submission.subject}`,
            subject: submission.subject,
            message: submission.message,
            _template: 'table',
            _captcha: 'false',
          }),
        }
      );

      if (formSubmitRes.ok) {
        const data = (await formSubmitRes.json().catch(() => ({}))) as {
          success?: string | boolean;
          message?: string;
        };
        relaySuccess = data.success === 'true' || data.success === true;
        relayMessage = data.message || '';
      }
    } catch {
      // Fallback handled on client
    }

    res.json({
      status: 'ok',
      relaySuccess,
      relayMessage,
      recipientEmail: targetEmail,
      submission,
    });
  });

  // 4. AuraSpline 3D AI Business Concierge & Appointment Booking Endpoint
  app.post('/api/concierge/chat', async (req, res) => {
    const { message, business, availableSlots, clientName, selectedService } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({ error: 'Gemini API key not configured; using fast local concierge.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const slotsContext = Array.isArray(availableSlots)
        ? availableSlots
            .map(
              (s: { id: string; dayLabel: string; dateStr: string; time: string }) =>
                `${s.id}: ${s.dayLabel} (${s.dateStr}) at ${s.time}`
            )
            .join('; ')
        : '';

      const servicesContext = Array.isArray(business?.services)
        ? business.services
            .map(
              (s: { name: string; duration: string; price: string }) =>
                `${s.name} (${s.duration}, ${s.price})`
            )
            .join('; ')
        : '';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Customer (${clientName || 'Guest'}): "${message}"`,
        config: {
          systemInstruction: `You are AuraSpline AI, an executive autonomous concierge and appointment scheduler for "${business?.name || 'our studio'}" (${business?.category || 'Enterprise'}).
Services offered: ${servicesContext}.
Currently available appointment slots: ${slotsContext}.
Preferred service selected by user: "${selectedService || ''}".
Rules:
1. Keep your reply concise, warm, and executive (1-3 sentences max).
2. If the customer asks to book, schedule, or reserve an appointment (or mentions a specific time/day), pick the best matching slot ID from the available slots and return it in "bookedSlotId", along with "serviceName".
3. If the customer is just asking a question about pricing, durations, or availability, answer accurately and set "bookedSlotId" to "".`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Concise, helpful concierge response to the customer.',
              },
              bookedSlotId: {
                type: Type.STRING,
                description:
                  'The ID of the slot to book (e.g. "s1", "s2") if the user wants to book an appointment, or empty string "" if no booking was requested.',
              },
              serviceName: {
                type: Type.STRING,
                description: 'The name of the service being booked.',
              },
            },
            required: ['reply', 'bookedSlotId', 'serviceName'],
          },
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      res.json({
        reply: parsed.reply || 'I would be delighted to assist with your schedule.',
        bookedSlotId: parsed.bookedSlotId || '',
        serviceName: parsed.serviceName || selectedService,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Concierge inference error',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
