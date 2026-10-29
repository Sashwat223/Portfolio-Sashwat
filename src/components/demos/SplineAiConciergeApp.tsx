import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Send,
  Sparkles,
  Building2,
  UserCheck,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import {
  applyStudioEnvironment,
  cancelScheduledFrame,
  createStudioRenderer,
  scheduleNextFrame,
} from '../../utils/webgl';

interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  accentHex: string;
  services: { name: string; duration: string; price: string }[];
  greeting: string;
  quickPrompts: string[];
}

const BUSINESS_PROFILES: BusinessProfile[] = [
  {
    id: 'dental',
    name: 'Lumière Dental & Aesthetics',
    category: 'Healthcare & Clinic',
    accentHex: '#38BDF8',
    services: [
      { name: '3D Digital Smile Design Consult', duration: '45 min', price: '$120' },
      { name: 'Laser Whitening & Enamel Polish', duration: '60 min', price: '$280' },
      { name: ' Invisalign Ortho Scan', duration: '30 min', price: 'Complimentary' },
    ],
    greeting:
      'Welcome to Lumière Dental Studio. I can answer treatment questions, check Dr. Vance’s live schedule, or book your appointment in seconds.',
    quickPrompts: [
      'Book a 3D Smile Design consult tomorrow at 10:30 AM',
      'What are your prices and durations?',
      'Do you have afternoon slots on Friday?',
    ],
  },
  {
    id: 'saas',
    name: 'Vanguard Enterprise AI',
    category: 'B2B SaaS & Cloud',
    accentHex: '#A855F7',
    services: [
      { name: 'Executive Architecture Briefing', duration: '30 min', price: 'Free' },
      { name: 'Custom SOC2 Deployment Workshop', duration: '60 min', price: 'Enterprise' },
      { name: 'Live API Integration Sandbox', duration: '45 min', price: 'Free' },
    ],
    greeting:
      'Hello! I’m Vanguard’s autonomous concierge. Ask me about enterprise SLA compliance, pricing tiers, or lock in a live solutions engineering demo.',
    quickPrompts: [
      'Schedule an Architecture Briefing for tomorrow at 2:00 PM',
      'Tell me about SOC2 deployment and enterprise pricing',
      'What slots are open this Thursday?',
    ],
  },
  {
    id: 'architecture',
    name: 'Atelier Kengo Spatial Studio',
    category: 'Architecture & Interior',
    accentHex: '#F59E0B',
    services: [
      { name: 'Residential Concept Feasibility', duration: '60 min', price: '$250' },
      { name: 'Penthouse Materiality Review', duration: '45 min', price: '$180' },
      { name: '3D VR Walkthrough Session', duration: '30 min', price: 'Complimentary' },
    ],
    greeting:
      'Good day. Welcome to Atelier Kengo. I can share our portfolio lead times, fee structures, or reserve a private studio consultation.',
    quickPrompts: [
      'Book a 3D VR Walkthrough at 4:00 PM tomorrow',
      'How long does a residential feasibility study take?',
      'Show available morning appointments',
    ],
  },
];

export interface AppointmentSlot {
  id: string;
  dayLabel: string;
  dateStr: string;
  time: string;
  available: boolean;
}

const INITIAL_SLOTS: AppointmentSlot[] = [
  { id: 's1', dayLabel: 'Tomorrow', dateStr: 'Oct 29', time: '09:30 AM', available: true },
  { id: 's2', dayLabel: 'Tomorrow', dateStr: 'Oct 29', time: '10:30 AM', available: true },
  { id: 's3', dayLabel: 'Tomorrow', dateStr: 'Oct 29', time: '02:00 PM', available: true },
  { id: 's4', dayLabel: 'Tomorrow', dateStr: 'Oct 29', time: '04:00 PM', available: true },
  { id: 's5', dayLabel: 'Thursday', dateStr: 'Oct 30', time: '11:00 AM', available: true },
  { id: 's6', dayLabel: 'Thursday', dateStr: 'Oct 30', time: '03:30 PM', available: true },
  { id: 's7', dayLabel: 'Friday', dateStr: 'Oct 31', time: '10:00 AM', available: true },
  { id: 's8', dayLabel: 'Friday', dateStr: 'Oct 31', time: '01:30 PM', available: true },
];

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  latencyMs?: number;
  bookedSlot?: {
    service: string;
    dayLabel: string;
    dateStr: string;
    time: string;
    clientName: string;
    confirmationCode: string;
  };
}

export const SplineAiConciergeApp: React.FC<{ isExpanded?: boolean; onToggleExpand?: () => void }> = ({
  isExpanded = false,
  onToggleExpand,
}) => {
  const [selectedBiz, setSelectedBiz] = useState<BusinessProfile>(BUSINESS_PROFILES[0]);
  const [slots, setSlots] = useState<AppointmentSlot[]>(INITIAL_SLOTS);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('s2');
  const [selectedService, setSelectedService] = useState<string>(BUSINESS_PROFILES[0].services[0].name);
  const [clientName, setClientName] = useState<string>('Alex Rivera');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: BUSINESS_PROFILES[0].greeting,
      latencyMs: 320,
    },
  ]);
  const [input, setInput] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'booked'>('idle');
  const [bookedHistory, setBookedHistory] = useState<
    { code: string; business: string; service: string; when: string; client: string }[]
  >([
    {
      code: 'AP-8942',
      business: 'Lumière Dental & Aesthetics',
      service: 'Invisalign Ortho Scan',
      when: 'Today · 04:30 PM',
      client: 'Elena Rostova',
    },
  ]);

  const splineMountRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const aiStateRef = useRef(aiState);
  aiStateRef.current = aiState;
  const accentRef = useRef(selectedBiz.accentHex);
  accentRef.current = selectedBiz.accentHex;

  // Switch business persona
  const handleSelectBusiness = (biz: BusinessProfile) => {
    setSelectedBiz(biz);
    setSelectedService(biz.services[0].name);
    setAiState('idle');
    setMessages([
      {
        id: `init-${biz.id}-${Date.now()}`,
        role: 'assistant',
        text: biz.greeting,
        latencyMs: 290,
      },
    ]);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, aiState]);

  // 3D Spline-Style Reactive Glass & Iridescent Energy Core
  useEffect(() => {
    const container = splineMountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      36,
      (container.clientWidth || 360) / (container.clientHeight || 280),
      0.1,
      100
    );
    camera.position.set(0, 0, 6.2);

    const renderer = createStudioRenderer(container);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const envTex = applyStudioEnvironment(renderer, scene);

    const group = new THREE.Group();
    scene.add(group);

    // 1. Outer Spline Refractive Glass Shell
    const shellGeo = new THREE.IcosahedronGeometry(1.32, 6);
    const basePositions = shellGeo.attributes.position.array.slice() as Float32Array;
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.06,
      metalness: 0.1,
      transmission: 0.78,
      thickness: 1.6,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.85,
      iridescenceIOR: 1.35,
      envMapIntensity: 1.6,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    group.add(shellMesh);

    // 2. Inner Glowing Neural Plasma Core
    const coreGeo = new THREE.OctahedronGeometry(0.68, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentRef.current),
      emissive: new THREE.Color(accentRef.current),
      emissiveIntensity: 1.4,
      roughness: 0.18,
      metalness: 0.82,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // 3. Spline-Style Precision Orbital Rings
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.94,
      roughness: 0.14,
      clearcoat: 0.8,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.022, 20, 96), ringMat);
    ring1.rotation.x = Math.PI / 2.8;
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.014, 16, 96), ringMat);
    ring2.rotation.y = Math.PI / 3.2;
    ring2.rotation.x = -Math.PI / 4;
    group.add(ring2);

    // 4. Floating Satellite Nodes (Representing Calendar / CRM / Auto-Reply channels)
    const satellites: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const sat = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 24, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.3,
          roughness: 0.1,
          clearcoat: 1,
        })
      );
      group.add(sat);
      satellites.push(sat);
    }

    // Studio Lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x090d16, 1.2));
    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.2);
    rimLight.position.set(-4, -3, 4);
    scene.add(rimLight);

    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const frameHandle = { id: 0, isTimeout: false };

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const t = clock.getElapsedTime();

      const stateMultiplier =
        aiStateRef.current === 'thinking' ? 2.8 : aiStateRef.current === 'booked' ? 1.8 : 1.0;

      // Update core color smoothly
      const targetColor = new THREE.Color(
        aiStateRef.current === 'booked' ? '#10B981' : accentRef.current
      );
      coreMat.color.lerp(targetColor, dt * 4);
      coreMat.emissive.lerp(targetColor, dt * 4);
      coreMat.emissiveIntensity =
        aiStateRef.current === 'thinking'
          ? 2.2 + Math.sin(t * 10) * 0.6
          : 1.35 + Math.sin(t * 2.5) * 0.25;

      // Organic Spline vertex morphing on the glass shell
      const posAttr = shellGeo.attributes.position as THREE.BufferAttribute;
      const morphAmp = aiStateRef.current === 'thinking' ? 0.11 : 0.045;
      const morphFreq = aiStateRef.current === 'thinking' ? 4.2 : 1.8;

      for (let i = 0; i < posAttr.count; i++) {
        const bx = basePositions[i * 3];
        const by = basePositions[i * 3 + 1];
        const bz = basePositions[i * 3 + 2];
        const wave =
          Math.sin(bx * 2.5 + t * morphFreq) *
          Math.cos(by * 2.5 + t * morphFreq) *
          morphAmp;
        const scale = 1 + wave;
        posAttr.setXYZ(i, bx * scale, by * scale, bz * scale);
      }
      posAttr.needsUpdate = true;

      group.rotation.y += dt * 0.45 * stateMultiplier;
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, pointerY * 0.35, 4, dt);
      group.rotation.z = THREE.MathUtils.damp(group.rotation.z, -pointerX * 0.35, 4, dt);

      ring1.rotation.z += dt * 0.6 * stateMultiplier;
      ring2.rotation.x -= dt * 0.45 * stateMultiplier;

      satellites.forEach((sat, idx) => {
        const angle = t * (0.9 + idx * 0.2) + (idx * Math.PI) / 2;
        const r = 1.9 + (idx % 2) * 0.25;
        sat.position.set(
          Math.cos(angle) * r,
          Math.sin(angle * 1.3) * 0.75,
          Math.sin(angle) * r
        );
      });

      renderer.render(scene, camera);
      scheduleNextFrame(renderer, tick, frameHandle);
    };

    tick();

    return () => {
      cancelScheduledFrame(frameHandle);
      container.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  const executeBooking = (slot: AppointmentSlot, serviceName: string, customer: string) => {
    const code = `AS-${Math.floor(1000 + Math.random() * 9000)}`;
    setSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, available: false } : s))
    );
    setBookedHistory((prev) => [
      {
        code,
        business: selectedBiz.name,
        service: serviceName,
        when: `${slot.dayLabel} (${slot.dateStr}) · ${slot.time}`,
        client: customer || 'Guest Client',
      },
      ...prev,
    ]);
    setAiState('booked');
    return code;
  };

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || aiState === 'thinking') return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput('');
    setAiState('thinking');

    const startTime = performance.now();

    try {
      const availableSlots = slots.filter((s) => s.available);
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          business: selectedBiz,
          availableSlots,
          clientName,
          selectedService,
        }),
      });

      const latencyMs = Math.max(240, Math.round(performance.now() - startTime));

      if (res.ok) {
        const data = await res.json();
        let bookedSlotData: ChatMessage['bookedSlot'] | undefined;

        if (data.bookedSlotId) {
          const matchedSlot =
            slots.find((s) => s.id === data.bookedSlotId && s.available) ||
            availableSlots[0];
          if (matchedSlot) {
            const serviceUsed = data.serviceName || selectedService;
            const code = executeBooking(matchedSlot, serviceUsed, clientName);
            bookedSlotData = {
              service: serviceUsed,
              dayLabel: matchedSlot.dayLabel,
              dateStr: matchedSlot.dateStr,
              time: matchedSlot.time,
              clientName: clientName || 'Alex Rivera',
              confirmationCode: code,
            };
          }
        } else {
          setAiState('idle');
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.reply,
            latencyMs,
            bookedSlot: bookedSlotData,
          },
        ]);
        return;
      }
    } catch {
      // Fallback handled cleanly below
    }

    // Intelligent deterministic local concierge response if server API key isn't set
    const lower = textToSend.toLowerCase();
    const openSlots = slots.filter((s) => s.available);
    const latencyMs = Math.round(310 + Math.random() * 190);

    if (
      lower.includes('book') ||
      lower.includes('schedule') ||
      lower.includes('reserve') ||
      lower.includes('10:30') ||
      lower.includes('2:00') ||
      lower.includes('4:00')
    ) {
      const targetSlot =
        openSlots.find((s) => lower.includes(s.time.split(' ')[0].toLowerCase())) ||
        openSlots.find((s) => s.id === selectedSlotId) ||
        openSlots[0];

      if (targetSlot) {
        const code = executeBooking(targetSlot, selectedService, clientName);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: `Done! I have reserved your ${selectedService} with ${selectedBiz.name} for ${targetSlot.dayLabel} (${targetSlot.dateStr}) at ${targetSlot.time}. Your calendar invite and confirmation pass (${code}) are ready below.`,
            latencyMs,
            bookedSlot: {
              service: selectedService,
              dayLabel: targetSlot.dayLabel,
              dateStr: targetSlot.dateStr,
              time: targetSlot.time,
              clientName: clientName || 'Alex Rivera',
              confirmationCode: code,
            },
          },
        ]);
      } else {
        setAiState('idle');
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: 'All immediate slots are currently booked. Click Reset Schedule to open fresh availability.',
            latencyMs,
          },
        ]);
      }
    } else if (lower.includes('price') || lower.includes('cost') || lower.includes('service') || lower.includes('long')) {
      setAiState('idle');
      const serviceSummary = selectedBiz.services
        .map((s) => `${s.name} (${s.duration} — ${s.price})`)
        .join(' · ');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `Here are the current offerings at ${selectedBiz.name}: ${serviceSummary}. Would you like me to lock in a time slot for any of these?`,
          latencyMs,
        },
      ]);
    } else {
      setAiState('idle');
      const nextThree = openSlots
        .slice(0, 3)
        .map((s) => `${s.dayLabel} at ${s.time}`)
        .join(', ');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `We have immediate openings for ${selectedBiz.name}: ${nextThree || 'upon request'}. Tell me which time works best or click a slot on the schedule panel to confirm immediately.`,
          latencyMs,
        },
      ]);
    }
  };

  const handleManualQuickBook = () => {
    const slot = slots.find((s) => s.id === selectedSlotId && s.available) || slots.find((s) => s.available);
    if (!slot) return;
    handleSendMessage(`Book ${selectedService} for ${slot.dayLabel} (${slot.dateStr}) at ${slot.time}`);
  };

  return (
    <div className="w-full rounded-2xl bg-[#090A0F] border border-white/10 text-zinc-100 overflow-hidden shadow-2xl">
      {/* Top Application Header Bar */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#10121A] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-serif italic text-xl text-white">AuraSpline 3D</span>
          <span className="text-zinc-600">·</span>
          <span className="font-mono text-[11px] text-cyan-400 uppercase tracking-wider">
            Autonomous Business Concierge & Scheduler
          </span>
        </div>

        {/* Business Vertical Switcher */}
        <div className="flex items-center gap-1.5 bg-[#07080C] p-1 rounded-xl border border-white/[0.06]">
          {BUSINESS_PROFILES.map((biz) => (
            <button
              key={biz.id}
              type="button"
              onClick={() => handleSelectBusiness(biz)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-medium transition-all whitespace-nowrap shrink-0 ${
                selectedBiz.id === biz.id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {biz.name.split(' ')[0]}
            </button>
          ))}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="ml-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-cyan-400 hover:bg-white/5 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>{isExpanded ? 'Compact' : 'Fullscreen App'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3-Column Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Spline 3D Reactive AI Core & Telemetry */}
        <div className="lg:col-span-4 p-5 border-b lg:border-b-0 lg:border-r border-white/[0.06] flex flex-col justify-between bg-gradient-to-b from-[#0C0E17] to-[#08090E]">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="inline-flex items-center gap-1.5 text-white font-medium">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              {selectedBiz.name}
            </span>
            <span className="text-[11px] text-zinc-500">{selectedBiz.category}</span>
          </div>

          {/* 3D Spline WebGL Canvas */}
          <div
            ref={splineMountRef}
            className="w-full h-56 sm:h-64 my-2 cursor-grab active:cursor-grabbing"
            title="Interactive 3D Spline Neural Core — Move cursor to tilt"
          />

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-zinc-400">AI Core State</span>
              <span
                className={
                  aiState === 'thinking'
                    ? 'text-amber-400'
                    : aiState === 'booked'
                    ? 'text-emerald-400'
                    : 'text-cyan-400'
                }
              >
                {aiState === 'thinking'
                  ? 'Synthesizing & Checking Calendar...'
                  : aiState === 'booked'
                  ? 'Slot Locked & Verified'
                  : 'Ready · <0.5s SLA'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                Live Confirmed Queue ({bookedHistory.length})
              </div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {bookedHistory.slice(0, 2).map((b) => (
                  <div
                    key={b.code}
                    className="flex items-center justify-between text-xs font-sans text-zinc-300"
                  >
                    <span className="truncate max-w-[160px]">{b.service}</span>
                    <span className="font-mono text-[11px] text-emerald-400 shrink-0">
                      {b.when.split('·')[1] || b.when}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Instant AI Customer Concierge Chat */}
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-[#090A0F]">
          <div
            ref={chatScrollRef}
            className="p-4 sm:p-5 space-y-3.5 h-80 sm:h-96 overflow-y-auto"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-white text-black font-medium'
                      : 'bg-[#131520] text-zinc-200 border border-white/[0.07]'
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.bookedSlot && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          CONFIRMED APPOINTMENT
                        </span>
                        <span>#{msg.bookedSlot.confirmationCode}</span>
                      </div>
                      <div className="text-xs font-medium text-white">
                        {msg.bookedSlot.service}
                      </div>
                      <div className="text-[11px] text-emerald-300/90 font-mono">
                        {msg.bookedSlot.dayLabel}, {msg.bookedSlot.dateStr} at{' '}
                        {msg.bookedSlot.time} · {msg.bookedSlot.clientName}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'assistant' && msg.latencyMs && (
                  <span className="mt-1 text-[10px] font-mono text-zinc-500">
                    Responded in {(msg.latencyMs / 1000).toFixed(2)}s · Auto-Schedule Sync
                  </span>
                )}
              </div>
            ))}

            {aiState === 'thinking' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#131520] border border-white/[0.07] text-xs font-mono text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Checking live schedule & drafting response...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Suggestions & Input Box */}
          <div className="p-3.5 bg-[#0D0F17] border-t border-white/[0.06] space-y-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {selectedBiz.quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(qp)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.07] text-[11px] text-zinc-300 whitespace-nowrap shrink-0 transition-colors"
                >
                  {qp}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question or say 'Book tomorrow at 2:00 PM'..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/[0.08] text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={aiState === 'thinking'}
                className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-medium text-xs inline-flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Direct Appointment & Schedule Booker */}
        <div className="lg:col-span-3 p-4 sm:p-5 bg-[#0C0E16] flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Live Schedule
              </span>
              <button
                type="button"
                onClick={() => {
                  setSlots(INITIAL_SLOTS);
                  setAiState('idle');
                }}
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
                title="Reset all slots"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Client Name */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Client Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#141724] border border-white/[0.07] text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <UserCheck className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
              </div>
            </div>

            {/* Service Selector */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Select Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-[#141724] border border-white/[0.07] text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {selectedBiz.services.map((s) => (
                  <option key={s.name} value={s.name} className="bg-[#141724] text-white">
                    {s.name} ({s.duration} · {s.price})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slots Grid */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                Available Time Slots
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      !slot.available
                        ? 'bg-zinc-900/40 border-white/[0.03] text-zinc-600 line-through cursor-not-allowed'
                        : selectedSlotId === slot.id
                        ? 'bg-cyan-400/15 border-cyan-400 text-white'
                        : 'bg-[#141724] border-white/[0.06] text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-zinc-400">
                      {slot.dayLabel} · {slot.dateStr}
                    </div>
                    <div className="text-xs font-mono font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{slot.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualQuickBook}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-sans font-semibold text-xs uppercase tracking-wider transition-all shadow-lg"
          >
            Instant Book Selected Slot
          </button>
        </div>
      </div>
    </div>
  );
};
