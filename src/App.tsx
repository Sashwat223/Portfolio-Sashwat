import React, { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import {
  DEFAULT_PORTFOLIO_CONFIG,
  PortfolioConfig,
  sanitizePortfolioConfig,
} from './data/portfolioData';
import { HeroSection } from './components/HeroSection';
import { AtmosphereSection } from './components/AtmosphereSection';
import { WorkSection } from './components/WorkSection';
import { SkillsSection } from './components/SkillsSection';
import { AboutAndContactSection } from './components/AboutAndContactSection';
import { AdminPortalModal } from './components/AdminPortalModal';

const STORAGE_KEY = 'sashwat_portfolio_cms_v1';

export default function App() {
  const [config, setConfig] = useState<PortfolioConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return sanitizePortfolioConfig({
          ...DEFAULT_PORTFOLIO_CONFIG,
          ...JSON.parse(saved),
        });
      }
    } catch {
      // Ignore storage errors
    }
    return sanitizePortfolioConfig(DEFAULT_PORTFOLIO_CONFIG);
  });

  const [theme, setTheme] = useState<'cinematic' | 'tea' | 'coffee'>(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as
        | 'cinematic'
        | 'tea'
        | 'coffee'
        | null;
      if (savedTheme === 'tea' || savedTheme === 'coffee' || savedTheme === 'cinematic') {
        return savedTheme;
      }
    } catch {
      // Ignore
    }
    return DEFAULT_PORTFOLIO_CONFIG.atmosphere.defaultTheme;
  });

  const [scrolled, setScrolled] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('sashwat_cms_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Sync with backend portfolio config on mount & check special portal URL (?portal=admin or #admin)
  useEffect(() => {
    const savedPasskey = (() => {
      try {
        return sessionStorage.getItem('sashwat_cms_passkey') || '';
      } catch {
        return '';
      }
    })();

    fetch('/api/portfolio', {
      headers: savedPasskey ? { 'x-admin-passkey': savedPasskey } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((serverData) => {
        if (serverData && serverData.hero) {
          const cleaned = sanitizePortfolioConfig(serverData);
          setConfig(cleaned);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          } catch {
            // Ignore
          }
        }
      })
      .catch(() => {
        // Fallback to localStorage / default
      });

    const params = new URLSearchParams(window.location.search);
    if (
      params.get('portal') === 'admin' ||
      params.get('admin') === '1' ||
      window.location.hash === '#admin' ||
      window.location.hash === '#portal'
    ) {
      setAdminOpen(true);
    }

    const onHashChange = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#portal') {
        setAdminOpen(true);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminOpen((v) => !v);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Apply theme classes to body
  useEffect(() => {
    document.body.classList.remove('theme-tea', 'theme-coffee');
    if (theme === 'tea') document.body.classList.add('theme-tea');
    if (theme === 'coffee') document.body.classList.add('theme-coffee');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Topbar scroll listener & ambient cursor spotlight
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let curX = -600;
    let curY = -600;
    let tgtX = -600;
    let tgtY = -600;
    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      tgtX = e.clientX;
      tgtY = e.clientY;
    };

    const updateSpotlight = () => {
      curX += (tgtX - curX) * 0.1;
      curY += (tgtY - curY) * 0.1;
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${curX - 300}px, ${curY - 300}px, 0)`;
      }
      rafId = requestAnimationFrame(updateSpotlight);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(updateSpotlight);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleSaveConfig = async (nextConfig: PortfolioConfig, adminPasskey?: string) => {
    setConfig(nextConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
    } catch {
      // Ignore
    }
    const keyToUse =
      adminPasskey ||
      (() => {
        try {
          return sessionStorage.getItem('sashwat_cms_passkey') || 'sashwat2026';
        } catch {
          return 'sashwat2026';
        }
      })();
    try {
      await fetch('/api/portfolio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passkey': keyToUse,
        },
        body: JSON.stringify(nextConfig),
      });
    } catch {
      // Ignore network errors
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Ambient Flashlight Spotlight */}
      <div
        ref={spotlightRef}
        className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none opacity-25 z-10 transition-opacity"
        style={{
          background:
            'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(245,158,11,0.15) 45%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Minimal Floating Nav with Frosted Glass Blur */}
      <header
        id="site-header"
        className={`fixed top-0 left-0 right-0 z-40 px-6 sm:px-12 transition-all duration-500 ${
          scrolled
            ? 'bg-black/75 backdrop-blur-2xl border-b border-white/[0.08] py-3.5 shadow-2xl'
            : 'py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Mark */}
          <a
            href="#hero"
            className="flex items-center gap-1.5 text-xl tracking-tight !text-white group whitespace-nowrap shrink-0"
          >
            <span className="font-display font-semibold text-2xl tracking-[-0.04em]">S</span>
            <span className="font-sans font-medium text-sm tracking-[-0.01em] !text-zinc-400 group-hover:!text-white transition-colors">
              Dhakal
            </span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 type-nav-button !text-zinc-400">
            <a
              href="#hero"
              className="hover:!text-white transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#atmosphere"
              className="hover:!text-white transition-colors whitespace-nowrap shrink-0"
            >
              Atmosphere
            </a>
            <a
              href="#work"
              className="hover:!text-white transition-colors whitespace-nowrap shrink-0"
            >
              Work
            </a>
            <a
              href="#skills"
              className="hover:!text-white transition-colors whitespace-nowrap shrink-0"
            >
              Skills
            </a>
            <a
              href="#about"
              className="hover:!text-white transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
            <a
              href="#contact"
              className="hover:!text-white transition-colors whitespace-nowrap shrink-0"
            >
              Contact
            </a>
          </nav>

          {/* Zone 3: Theme Switcher & Discreet CMS Portal Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center bg-[#16161C] rounded-full p-1 gap-1 shadow-md border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTheme('cinematic')}
                className={`px-3 py-1 rounded-full type-nav-button transition-colors whitespace-nowrap shrink-0 ${
                  theme === 'cinematic'
                    ? 'bg-zinc-800 !text-white'
                    : '!text-zinc-400 hover:!text-white'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('tea')}
                className={`px-3 py-1 rounded-full type-nav-button transition-colors whitespace-nowrap shrink-0 ${
                  theme === 'tea'
                    ? 'bg-[#466B54] !text-white'
                    : '!text-zinc-400 hover:!text-white'
                }`}
              >
                Tea
              </button>
              <button
                type="button"
                onClick={() => setTheme('coffee')}
                className={`px-3 py-1 rounded-full type-nav-button transition-colors whitespace-nowrap shrink-0 ${
                  theme === 'coffee'
                    ? 'bg-[#D78B44] !text-black'
                    : '!text-zinc-400 hover:!text-white'
                }`}
              >
                Coffee
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="px-3 py-1.5 rounded-full bg-[#16161C] hover:bg-zinc-800 border border-white/[0.08] type-nav-button !text-zinc-300 hover:!text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              title="Open Portfolio Admin CMS Portal (?portal=admin)"
            >
              <Settings className="w-3 h-3 text-cyan-400" />
              <span>CMS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Portfolio Sections */}
      <main>
        <HeroSection config={config.hero} />
        <AtmosphereSection
          config={config.atmosphere}
          activeTheme={theme}
          onSelectTheme={setTheme}
        />
        <WorkSection projects={config.projects} />
        <SkillsSection skills={config.skills} />
        <AboutAndContactSection
          journey={config.journey}
          contact={config.contact}
          onOpenAdminPortal={() => setAdminOpen(true)}
        />
      </main>

      {/* Owner Admin CMS Portal Modal */}
      <AdminPortalModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        isAdminAuthenticated={isAdminAuthenticated}
        onAuthChange={(authenticated) => setIsAdminAuthenticated(authenticated)}
      />
    </div>
  );
}
