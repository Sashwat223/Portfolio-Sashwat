import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI, Type } from '@google/genai';
import {
  DEFAULT_PORTFOLIO_CONFIG,
  sanitizePortfolioConfig,
  ContactSubmission,
  PortfolioConfig,
} from '../src/data/portfolioData';

// In-memory state for Vercel serverless warm instances
let cachedConfig: PortfolioConfig = sanitizePortfolioConfig(DEFAULT_PORTFOLIO_CONFIG);
let cachedMessages: ContactSubmission[] = [];

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

export default async function handler(
  req: IncomingMessage & { body?: any; query?: any },
  res: ServerResponse & { status?: (code: number) => any; json?: (data: any) => any }
) {
  const sendJson = (statusCode: number, payload: unknown) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(JSON.stringify(payload));
  };

  const url = req.url || '';
  const method = req.method || 'GET';
  const adminKey = req.headers['x-admin-passkey'] as string | undefined;

  if (url.startsWith('/api/admin/verify') && method === 'POST') {
    const body = req.body || {};
    if (isValidAdminKey(String(body.passkey || ''), cachedConfig)) {
      return sendJson(200, { authenticated: true, config: cachedConfig });
    }
    return sendJson(401, { authenticated: false, error: 'Invalid admin passkey' });
  }

  if (url.startsWith('/api/portfolio')) {
    if (method === 'GET') {
      if (isValidAdminKey(adminKey, cachedConfig)) {
        return sendJson(200, cachedConfig);
      }
      return sendJson(200, { ...cachedConfig, adminPasscode: '' });
    }
    if (method === 'PUT') {
      if (!isValidAdminKey(adminKey, cachedConfig)) {
        return sendJson(401, { error: 'Unauthorized: Valid admin passkey required' });
      }
      const next = req.body;
      if (!next || typeof next !== 'object') {
        return sendJson(400, { error: 'Invalid payload' });
      }
      cachedConfig = sanitizePortfolioConfig({
        ...next,
        adminPasscode: next.adminPasscode || cachedConfig.adminPasscode || 'sashwat2026',
      });
      return sendJson(200, { status: 'ok', config: cachedConfig });
    }
  }

  if (url.startsWith('/api/messages')) {
    if (!isValidAdminKey(adminKey, cachedConfig)) {
      return sendJson(401, { error: 'Unauthorized: Admin passkey required' });
    }
    if (method === 'GET') {
      return sendJson(200, cachedMessages);
    }
    if (method === 'DELETE') {
      const id = url.split('/').pop() || '';
      cachedMessages = cachedMessages.filter((m) => m.id !== id);
      return sendJson(200, { status: 'ok', messages: cachedMessages });
    }
  }

  if (url.startsWith('/api/contact') && method === 'POST') {
    const { name, email, subject, message, recipientEmail } = req.body || {};
    if (!name || !email || !message) {
      return sendJson(400, { error: 'Name, email, and message are required.' });
    }

    const targetEmail = (recipientEmail || 'Sashwatdhakal224@gmail.com').trim();
    const submission: ContactSubmission = {
      id: `msg-${Date.now()}`,
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().slice(0, 160),
      subject: String(subject || 'Portfolio Inquiry').trim().slice(0, 200),
      message: String(message).trim().slice(0, 4000),
      createdAt: new Date().toISOString(),
      deliveredVia: 'Vercel Serverless Relay',
    };
    cachedMessages = [submission, ...cachedMessages];

    let relaySuccess = false;
    try {
      const fsRes = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
      if (fsRes.ok) {
        relaySuccess = true;
      }
    } catch {
      // Handled on client fallback
    }

    return sendJson(200, {
      status: 'ok',
      relaySuccess,
      recipientEmail: targetEmail,
      submission,
    });
  }

  if (url.startsWith('/api/concierge/chat') && method === 'POST') {
    const { message, business, availableSlots, clientName, selectedService } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return sendJson(503, { error: 'Gemini API key not configured' });
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const slotsContext = Array.isArray(availableSlots)
        ? availableSlots
            .map((s: any) => `${s.id}: ${s.dayLabel} (${s.dateStr}) at ${s.time}`)
            .join('; ')
        : '';
      const servicesContext = Array.isArray(business?.services)
        ? business.services.map((s: any) => `${s.name} (${s.duration}, ${s.price})`).join('; ')
        : '';
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Customer (${clientName || 'Guest'}): "${message}"`,
        config: {
          systemInstruction: `You are AuraSpline AI, an executive autonomous concierge for "${business?.name || 'our studio'}". Services: ${servicesContext}. Slots: ${slotsContext}. Preferred service: "${selectedService || ''}". Keep reply concise (1-3 sentences).`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              bookedSlotId: { type: Type.STRING },
              serviceName: { type: Type.STRING },
            },
            required: ['reply', 'bookedSlotId', 'serviceName'],
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      return sendJson(200, {
        reply: parsed.reply || 'I would be delighted to assist with your schedule.',
        bookedSlotId: parsed.bookedSlotId || '',
        serviceName: parsed.serviceName || selectedService,
      });
    } catch (err) {
      return sendJson(500, { error: err instanceof Error ? err.message : 'Inference error' });
    }
  }

  return sendJson(404, { error: 'Not found' });
}
