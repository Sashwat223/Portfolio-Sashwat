export interface WorkProject {
  id: string;
  title: string;
  category: string;
  metric: string;
  desc: string;
  tech: string[];
  liveUrl?: string;
  demoType: 'triton' | 'jagireyy' | 'ai-concierge' | 'cinema-reserve' | 'finguard' | 'analytics' | 'custom';
  featuredBadge?: string;
  highlights?: string[];
}

export interface SkillNode {
  id: string;
  name: string;
  tag: string;
  color: string;
  category: string;
  proficiency: string;
  context: string;
  projectsUsed: string[];
}

export interface JourneyItem {
  id: string;
  kicker: string;
  kickerColor: string;
  title: string;
  desc: string;
  quote: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  deliveredVia?: string;
}

export interface PortfolioConfig {
  hero: {
    kicker: string;
    greeting: string;
    firstName: string;
    lastName: string;
    bio: string;
    scrollPrompt: string;
    primaryCtaText: string;
    secondaryCtaText: string;
    rimLightIntensity: number;
  };
  atmosphere: {
    kicker: string;
    headlinePrefix: string;
    subtext: string;
    defaultTheme: 'cinematic' | 'tea' | 'coffee';
    teaDesc: string;
    coffeeDesc: string;
  };
  projects: WorkProject[];
  skills: SkillNode[];
  journey: {
    kicker: string;
    headline: string;
    subtext: string;
    items: JourneyItem[];
  };
  contact: {
    kicker: string;
    headline: string;
    subtext: string;
    email: string;
    location: string;
    linkedinUrl: string;
    githubUrl: string;
  };
  adminPasscode: string;
}

/**
 * Strips any legacy "/01 — " or "01 // " numeric prefixes from kickers
 */
export function cleanKickerText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/^\/?\d+\s*[—\-·/]+\s*/i, '')
    .replace(/^\d+\s+/, '')
    .trim();
}

export function sanitizePortfolioConfig(cfg: PortfolioConfig): PortfolioConfig {
  return {
    ...cfg,
    hero: {
      ...cfg.hero,
      kicker: cleanKickerText(cfg.hero?.kicker || 'Introduction'),
    },
    atmosphere: {
      ...cfg.atmosphere,
      kicker: cleanKickerText(cfg.atmosphere?.kicker || 'Atmosphere'),
    },
    journey: {
      ...cfg.journey,
      kicker: cleanKickerText(cfg.journey?.kicker || 'Background & Story'),
    },
    contact: {
      ...cfg.contact,
      kicker: cleanKickerText(cfg.contact?.kicker || 'Direct Inquiries'),
    },
  };
}

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  hero: {
    kicker: 'Introduction',
    greeting: 'Namaste,',
    firstName: 'I’m Sashwat',
    lastName: 'Dhakal.',
    bio: 'Building thoughtful digital experiences at the intersection of technology, data, and design.',
    scrollPrompt: 'Scroll to animate Namaste transition',
    primaryCtaText: 'Explore Journey',
    secondaryCtaText: 'Selected Work',
    rimLightIntensity: 1.0,
  },
  atmosphere: {
    kicker: 'Atmosphere',
    headlinePrefix: 'Before we begin,',
    subtext: 'Choose the atmosphere for your journey. Adapts the visual palette, lighting, and mood across the entire portfolio.',
    defaultTheme: 'cinematic',
    teaDesc: 'Warm ivory, soft cream, muted sage, and earthy accents. Calm, welcoming, and contemplative.',
    coffeeDesc: 'Deep espresso, charcoal surfaces, warm brown, and caramel highlights. Focused, rich, and energetic.',
  },
  projects: [
    {
      id: 'triton',
      title: 'Triton',
      category: '3D & Creative Engineering',
      metric: '60 FPS WebGL Choreography',
      desc: 'An immersive 3D product showcase pushing real-time WebGL rendering, physics, and studio-grade lighting. Features procedural micro-surface roughness, interactive orbital inspection, and scroll choreography.',
      tech: ['Three.js', 'GLSL Shaders', 'GSAP', 'TypeScript', 'Vercel'],
      liveUrl: 'https://triton-ruby.vercel.app/',
      demoType: 'triton',
      featuredBadge: 'Live Production Deployment',
      highlights: [
        'Real-time PBR metallic & glass shader pipeline with custom environment reflections',
        'Scroll-synchronized camera keyframes with damped spring interpolation',
        'Sub-16ms frame budget across desktop and mobile viewports',
      ],
    },
    {
      id: 'jagireyy',
      title: 'Jagireyy Job Coach',
      category: 'AI & Career Intelligence',
      metric: '40% Faster Resume Review',
      desc: 'AI-powered career coaching and intelligent resume optimization platform tailored for the modern job seeker. Engineered with simulated interview dialogues, ATS scoring, and semantic skill-gap heatmaps.',
      tech: ['Next.js', 'TypeScript', 'Gemini AI', 'Tailwind CSS'],
      liveUrl: 'https://jagireyy.ai.studio/',
      demoType: 'jagireyy',
      featuredBadge: 'Live AI Studio App',
      highlights: [
        'Real-time semantic resume parsing against target role rubrics',
        'Interactive mock interview voice/text simulation with actionable feedback',
        'Automated bullet-point impact rewriting and skill-gap matrix',
      ],
    },
    {
      id: 'spline-ai-concierge',
      title: 'AuraSpline AI — Business Concierge & Scheduler',
      category: 'Interactive 3D Web Application',
      metric: '0.8s Autonomous Booking & Triage',
      desc: 'A sleek, Spline-inspired 3D AI receptionist and scheduling web application built for high-touch businesses. Responds to customer inquiries instantaneously, qualifies leads, checks real-time calendar availability, and books appointments automatically.',
      tech: ['Three.js Spline Shader', 'Gemini 3.8 Flash', 'React 19', 'TypeScript', 'Function Calling'],
      demoType: 'ai-concierge',
      featuredBadge: 'Interactive Live App Inside Portfolio',
      highlights: [
        'Reactive 3D Spline-style morphing glass & plasma core that responds to conversation state',
        'Instant AI customer support & automated appointment scheduling across multiple business verticals',
        'Live calendar slot reservation with conflict prevention and instant confirmation pass',
      ],
    },
    {
      id: 'cinevault-reserve',
      title: 'CineVault IMAX — Luxury Hall Reservation System',
      category: 'Interactive Spatial Web Application',
      metric: '3D Acoustic & Seat Telemetry',
      desc: 'An ultra-premium movie hall and IMAX laser auditorium reservation application. Features an interactive curved screen light-cast visualizer, tiered seating map (Dolby Prime, VIP Loungers), sightline angle preview, and instant holographic ticket generation.',
      tech: ['React 19', 'Three.js Spatial View', 'TypeScript', 'Tailwind CSS'],
      demoType: 'cinema-reserve',
      featuredBadge: 'Interactive Live App Inside Portfolio',
      highlights: [
        'Interactive auditorium seating map with real-time screen luminance reflection and sightline preview',
        'Multi-tier seat pricing (Standard, Laser Prime, Executive Recliner) with concierge F&B pairing',
        'Instant digital IMAX boarding pass generation with seat telemetry and QR verification',
      ],
    },
    {
      id: 'finguard-ai',
      title: 'FinGuard AI',
      category: 'Data & Analytics',
      metric: '92% Distress Prediction Recall',
      desc: 'Business financial distress prediction engine and interactive analytics cockpit for commercial portfolios. Synthesizes empirical accounting ratios with gradient-boosted classification heuristics.',
      tech: ['Python', 'pandas', 'NumPy', 'Next.js'],
      demoType: 'finguard',
      featuredBadge: 'Financial Risk Engine',
      highlights: [
        'Altman Z-Score & liquidity ratio synthesis with multi-quarter stress testing',
        'Interactive commercial portfolio risk heatmap and early-warning signals',
      ],
    },
    {
      id: 'institutional-analytics',
      title: 'Data Analytics Dashboard',
      category: 'Data & Analytics',
      metric: 'Instant Cross-Filtering',
      desc: 'High-density operational intelligence dashboard transforming complex institutional records into actionable visual stories. Designed for executive decision-making under strict compliance.',
      tech: ['Python', 'pandas', 'React', 'Chart.js'],
      demoType: 'analytics',
      featuredBadge: 'Operational Intelligence',
      highlights: [
        'Multi-dimensional cross-filtering across 50,000+ institutional records',
        'Automated anomaly detection and statutory SLA reporting exports',
      ],
    },
  ],
  skills: [
    {
      id: 'ts',
      name: 'TypeScript',
      tag: 'TS',
      color: '#3178C6',
      category: 'Core Language',
      proficiency: 'Production Architecture',
      context: 'Strict type-safe domain modeling, discriminated unions for complex UI state machines, and end-to-end API contract validation across Triton, Jagireyy, and enterprise dashboards.',
      projectsUsed: ['Triton', 'Jagireyy Job Coach', 'AuraSpline AI', 'CineVault IMAX'],
    },
    {
      id: 'react',
      name: 'React',
      tag: 'REACT',
      color: '#00D8FF',
      category: 'Frontend Systems',
      proficiency: 'Concurrent & Spatial UI',
      context: 'High-frequency state synchronization between DOM HUD layers and 60fps WebGL canvases without triggering unnecessary React re-renders.',
      projectsUsed: ['Jagireyy Job Coach', 'AuraSpline AI', 'CineVault IMAX'],
    },
    {
      id: 'nextjs',
      name: 'Next.js',
      tag: 'NEXT',
      color: '#6366F1',
      category: 'Full-Stack Framework',
      proficiency: 'App Router & Edge APIs',
      context: 'Server-rendered editorial experiences, streaming AI route handlers, and zero-layout-shift asset pipelines.',
      projectsUsed: ['Triton', 'Jagireyy Job Coach', 'FinGuard AI'],
    },
    {
      id: 'threejs',
      name: 'Three.js',
      tag: '3D',
      color: '#38BDF8',
      category: 'Creative Engineering',
      proficiency: 'PBR, Shaders & Raycasting',
      context: 'Physically-based ceramic, optical crystal, and brushed metal rendering with custom PMREM studio environment maps, lathe geometries, and interactive raycasting.',
      projectsUsed: ['Triton', 'AuraSpline AI', 'CineVault IMAX', 'Portfolio Atmosphere'],
    },
    {
      id: 'gsap',
      name: 'GSAP',
      tag: 'GSAP',
      color: '#88CE02',
      category: 'Motion Choreography',
      proficiency: 'Scroll & Timeline Physics',
      context: 'Frame-accurate scroll scrubbing, damped camera transitions, and orchestrated editorial reveals.',
      projectsUsed: ['Triton', 'Portfolio Hero Scrubbing'],
    },
    {
      id: 'python',
      name: 'Python',
      tag: 'PY',
      color: '#FFD43B',
      category: 'Data & Backend',
      proficiency: 'Data Pipelines & ML',
      context: 'Automated ETL pipelines, financial ratio computation, and statistical modeling for commercial credit and operational datasets.',
      projectsUsed: ['FinGuard AI', 'Data Analytics Dashboard'],
    },
    {
      id: 'pandas',
      name: 'pandas',
      tag: 'PD',
      color: '#8B5CF6',
      category: 'Data Engineering',
      proficiency: 'Time-Series & Reconciliation',
      context: 'High-speed reconciliation of multi-currency banking ledgers, missing-data imputation, and institutional audit reporting.',
      projectsUsed: ['FinGuard AI', 'Data Analytics Dashboard'],
    },
    {
      id: 'numpy',
      name: 'NumPy',
      tag: 'NP',
      color: '#06B6D4',
      category: 'Scientific Computing',
      proficiency: 'Vectorized Matrix Ops',
      context: 'Vectorized numerical simulations, covariance matrices, and quantitative risk scoring.',
      projectsUsed: ['FinGuard AI'],
    },
    {
      id: 'sql',
      name: 'SQL',
      tag: 'SQL',
      color: '#F43F5E',
      category: 'Relational Storage',
      proficiency: 'Complex Analytical Queries',
      context: 'Window functions, CTEs, transactional locking for reservation systems, and high-integrity financial record auditing.',
      projectsUsed: ['CineVault IMAX', 'Data Analytics Dashboard'],
    },
    {
      id: 'ml',
      name: 'Machine Learning',
      tag: 'ML',
      color: '#EC4899',
      category: 'AI & Predictive Systems',
      proficiency: 'LLM Agents & Classification',
      context: 'Gradient-boosted distress classifiers, Gemini function-calling concierge agents, and semantic resume evaluation pipelines.',
      projectsUsed: ['Jagireyy Job Coach', 'AuraSpline AI', 'FinGuard AI'],
    },
    {
      id: 'git',
      name: 'Git',
      tag: 'GIT',
      color: '#F97316',
      category: 'Version Control & CI/CD',
      proficiency: 'Release & Branch Governance',
      context: 'Clean atomic commit histories, automated Vercel deployments, and collaborative code review workflows.',
      projectsUsed: ['All Production Repositories'],
    },
    {
      id: 'apis',
      name: 'APIs',
      tag: 'API',
      color: '#10B981',
      category: 'Systems Integration',
      proficiency: 'REST, Streaming & Tool Use',
      context: 'Low-latency JSON schema endpoints, structured AI function calling, and resilient webhook architectures.',
      projectsUsed: ['AuraSpline AI', 'Jagireyy Job Coach', 'CineVault IMAX'],
    },
  ],
  journey: {
    kicker: 'Background & Story',
    headline: 'Where institutional rigor meets modern digital craft.',
    subtext: 'Having developed an analytical foundation through institutional operations, banking systems, and complex administrative workflows, I look at software through the lens of clarity, resilience, and human experience.',
    items: [
      {
        id: 'j1',
        kicker: 'Domain Foundation',
        kickerColor: 'text-cyan-400',
        title: 'Banking & Trade Finance Operations',
        desc: 'Managed letters of credit, risk evaluation, and multi-currency reconciliation under strict compliance.',
        quote: '"Instilled an uncompromising respect for data integrity, financial math, and error-handling resilience."',
      },
      {
        id: 'j2',
        kicker: 'Operations & Scale',
        kickerColor: 'text-amber-400',
        title: 'Examination Administration & Logistics',
        desc: 'Supervised synchronized assessment centers, chain-of-custody, and tabulated records.',
        quote: '"Sharpened systems-thinking for handling concurrency, fail-safe edge cases, and human-in-the-loop workflows."',
      },
      {
        id: 'j3',
        kicker: 'Institutional Practice',
        kickerColor: 'text-emerald-400',
        title: 'Administrative Coordination & Support',
        desc: 'Coordinated statutory reporting, vendor SLAs, and digital record archives.',
        quote: '"Developed empathy for everyday end-users and learned how thoughtfully designed software reduces administrative fatigue."',
      },
      {
        id: 'j4',
        kicker: 'Continuous Practice',
        kickerColor: 'text-purple-400',
        title: 'Independent Software & Data Engineering',
        desc: 'Crafting production-grade frontend architectures with Next.js, Three.js, GSAP, and Python data pipelines.',
        quote: '"The continuous convergence of deep domain experience with modern digital craft."',
      },
    ],
  },
  contact: {
    kicker: 'Direct Inquiries',
    headline: 'Have something interesting in mind?',
    subtext: 'Have a project, an idea, or an opportunity? I’d love to hear from you.',
    email: 'Sashwatdhakal224@gmail.com',
    location: 'Kathmandu, Nepal (UTC+05:45)',
    linkedinUrl: 'https://linkedin.com',
    githubUrl: 'https://github.com',
  },
  adminPasscode: 'sashwat2026',
};
