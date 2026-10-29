import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ExternalLink,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  BarChart3,
  Layers,
  Eye,
} from 'lucide-react';
import {
  applyStudioEnvironment,
  cancelScheduledFrame,
  createStudioRenderer,
  scheduleNextFrame,
} from '../../utils/webgl';

// 1. TRITON 3D INTERACTIVE SHOWCASE (https://triton-ruby.vercel.app/)
export const TritonInteractivePreview: React.FC<{ liveUrl?: string }> = ({
  liveUrl = 'https://triton-ruby.vercel.app/',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [finish, setFinish] = useState<'titanium' | 'ruby' | 'obsidian'>('ruby');
  const [exploded, setExploded] = useState<number>(0);
  const [showIframe, setShowIframe] = useState<boolean>(false);

  const finishRef = useRef(finish);
  finishRef.current = finish;
  const explodedRef = useRef(exploded);
  explodedRef.current = exploded;

  useEffect(() => {
    if (showIframe) return;
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      35,
      (container.clientWidth || 480) / (container.clientHeight || 300),
      0.1,
      100
    );
    camera.position.set(0, 0.8, 5.8);
    camera.lookAt(0, 0, 0);

    const renderer = createStudioRenderer(container);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const envTex = applyStudioEnvironment(renderer, scene);

    const root = new THREE.Group();
    scene.add(root);

    // Primary Core Torus Knot (Triton signature sculptural turbine)
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      metalness: 0.88,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.4,
      envMapIntensity: 1.7,
    });
    const coreGeo = new THREE.TorusKnotGeometry(0.88, 0.26, 160, 32, 2, 3);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    root.add(coreMesh);

    // Secondary Precision Outer Turbine Ring
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.96,
      roughness: 0.16,
      clearcoat: 0.8,
    });
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.04, 24, 96), ringMat);
    outerRing.rotation.x = Math.PI / 3;
    root.add(outerRing);

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.025, 20, 96), ringMat);
    innerRing.rotation.y = Math.PI / 4;
    root.add(innerRing);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x090a0f, 1.2));
    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);

    const rubyLight = new THREE.DirectionalLight(0xf43f5e, 2.4);
    rubyLight.position.set(-5, -4, 4);
    scene.add(rubyLight);

    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener('pointermove', onPointerMove);

    const clock = new THREE.Clock();
    const frameHandle = { id: 0, isTimeout: false };

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const targetHex =
        finishRef.current === 'ruby'
          ? 0xe11d48
          : finishRef.current === 'titanium'
          ? 0x38bdf8
          : 0x1e293b;
      coreMat.color.lerp(new THREE.Color(targetHex), dt * 5);

      const expScale = 1 + explodedRef.current * 0.35;
      outerRing.scale.setScalar(THREE.MathUtils.damp(outerRing.scale.x, expScale, 5, dt));
      innerRing.scale.setScalar(
        THREE.MathUtils.damp(innerRing.scale.x, 1 + explodedRef.current * 0.18, 5, dt)
      );

      coreMesh.rotation.y += dt * 0.55;
      coreMesh.rotation.x += dt * 0.25;
      outerRing.rotation.z -= dt * 0.4;
      innerRing.rotation.x += dt * 0.5;

      root.rotation.y = THREE.MathUtils.damp(root.rotation.y, pointerX * 0.5, 4, dt);
      root.rotation.x = THREE.MathUtils.damp(root.rotation.x, pointerY * 0.35, 4, dt);

      renderer.render(scene, camera);
      scheduleNextFrame(renderer, tick, frameHandle);
    };

    tick();

    return () => {
      cancelScheduledFrame(frameHandle);
      container.removeEventListener('pointermove', onPointerMove);
      envTex.dispose();
      renderer.dispose();
    };
  }, [showIframe]);

  return (
    <div className="relative rounded-2xl bg-[#08090E] border border-white/[0.08] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#0E1018] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-rose-400 font-semibold">TRITON WEBGL</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 text-[11px]">triton-ruby.vercel.app</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowIframe((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-[11px] inline-flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>{showIframe ? '3D Shader View' : 'Live Site Preview'}</span>
          </button>
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-white text-black font-medium text-[11px] inline-flex items-center gap-1 hover:bg-zinc-200 transition-colors"
          >
            <span>Open Live</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {showIframe ? (
        <div className="w-full h-72 sm:h-80 bg-black relative">
          <iframe
            src={liveUrl}
            title="Triton Live Production Preview"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="relative">
          <div ref={mountRef} className="w-full h-64 sm:h-72 cursor-grab active:cursor-grabbing" />

          {/* Bottom Unified Dock for Material Finish & Exploded View */}
          <div className="px-4 py-3 bg-[#0D0F17]/95 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {(['ruby', 'titanium', 'obsidian'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFinish(f)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] uppercase transition-all ${
                    finish === f
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ring Expansion</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={exploded}
                onChange={(e) => setExploded(parseFloat(e.target.value))}
                className="w-20 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. JAGIREYY JOB COACH SHOWCASE (https://jagireyy.ai.studio/)
export const JagireyyInteractivePreview: React.FC<{ liveUrl?: string }> = ({
  liveUrl = 'https://jagireyy.ai.studio/',
}) => {
  const [roleTarget, setRoleTarget] = useState<'frontend' | 'data' | 'product'>('frontend');
  const [optimized, setOptimized] = useState<boolean>(false);

  const roleData = {
    frontend: {
      title: 'Senior Frontend & 3D WebGL Engineer',
      atsBefore: 68,
      atsAfter: 94,
      beforeBullet:
        'Built web pages and 3D animations using React and Three.js for client dashboards.',
      afterBullet:
        'Architected a 60 FPS WebGL & React 19 spatial interface using custom PBR shaders and instanced geometry, reducing TTI by 42%.',
      skills: [
        { name: 'TypeScript & React 19', match: 98 },
        { name: 'Three.js / GLSL Shaders', match: 95 },
        { name: 'Core Web Vitals & Frame Pacing', match: 91 },
      ],
    },
    data: {
      title: 'Quantitative Data & FinTech Analyst',
      atsBefore: 71,
      atsAfter: 96,
      beforeBullet: 'Analyzed financial data in Python and created reports for banking teams.',
      afterBullet:
        'Engineered an automated Python & pandas credit-distress pipeline across 12,000+ commercial ledgers, achieving 92% recall on early default signals.',
      skills: [
        { name: 'Python / pandas / NumPy', match: 97 },
        { name: 'Financial Risk Modeling', match: 94 },
        { name: 'SQL Window Reconciliation', match: 92 },
      ],
    },
    product: {
      title: 'AI Product Engineer',
      atsBefore: 64,
      atsAfter: 93,
      beforeBullet: 'Integrated LLM chatbots and scheduling tools into web apps.',
      afterBullet:
        'Launched an autonomous Gemini function-calling concierge handling live calendar triage with sub-0.8s latency and 38% higher booking conversion.',
      skills: [
        { name: 'Gemini SDK & Tool Calling', match: 96 },
        { name: 'Full-Stack Next.js / Express', match: 93 },
        { name: 'UX Conversion Telemetry', match: 89 },
      ],
    },
  }[roleTarget];

  return (
    <div className="rounded-2xl bg-[#090B12] border border-white/[0.08] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#0F121D] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold">JAGIREYY AI COACH</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 text-[11px]">jagireyy.ai.studio</span>
        </div>

        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 rounded-lg bg-white text-black font-medium text-[11px] inline-flex items-center gap-1 hover:bg-zinc-200 transition-colors"
        >
          <span>Launch Jagireyy</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="p-5 space-y-4">
        {/* Role Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {(['frontend', 'data', 'product'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRoleTarget(r);
                  setOptimized(false);
                }}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] uppercase transition-all ${
                  roleTarget === r
                    ? 'bg-cyan-400 text-black font-semibold'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                }`}
              >
                {r} Track
              </button>
            ))}
          </div>

          <div className="font-mono text-xs">
            <span className="text-zinc-400">ATS Alignment: </span>
            <span
              className={`font-semibold tabular-nums ${
                optimized ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {optimized ? roleData.atsAfter : roleData.atsBefore}%
            </span>
          </div>
        </div>

        {/* Resume Bullet Transformation Box */}
        <div className="p-4 rounded-xl bg-[#111522] border border-white/[0.07] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Target: {roleData.title}</span>
            <span className={optimized ? 'text-emerald-400' : 'text-zinc-500'}>
              {optimized ? '✓ Quantified Impact Applied' : 'Draft Bullet'}
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-zinc-100 leading-relaxed">
            "{optimized ? roleData.afterBullet : roleData.beforeBullet}"
          </p>
          <button
            type="button"
            onClick={() => setOptimized((v) => !v)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] inline-flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{optimized ? 'View Original Draft' : 'Simulate Jagireyy AI Rewrite'}</span>
          </button>
        </div>

        {/* Semantic Skill Gap Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {roleData.skills.map((sk) => (
            <div
              key={sk.name}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                <span className="text-zinc-300 truncate pr-1">{sk.name}</span>
                <span className="text-cyan-400 tabular-nums">{sk.match}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${sk.match}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 3. FINGUARD AI & ANALYTICS INTERACTIVE COCKPIT
export const FinGuardInteractivePreview: React.FC<{ isAnalytics?: boolean }> = ({
  isAnalytics = false,
}) => {
  const [stressFactor, setStressFactor] = useState<number>(1.0);
  const [activeSector, setActiveSector] = useState<'all' | 'manufacturing' | 'retail'>('all');

  const metrics = isAnalytics
    ? [
        { label: 'Records Reconciled', val: Math.round(48200 * stressFactor).toLocaleString() },
        { label: 'SLA Compliance', val: `${Math.min(99.9, (98.4 / stressFactor)).toFixed(1)}%` },
        { label: 'Anomaly Recall', val: '96.4%' },
      ]
    : [
        { label: 'Altman Z-Score Mean', val: (2.84 / stressFactor).toFixed(2) },
        { label: 'Distress Recall', val: '92.4%' },
        { label: 'Liquidity Coverage', val: `${Math.round(142 / stressFactor)}%` },
      ];

  const bars = [64, 78, 52, 88, 94, 72, 85, 91].map((b) =>
    Math.min(100, Math.max(18, Math.round(b / (stressFactor * 0.85))))
  );

  return (
    <div className="rounded-2xl bg-[#090B11] border border-white/[0.08] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          {isAnalytics ? (
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-white font-medium">
            {isAnalytics ? 'INSTITUTIONAL TELEMETRY ENGINE' : 'FINGUARD SOLVENCY SIMULATOR'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'manufacturing', 'retail'] as const).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSector(sec)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase transition-all ${
                activeSector === sec
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="p-3 rounded-xl bg-[#111420] border border-white/[0.05]"
          >
            <div className="text-[10px] font-mono text-zinc-400">{m.label}</div>
            <div className="text-base sm:text-lg font-mono font-semibold text-white mt-0.5 tabular-nums">
              {m.val}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Bar Distribution */}
      <div className="p-4 rounded-xl bg-[#0D1019] border border-white/[0.05] space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Quarterly Portfolio Resilience ({activeSector.toUpperCase()})</span>
          <span className="text-cyan-400">Rate Shock: {stressFactor.toFixed(2)}x</span>
        </div>
        <div className="h-24 flex items-end gap-2 pt-2">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-cyan-500/40 to-cyan-400 transition-all duration-300"
                style={{ height: `${h}%` }}
              />
              <span className="text-[9px] font-mono text-zinc-500">Q{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="font-mono text-[11px] text-zinc-400">Macro Stress Multiplier</span>
          <input
            type="range"
            min={0.8}
            max={1.5}
            step={0.05}
            value={stressFactor}
            onChange={(e) => setStressFactor(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
