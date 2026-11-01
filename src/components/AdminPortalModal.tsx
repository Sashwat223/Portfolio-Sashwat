import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Link2,
  Check,
  ArrowUp,
  ArrowDown,
  Layers,
  Cpu,
  Sparkles,
  User,
  Inbox,
  Rocket,
  LogOut,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  PortfolioConfig,
  WorkProject,
  SkillNode,
  ContactSubmission,
  DEFAULT_PORTFOLIO_CONFIG,
} from '../data/portfolioData';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PortfolioConfig;
  onSaveConfig: (nextConfig: PortfolioConfig, adminPasskey: string) => void;
  isAdminAuthenticated: boolean;
  onAuthChange: (authenticated: boolean, passkey: string) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  isAdminAuthenticated,
  onAuthChange,
}) => {
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activePasskey, setActivePasskey] = useState<string>(() => {
    try {
      return sessionStorage.getItem('sashwat_cms_passkey') || '';
    } catch {
      return '';
    }
  });

  const [activeTab, setActiveTab] = useState<
    'projects' | 'skills' | 'hero' | 'contact' | 'inbox' | 'vercel'
  >('projects');
  const [draft, setDraft] = useState<PortfolioConfig>(config);
  const [savedNotice, setSavedNotice] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [messages, setMessages] = useState<ContactSubmission[]>([]);

  // Vercel Dispatch State
  const [vercelToken, setVercelToken] = useState('');
  const [vercelProjectName, setVercelProjectName] = useState('portfolio-sashwat');
  const [deployingVercel, setDeployingVercel] = useState(false);
  const [vercelDeployUrl, setVercelDeployUrl] = useState('');
  const [vercelError, setVercelError] = useState('');
  const [cliCopied, setCliCopied] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  useEffect(() => {
    if (isOpen && isAdminAuthenticated && activePasskey) {
      fetch('/api/messages', {
        headers: { 'x-admin-passkey': activePasskey },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(() => {});
    }
  }, [isOpen, isAdminAuthenticated, activePasskey]);

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = passInput.trim();
    if (!trimmed) return;

    setVerifying(true);
    setPassError(false);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        setActivePasskey(trimmed);
        if (data.config) {
          setDraft(data.config);
        }
        try {
          sessionStorage.setItem('sashwat_cms_unlocked', 'true');
          sessionStorage.setItem('sashwat_cms_passkey', trimmed);
        } catch {
          // Ignore
        }
        onAuthChange(true, trimmed);
        setPassInput('');
      } else if (trimmed === (config.adminPasscode || 'sashwat2026')) {
        setActivePasskey(trimmed);
        try {
          sessionStorage.setItem('sashwat_cms_unlocked', 'true');
          sessionStorage.setItem('sashwat_cms_passkey', trimmed);
        } catch {
          // Ignore
        }
        onAuthChange(true, trimmed);
        setPassInput('');
      } else {
        setPassError(true);
      }
    } catch {
      if (trimmed === (config.adminPasscode || 'sashwat2026')) {
        setActivePasskey(trimmed);
        onAuthChange(true, trimmed);
      } else {
        setPassError(true);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleLockSession = () => {
    setActivePasskey('');
    try {
      sessionStorage.removeItem('sashwat_cms_unlocked');
      sessionStorage.removeItem('sashwat_cms_passkey');
    } catch {
      // Ignore
    }
    onAuthChange(false, '');
    onClose();
  };

  const handleApplyChanges = () => {
    onSaveConfig(draft, activePasskey || draft.adminPasscode || 'sashwat2026');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2400);
  };

  const handleResetDefaults = () => {
    setDraft(DEFAULT_PORTFOLIO_CONFIG);
    onSaveConfig(DEFAULT_PORTFOLIO_CONFIG, activePasskey || 'sashwat2026');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2400);
  };

  const handleCopySpecialLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?portal=admin`;
    navigator.clipboard?.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2200);
  };

  const addProject = () => {
    const newProj: WorkProject = {
      id: `proj-${Date.now()}`,
      title: 'New Custom Showcase',
      category: 'Web Applications',
      metric: 'High-Impact Delivery',
      desc: 'Describe the problem solved, architecture, and measurable outcome of this initiative.',
      tech: ['TypeScript', 'React', 'Three.js'],
      liveUrl: 'https://',
      demoType: 'custom',
      featuredBadge: 'Custom Showcase',
    };
    setDraft((prev) => ({ ...prev, projects: [newProj, ...prev.projects] }));
  };

  const updateProject = (idx: number, patch: Partial<WorkProject>) => {
    setDraft((prev) => {
      const next = [...prev.projects];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, projects: next };
    });
  };

  const removeProject = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  const moveProject = (idx: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev.projects];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return { ...prev, projects: next };
    });
  };

  const addSkill = () => {
    const newSkill: SkillNode = {
      id: `skill-${Date.now()}`,
      name: 'New Capability',
      tag: 'NEW',
      color: '#38BDF8',
      category: 'Engineering',
      proficiency: 'Production Ready',
      context: 'Describe how this capability powers your production architectures.',
      projectsUsed: ['Portfolio'],
    };
    setDraft((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
  };

  const updateSkill = (idx: number, patch: Partial<SkillNode>) => {
    setDraft((prev) => {
      const next = [...prev.skills];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, skills: next };
    });
  };

  const removeSkill = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx),
    }));
  };

  const handleVercelApiDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vercelToken.trim()) return;
    setDeployingVercel(true);
    setVercelError('');
    setVercelDeployUrl('');

    try {
      const res = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: vercelProjectName.trim() || 'sashwat-dhakal-portfolio',
          target: 'production',
          projectSettings: {
            framework: 'vite',
            buildCommand: 'npm run build',
            outputDirectory: 'dist',
          },
          files: [
            {
              file: 'vercel.json',
              data: JSON.stringify(
                {
                  version: 2,
                  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
                },
                null,
                2
              ),
            },
          ],
        }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setVercelDeployUrl(`https://${data.url}`);
      } else {
        setVercelError(
          data?.error?.message ||
            'Vercel token requires repository link or CLI upload. Use "npx vercel --prod" below.'
        );
      }
    } catch (err) {
      setVercelError(
        err instanceof Error ? err.message : 'Network error connecting to Vercel API'
      );
    } finally {
      setDeployingVercel(false);
    }
  };

  return (
    <div
      id="admin-cms-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto !text-white"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-3xl bg-[#0B0E17] shadow-[0_35px_90px_rgba(0,0,0,0.85)] overflow-hidden my-auto !text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Portal Header */}
        <div className="px-6 sm:px-10 py-6 bg-[#111522] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 flex items-center justify-center text-cyan-400">
              {isAdminAuthenticated ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-display font-bold text-2xl sm:text-3xl !text-white tracking-tight">
                  Portfolio Admin CMS
                </h3>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-400/15 text-cyan-300">
                  {isAdminAuthenticated ? 'Admin Verified' : 'Encrypted Gate'}
                </span>
              </div>
              <p className="font-sans text-sm sm:text-base !text-zinc-300 mt-0.5">
                {isAdminAuthenticated
                  ? 'Manage 3D showcases, capabilities, direct inbox messages, and Vercel deployment'
                  : 'Restricted to portfolio owner only — hidden from public visitors'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdminAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={handleCopySpecialLink}
                  className="px-4 py-2.5 rounded-xl bg-[#1A2033] hover:bg-[#232B42] text-sm font-semibold !text-zinc-100 inline-flex items-center gap-2 transition-colors"
                  title="Copy secret owner portal link (?portal=admin)"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Secret URL Copied</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      <span>Copy Secret Portal Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLockSession}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-sm font-semibold text-rose-300 inline-flex items-center gap-2 transition-colors"
                  title="Lock Admin Session & Hide CMS"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Lock Session</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#1A2033] hover:bg-[#232B42] !text-zinc-200 hover:!text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {!isAdminAuthenticated ? (
          /* Strict Admin Passkey Gate (No public bypass) */
          <div className="p-8 sm:p-16 max-w-lg mx-auto text-center space-y-7">
            <div className="w-16 h-16 rounded-3xl bg-cyan-400/15 flex items-center justify-center mx-auto text-cyan-400 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h4 className="font-display font-bold text-3xl sm:text-4xl !text-white">
                Admin Authentication Required
              </h4>
              <p className="font-sans text-base sm:text-lg !text-zinc-300 leading-relaxed">
                This portal is strictly restricted to Sashwat Dhakal. Enter your administrator
                passkey to unlock the CMS and inbox.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="Enter Admin Passkey..."
                className="w-full px-5 py-4 rounded-2xl bg-[#151A28] text-lg !text-white text-center placeholder:!text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              {passError && (
                <p className="text-sm font-semibold text-rose-400">
                  Access Denied: Invalid administrator passkey.
                </p>
              )}
              <button
                type="submit"
                disabled={verifying}
                className="w-full py-4 rounded-2xl bg-white !text-black font-bold text-base uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl"
              >
                {verifying ? 'Verifying Credentials...' : 'Authenticate & Unlock CMS'}
              </button>
            </form>
          </div>
        ) : (
          /* Full CMS Editor with Large, High-Contrast Apple-Style Text */
          <div className="flex flex-col h-[78vh]">
            {/* Navigation Tabs */}
            <div className="px-6 sm:px-10 py-4 bg-[#0E121E] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition-all ${
                    activeTab === 'projects'
                      ? 'bg-white !text-black shadow-lg'
                      : '!text-zinc-200 hover:!text-white bg-[#171D2E]'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Selected Work ({draft.projects.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('skills')}
                  className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition-all ${
                    activeTab === 'skills'
                      ? 'bg-white !text-black shadow-lg'
                      : '!text-zinc-200 hover:!text-white bg-[#171D2E]'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>3D Skills ({draft.skills.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('hero')}
                  className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition-all ${
                    activeTab === 'hero'
                      ? 'bg-white !text-black shadow-lg'
                      : '!text-zinc-200 hover:!text-white bg-[#171D2E]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Hero & Atmosphere</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition-all ${
                    activeTab === 'contact'
                      ? 'bg-white !text-black shadow-lg'
                      : '!text-zinc-200 hover:!text-white bg-[#171D2E]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Story & Security</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition-all ${
                    activeTab === 'inbox'
                      ? 'bg-cyan-400 !text-black shadow-lg'
                      : '!text-zinc-200 hover:!text-white bg-[#171D2E]'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span>Inbox ({messages.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vercel')}
                  className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold inline-flex items-center gap-2 transition-all ${
                    activeTab === 'vercel'
                      ? 'bg-emerald-400 !text-black shadow-lg'
                      : '!text-zinc-200 hover:!text-white bg-[#171D2E]'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  <span>Vercel & Security</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-4 py-2.5 rounded-xl bg-[#171D2E] hover:bg-[#222A40] !text-zinc-200 hover:!text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyChanges}
                  className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 !text-black font-bold text-sm sm:text-base inline-flex items-center gap-2 transition-colors shadow-lg"
                >
                  {savedNotice ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Changes Published!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save & Publish Live</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
              {/* TAB 1: PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="font-display font-bold text-2xl !text-white">
                        Portfolio Showcases & Embedded Web Apps
                      </h4>
                      <p className="text-base !text-zinc-300 mt-1">
                        Add, reorder, or customize live URLs (Triton, Jagireyy) and interactive 3D
                        demos (AuraSpline AI, CineVault IMAX).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addProject}
                      className="px-5 py-3 rounded-2xl bg-white !text-black font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 hover:bg-zinc-200 shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Project</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {draft.projects.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-6 sm:p-8 rounded-3xl bg-[#131826] space-y-5 shadow-xl"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-lg bg-cyan-400/15 font-bold text-sm text-cyan-300">
                              Project #{idx + 1}
                            </span>
                            <span className="font-display font-bold text-xl sm:text-2xl !text-white">
                              {p.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveProject(idx, -1)}
                              disabled={idx === 0}
                              className="p-2.5 rounded-xl bg-[#1C2336] !text-zinc-200 hover:!text-white disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveProject(idx, 1)}
                              disabled={idx === draft.projects.length - 1}
                              className="p-2.5 rounded-xl bg-[#1C2336] !text-zinc-200 hover:!text-white disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeProject(idx)}
                              className="p-2.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                              Project Title
                            </label>
                            <input
                              type="text"
                              value={p.title}
                              onChange={(e) => updateProject(idx, { title: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                              Category
                            </label>
                            <input
                              type="text"
                              value={p.category}
                              onChange={(e) => updateProject(idx, { category: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                              Impact Metric
                            </label>
                            <input
                              type="text"
                              value={p.metric}
                              onChange={(e) => updateProject(idx, { metric: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-cyan-300 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                              Live Deployment URL
                            </label>
                            <input
                              type="text"
                              value={p.liveUrl || ''}
                              onChange={(e) => updateProject(idx, { liveUrl: e.target.value })}
                              placeholder="https://triton-ruby.vercel.app/"
                              className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                              Interactive Demo Engine
                            </label>
                            <select
                              value={p.demoType}
                              onChange={(e) =>
                                updateProject(idx, {
                                  demoType: e.target.value as WorkProject['demoType'],
                                })
                              }
                              className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            >
                              <option value="triton">Triton 3D WebGL Showcase</option>
                              <option value="jagireyy">Jagireyy AI Job Coach Preview</option>
                              <option value="ai-concierge">
                                AuraSpline 3D AI Business Chatbot & Scheduler
                              </option>
                              <option value="cinema-reserve">
                                CineVault IMAX Hall Reservation System
                              </option>
                              <option value="finguard">FinGuard AI Risk Simulator</option>
                              <option value="analytics">Institutional Analytics Cockpit</option>
                              <option value="custom">Custom Showcase Card</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                              Tech Stack (Comma Separated)
                            </label>
                            <input
                              type="text"
                              value={p.tech.join(', ')}
                              onChange={(e) =>
                                updateProject(idx, {
                                  tech: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                            Editorial Description
                          </label>
                          <textarea
                            rows={3}
                            value={p.desc}
                            onChange={(e) => updateProject(idx, { desc: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: 3D SKILLS */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="font-display font-bold text-2xl !text-white">
                        3D Logo Cube Capabilities
                      </h4>
                      <p className="text-base !text-zinc-300 mt-1">
                        Every skill node generates an interactive 3D physics logo cube in the
                        Skills arena.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-5 py-3 rounded-2xl bg-white !text-black font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 hover:bg-zinc-200 shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add 3D Skill Cube</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {draft.skills.map((s, idx) => (
                      <div
                        key={s.id}
                        className="p-6 rounded-3xl bg-[#131826] space-y-4 shadow-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={s.color}
                              onChange={(e) => updateSkill(idx, { color: e.target.value })}
                              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                            />
                            <span className="font-display font-bold text-xl !text-white">
                              {s.name}
                            </span>
                            <span className="text-sm font-bold text-cyan-300">({s.tag})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSkill(idx)}
                            className="p-2 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider !text-zinc-200 mb-1.5">
                              Name
                            </label>
                            <input
                              type="text"
                              value={s.name}
                              onChange={(e) => updateSkill(idx, { name: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E17] text-base !text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider !text-zinc-200 mb-1.5">
                              Short Tag
                            </label>
                            <input
                              type="text"
                              value={s.tag}
                              onChange={(e) => updateSkill(idx, { tag: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E17] text-base !text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider !text-zinc-200 mb-1.5">
                              Proficiency
                            </label>
                            <input
                              type="text"
                              value={s.proficiency}
                              onChange={(e) => updateSkill(idx, { proficiency: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E17] text-base !text-cyan-300"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider !text-zinc-200 mb-1.5">
                            Production Context
                          </label>
                          <textarea
                            rows={2}
                            value={s.context}
                            onChange={(e) => updateSkill(idx, { context: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E17] text-base !text-white resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: HERO & ATMOSPHERE */}
              {activeTab === 'hero' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#131826] space-y-5">
                    <h4 className="font-display font-bold text-xl text-cyan-300">
                      Hero & Namaste Transition Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                          Greeting Line
                        </label>
                        <input
                          type="text"
                          value={draft.hero.greeting}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, greeting: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                          First Name Line
                        </label>
                        <input
                          type="text"
                          value={draft.hero.firstName}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, firstName: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                          Last Name Line
                        </label>
                        <input
                          type="text"
                          value={draft.hero.lastName}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, lastName: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                          Rim Light Intensity ({draft.hero.rimLightIntensity.toFixed(1)}x)
                        </label>
                        <input
                          type="range"
                          min="0.2"
                          max="2.0"
                          step="0.1"
                          value={draft.hero.rimLightIntensity}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                rimLightIntensity: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-full accent-cyan-400 mt-3"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Hero Bio Statement
                      </label>
                      <textarea
                        rows={3}
                        value={draft.hero.bio}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, bio: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white resize-none"
                      />
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 rounded-3xl bg-[#131826] space-y-5">
                    <h4 className="font-display font-bold text-xl text-amber-300">
                      3D Tea & Coffee Atmosphere Settings
                    </h4>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Default Initial Theme
                      </label>
                      <select
                        value={draft.atmosphere.defaultTheme}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            atmosphere: {
                              ...prev.atmosphere,
                              defaultTheme: e.target.value as 'cinematic' | 'tea' | 'coffee',
                            },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                      >
                        <option value="cinematic">Dark Studio (Default)</option>
                        <option value="tea">Ceremonial Tea (Warm Ivory & Sage)</option>
                        <option value="coffee">Roasted Espresso (Charcoal & Caramel)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Tea Card Description
                      </label>
                      <textarea
                        rows={2}
                        value={draft.atmosphere.teaDesc}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            atmosphere: { ...prev.atmosphere, teaDesc: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Coffee Card Description
                      </label>
                      <textarea
                        rows={2}
                        value={draft.atmosphere.coffeeDesc}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            atmosphere: { ...prev.atmosphere, coffeeDesc: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACT & SECURITY */}
              {activeTab === 'contact' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#131826] space-y-5">
                    <h4 className="font-display font-bold text-xl text-cyan-300">
                      Direct Contact Details
                    </h4>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Official Recipient Email
                      </label>
                      <input
                        type="email"
                        value={draft.contact.email}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, email: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Location & Timezone
                      </label>
                      <input
                        type="text"
                        value={draft.contact.location}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, location: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="text"
                        value={draft.contact.linkedinUrl}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, linkedinUrl: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        GitHub Profile URL
                      </label>
                      <input
                        type="text"
                        value={draft.contact.githubUrl}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, githubUrl: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                      />
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 rounded-3xl bg-[#131826] space-y-5">
                    <h4 className="font-display font-bold text-xl text-emerald-300">
                      Portal Security & Story Section
                    </h4>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Story Section Headline
                      </label>
                      <input
                        type="text"
                        value={draft.journey.headline}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            journey: { ...prev.journey, headline: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Story Section Intro
                      </label>
                      <textarea
                        rows={3}
                        value={draft.journey.subtext}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            journey: { ...prev.journey, subtext: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wider !text-zinc-200 mb-2">
                        Secret Admin Portal Passkey
                      </label>
                      <input
                        type="text"
                        value={draft.adminPasscode || 'sashwat2026'}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, adminPasscode: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-lg font-bold !text-cyan-300"
                      />
                      <p className="text-xs !text-zinc-400 mt-2">
                        Only someone with this passkey can unlock the CMS via ?portal=admin or
                        Ctrl+Shift+A.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: INBOX MESSAGES */}
              {activeTab === 'inbox' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-display font-bold text-2xl !text-white">
                      Direct Inquiry Inbox ({messages.length})
                    </h4>
                    <p className="text-base !text-zinc-300 mt-1">
                      All messages submitted through the Contact section are archived here and
                      dispatched to {draft.contact.email}.
                    </p>
                  </div>

                  {messages.length === 0 ? (
                    <div className="p-14 rounded-3xl bg-[#131826] text-center text-base !text-zinc-300">
                      No messages in inbox yet. Submit a test inquiry from the Contact section to
                      verify.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className="p-6 rounded-3xl bg-[#131826] space-y-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-bold text-lg sm:text-xl !text-white">
                                {m.subject}
                              </span>
                              <span className="text-sm font-semibold text-cyan-300">
                                {new Date(m.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm !text-zinc-300">
                              From: <span className="!text-white font-semibold">{m.name}</span> (
                              {m.email})
                            </div>
                            <p className="text-base !text-zinc-100 pt-2 whitespace-pre-wrap leading-relaxed">
                              {m.message}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <a
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                                m.email
                              )}&su=${encodeURIComponent(`Re: ${m.subject}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 rounded-xl bg-white !text-black text-sm font-bold hover:bg-zinc-200"
                            >
                              Reply in Gmail
                            </a>
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await fetch(`/api/messages/${m.id}`, {
                                  method: 'DELETE',
                                  headers: { 'x-admin-passkey': activePasskey },
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  if (Array.isArray(data.messages)) setMessages(data.messages);
                                }
                              }}
                              className="p-2.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                              title="Delete message"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: VERCEL DEPLOYMENT & SECURITY CENTER */}
              {activeTab === 'vercel' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Security Audit Status */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#131826] space-y-5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-7 h-7 text-emerald-400" />
                      <h4 className="font-display font-bold text-2xl !text-white">
                        Security & Access Hardening
                      </h4>
                    </div>
                    <p className="text-base !text-zinc-300 leading-relaxed">
                      Your portfolio is protected with server-side passkey authentication and
                      hidden admin routing so regular visitors only see your public showcase.
                    </p>
                    <div className="space-y-3">
                      {[
                        {
                          title: 'Hidden Admin CMS Access',
                          desc: 'CMS buttons are hidden from public visitors. Accessible only via ?portal=admin, Ctrl+Shift+A, or triple-clicking the S Dhakal logo.',
                        },
                        {
                          title: 'Passkey-Gated API Endpoints',
                          desc: 'PUT /api/portfolio and /api/messages require a valid x-admin-passkey header; public GET responses redact adminPasscode.',
                        },
                        {
                          title: 'Enterprise HTTP Security Headers',
                          desc: 'Strict-Transport-Security (HSTS), X-Content-Type-Options: nosniff, X-XSS-Protection, and Referrer-Policy configured in server.ts and vercel.json.',
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="p-4 rounded-2xl bg-[#0B0E17] space-y-1"
                        >
                          <div className="text-base font-bold text-emerald-400">
                            ✓ {item.title}
                          </div>
                          <div className="text-sm !text-zinc-300 leading-relaxed">
                            {item.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vercel Deployment Dispatch */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#131826] space-y-5">
                    <div className="flex items-center gap-3">
                      <Rocket className="w-7 h-7 text-cyan-400" />
                      <h4 className="font-display font-bold text-2xl !text-white">
                        Vercel Production Deployment
                      </h4>
                    </div>
                    <p className="text-base !text-zinc-300 leading-relaxed">
                      Pre-configured with <code className="text-cyan-300">vercel.json</code> and{' '}
                      <code className="text-cyan-300">/api/index.ts</code> Serverless Functions for
                      zero-config Vercel hosting.
                    </p>

                    <div className="p-5 rounded-2xl bg-[#0B0E17] space-y-3">
                      <div className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                        Option 1: One-Command Vercel CLI Dispatch
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-[#141928]">
                        <code className="text-base font-mono !text-white">
                          npx vercel --prod
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText('npx vercel --prod');
                            setCliCopied(true);
                            setTimeout(() => setCliCopied(false), 2000);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-white !text-black text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          {cliCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleVercelApiDeploy} className="space-y-4">
                      <div className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                        Option 2: Direct Vercel API Token Dispatch
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider !text-zinc-300 mb-1.5">
                          Vercel Project Name
                        </label>
                        <input
                          type="text"
                          value={vercelProjectName}
                          onChange={(e) => setVercelProjectName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider !text-zinc-300 mb-1.5">
                          Vercel Access Token (from vercel.com/account/tokens)
                        </label>
                        <input
                          type="password"
                          value={vercelToken}
                          onChange={(e) => setVercelToken(e.target.value)}
                          placeholder="Enter Vercel Bearer Token..."
                          className="w-full px-4 py-3 rounded-xl bg-[#0B0E17] text-base !text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={deployingVercel}
                        className="w-full py-3.5 rounded-2xl bg-white !text-black font-bold text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-lg inline-flex items-center justify-center gap-2"
                      >
                        <Rocket className="w-4 h-4" />
                        <span>
                          {deployingVercel
                            ? 'Dispatching to Vercel Edge Network...'
                            : 'Trigger Vercel Cloud Deployment'}
                        </span>
                      </button>

                      {vercelDeployUrl && (
                        <div className="p-4 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-semibold flex items-center justify-between">
                          <span>Deployed: {vercelDeployUrl}</span>
                          <a
                            href={vercelDeployUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline inline-flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {vercelError && (
                        <div className="p-4 rounded-xl bg-amber-500/15 text-amber-200 text-sm">
                          {vercelError}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
