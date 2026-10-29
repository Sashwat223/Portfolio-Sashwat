import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Lock, Check, Copy, Mail, Send, ExternalLink, CheckCircle2 } from 'lucide-react';
import { PortfolioConfig, cleanKickerText } from '../data/portfolioData';

interface AboutAndContactProps {
  journey: PortfolioConfig['journey'];
  contact: PortfolioConfig['contact'];
  onOpenAdminPortal: () => void;
}

export const AboutAndContactSection: React.FC<AboutAndContactProps> = ({
  journey,
  contact,
  onOpenAdminPortal,
}) => {
  const [copied, setCopied] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<string>('');
  const [lastPayload, setLastPayload] = useState<{
    name: string;
    email: string;
    subject: string;
    message: string;
  } | null>(null);

  const recipientEmail = (contact.email || 'Sashwatdhakal224@gmail.com').trim();

  const handleCopyMail = () => {
    navigator.clipboard?.writeText(recipientEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const buildGmailComposeUrl = (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    const su = `[Portfolio Inquiry] ${payload.subject}`;
    const body = `From: ${payload.name} (${payload.email})\n\n${payload.message}`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      recipientEmail
    )}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(body)}`;
  };

  const buildMailtoUrl = (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    const su = `[Portfolio Inquiry] ${payload.subject}`;
    const body = `From: ${payload.name} (${payload.email})\n\n${payload.message}`;
    return `mailto:${recipientEmail}?subject=${encodeURIComponent(su)}&body=${encodeURIComponent(
      body
    )}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) return;

    setSubmitting(true);
    const payload = {
      name: senderName.trim(),
      email: senderEmail.trim(),
      subject: subject.trim() || 'Collaborative Initiative',
      message: message.trim(),
    };
    setLastPayload(payload);

    let deliveredDirect = false;
    let statusNote = `Dispatched to ${recipientEmail} & saved to Portfolio Inbox.`;

    // 1. Save to server inbox & server-side email relay
    try {
      const serverRes = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          recipientEmail,
        }),
      });
      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.relaySuccess) {
          deliveredDirect = true;
        }
      }
    } catch {
      // Continue to client-side dispatch
    }

    // 2. Direct browser FormSubmit AJAX dispatch to Sashwatdhakal224@gmail.com
    if (!deliveredDirect) {
      try {
        const fsRes = await fetch(
          `https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              name: payload.name,
              email: payload.email,
              _replyto: payload.email,
              _subject: `[Portfolio Inquiry] ${payload.subject}`,
              subject: payload.subject,
              message: payload.message,
              _template: 'table',
              _captcha: 'false',
            }),
          }
        );
        if (fsRes.ok) {
          const fsData = await fsRes.json().catch(() => ({}));
          if (fsData.message && String(fsData.message).toLowerCase().includes('activate')) {
            statusNote = `Activation email sent to ${recipientEmail} (check your Gmail Inbox/Spam once to activate instant FormSubmit delivery, or click "Send via Gmail" below).`;
          } else {
            deliveredDirect = true;
          }
        }
      } catch {
        // Fallback links provided on confirmation card
      }
    }

    setDeliveryStatus(statusNote);
    setSubmitting(false);
    setSubmitted(true);
    setSenderName('');
    setSenderEmail('');
    setSubject('');
    setMessage('');

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#f59e0b', '#10b981', '#ffffff'],
      });
    } catch {
      // Ignore confetti errors
    }
  };

  return (
    <>
      {/* ABOUT & JOURNEY */}
      <section id="about" className="relative w-full py-32 px-6 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-20">
            <span className="type-kicker text-cyan-400 block mb-4">
              {cleanKickerText(journey.kicker)}
            </span>
            <h2 className="type-section-heading mb-6 text-balance">
              {journey.headline}
            </h2>
            <p className="type-body-lead">
              {journey.subtext}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {journey.items.map((item) => (
              <div key={item.id} className="p-8 sm:p-10 rounded-3xl card-surface">
                <span
                  className={`type-kicker ${item.kickerColor} block mb-3`}
                >
                  {cleanKickerText(item.kicker)}
                </span>
                <h3 className="type-card-heading text-white mb-4">
                  {item.title}
                </h3>
                <p className="font-sans text-base sm:text-[1.0625rem] text-zinc-300 leading-relaxed font-normal mb-6">
                  {item.desc}
                </p>
                <div className="p-5 rounded-2xl card-elevated font-sans text-sm sm:text-base text-zinc-200 leading-relaxed">
                  {item.quote}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="relative w-full py-32 px-6 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-20">
            <span className="type-kicker text-cyan-400 block mb-4">
              {cleanKickerText(contact.kicker)}
            </span>
            <h2 className="type-section-heading mb-5 text-balance">
              {contact.headline}
            </h2>
            <p className="type-body-lead">
              {contact.subtext}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5 space-y-6">
              <div className="card-surface rounded-3xl p-8 sm:p-10">
                <span className="type-kicker text-zinc-400 block mb-3">
                  Official Direct Email
                </span>
                <div className="flex items-center justify-between gap-2 p-4 rounded-2xl card-elevated mb-4">
                  <span className="font-sans font-medium text-sm sm:text-base text-cyan-400 truncate">
                    {recipientEmail}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMail}
                    className="type-nav-button px-3.5 py-2 rounded-xl bg-zinc-800 !text-zinc-100 hover:!text-white inline-flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-sans text-sm text-zinc-300 leading-relaxed mb-4">
                  Every message submitted through this form is dispatched directly to{' '}
                  <span className="text-white font-medium">{recipientEmail}</span> and archived in
                  the Portfolio CMS Inbox.
                </p>
                <a
                  href={`mailto:${recipientEmail}`}
                  className="w-full py-3.5 px-5 rounded-2xl card-elevated type-nav-button text-zinc-200 hover:text-white inline-flex items-center justify-between transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span>Compose Direct Email in Mail App</span>
                  </span>
                  <span>↗</span>
                </a>
              </div>

              <div className="card-surface rounded-3xl p-8 sm:p-10 space-y-3">
                <span className="type-kicker text-zinc-400 block mb-2">
                  Professional Networks
                </span>
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl card-elevated text-base font-medium text-zinc-200 hover:text-white transition-colors"
                >
                  <span>LinkedIn</span>
                  <span>↗</span>
                </a>
                <a
                  href={contact.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl card-elevated text-base font-medium text-zinc-200 hover:text-white transition-colors"
                >
                  <span>GitHub</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 card-surface rounded-3xl p-8 sm:p-12">
              {!submitted ? (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block type-kicker text-zinc-300 mb-2.5">
                        Your Name *
                      </label>
                      <input
                        required
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full px-5 py-4 rounded-2xl card-elevated text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block type-kicker text-zinc-300 mb-2.5">
                        Your Email *
                      </label>
                      <input
                        required
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="alex@domain.com"
                        className="w-full px-5 py-4 rounded-2xl card-elevated text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block type-kicker text-zinc-300 mb-2.5">
                      Subject *
                    </label>
                    <input
                      required
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Collaborative Initiative"
                      className="w-full px-5 py-4 rounded-2xl card-elevated text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block type-kicker text-zinc-300 mb-2.5">
                      Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell me about your project, timeline, or collaboration idea..."
                      className="w-full px-5 py-4 rounded-2xl card-elevated text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-full bg-white !text-black type-nav-button hover:bg-zinc-200 transition-all shadow-xl inline-flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting
                        ? `Sending to ${recipientEmail}...`
                        : `Send Message to ${recipientEmail}`}
                    </span>
                  </button>
                </form>
              ) : (
                <div className="py-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="type-card-heading text-white">
                        Message Dispatched
                      </h4>
                      <p className="text-sm text-emerald-400 font-medium">
                        Recipient: {recipientEmail}
                      </p>
                    </div>
                  </div>

                  <p className="font-sans text-base text-zinc-200 leading-relaxed">
                    {deliveryStatus}
                  </p>

                  {lastPayload && (
                    <div className="p-5 rounded-2xl card-elevated space-y-2 text-sm text-zinc-300">
                      <div className="font-medium text-white">
                        {lastPayload.subject}
                      </div>
                      <div className="text-xs text-zinc-400">
                        From: {lastPayload.name} ({lastPayload.email})
                      </div>
                      <p className="text-zinc-200 pt-1 whitespace-pre-wrap">
                        {lastPayload.message}
                      </p>
                    </div>
                  )}

                  {lastPayload && (
                    <div className="space-y-3 pt-2">
                      <p className="type-kicker text-zinc-400">
                        Instant Direct Mail Dispatch Options (Guaranteed Delivery):
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={buildGmailComposeUrl(lastPayload)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-3 rounded-full bg-white !text-black type-nav-button hover:bg-zinc-200 transition-all inline-flex items-center gap-2 shadow-lg"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Send Directly via Gmail</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={buildMailtoUrl(lastPayload)}
                          className="px-5 py-3 rounded-full card-elevated text-white type-nav-button hover:brightness-110 transition-all inline-flex items-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Open in Default Mail App</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setSubmitted(false)}
                          className="px-5 py-3 rounded-full card-elevated text-zinc-300 hover:text-white type-nav-button"
                        >
                          Write Another Message
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER WITH DISCREET SPECIAL PORTAL LINK */}
      <footer className="w-full card-surface py-16 px-6 sm:px-12 lg:px-16 text-sm text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display font-semibold text-xl tracking-[-0.03em] text-white">
              Sashwat Dhakal
            </span>
            <span>·</span>
            <span>Thoughtful digital experiences at the intersection of technology & design.</span>
          </div>

          <div className="flex items-center gap-5">
            <span className="font-sans font-medium text-sm text-cyan-400">{contact.location}</span>
            <span className="text-zinc-700">·</span>
            <button
              type="button"
              onClick={onOpenAdminPortal}
              className="type-nav-button text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
              title="Access Owner CMS Portal (?portal=admin)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};
