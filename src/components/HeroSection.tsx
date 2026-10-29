import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PortfolioConfig } from '../data/portfolioData';
import { HERO_FRAME_URLS } from '../data/heroFrames';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  config: PortfolioConfig['hero'];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ config }) => {
  const heroPinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textBlockRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const pctTextRef = useRef<HTMLSpanElement>(null);
  const rimIntensityRef = useRef(config.rimLightIntensity);
  rimIntensityRef.current = config.rimLightIntensity;

  const [loadedFramesCount, setLoadedFramesCount] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const pinTarget = heroPinRef.current;
    if (!canvas || !pinTarget) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalFrames = HERO_FRAME_URLS.length;
    const heroFrames: (HTMLImageElement | null)[] = new Array(totalFrames).fill(null);
    const loadedFlags: boolean[] = new Array(totalFrames).fill(false);

    const playhead = { frame: 0, progress: 0 };
    let isDisposed = false;

    const findNearestLoadedImage = (targetIdx: number): HTMLImageElement | null => {
      const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(targetIdx)));
      if (loadedFlags[clamped] && heroFrames[clamped]) {
        return heroFrames[clamped];
      }
      for (let offset = 1; offset < totalFrames; offset++) {
        const prev = clamped - offset;
        if (prev >= 0 && loadedFlags[prev] && heroFrames[prev]) {
          return heroFrames[prev];
        }
        const next = clamped + offset;
        if (next < totalFrames && loadedFlags[next] && heroFrames[next]) {
          return heroFrames[next];
        }
      }
      return null;
    };

    const drawFrame = (frameIdx: number) => {
      if (isDisposed || !canvas) return;
      const img = findNearestLoadedImage(frameIdx);
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#070709';
      ctx.fillRect(0, 0, w, h);

      const normProg = Math.max(0, Math.min(1, frameIdx / Math.max(1, totalFrames - 1)));
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const isNarrow = window.innerWidth < 1024;

      let dw: number, dh: number, dx: number, dy: number;
      if (isNarrow) {
        dh = h * 0.64;
        dw = dh * imgRatio;
        dx = (w - dw) / 2;
        dy = h - dh;
      } else {
        // Frame full upper body + clasped Namaste hands clearly without bottom clipping
        dh = h * 0.98;
        dw = dh * imgRatio;
        // Shift smoothly from right-of-text (0.56) to center-stage (0.50) as Namaste plays
        const centerFactor = 0.56 - Math.min(1, normProg * 1.6) * 0.06;
        dx = w * centerFactor - dw * 0.5;
        dy = h - dh;
      }

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, dx, dy, dw, dh);

      // Sub-frame blend with next loaded frame for ultra-smooth 60fps motion
      const lowerIdx = Math.floor(frameIdx);
      const upperIdx = Math.min(totalFrames - 1, lowerIdx + 1);
      const frac = frameIdx - lowerIdx;
      if (frac > 0.05 && upperIdx !== lowerIdx && loadedFlags[upperIdx] && heroFrames[upperIdx]) {
        const nextImg = heroFrames[upperIdx]!;
        if (nextImg.complete && nextImg.naturalWidth > 0) {
          ctx.globalAlpha = frac;
          ctx.drawImage(nextImg, dx, dy, dw, dh);
          ctx.globalAlpha = 1;
        }
      }

      // Studio feathering into #070709 — softens as text fades so Namaste gesture is unobstructed
      if (!isNarrow) {
        const leftFadeWidth = w * (0.43 - Math.min(1, normProg * 1.5) * 0.14);
        const leftFade = ctx.createLinearGradient(0, 0, leftFadeWidth, 0);
        leftFade.addColorStop(0, '#070709');
        leftFade.addColorStop(0.62, `rgba(7, 7, 9, ${0.92 - normProg * 0.35})`);
        leftFade.addColorStop(1, 'rgba(7, 7, 9, 0)');
        ctx.fillStyle = leftFade;
        ctx.fillRect(0, 0, leftFadeWidth, h);

        const topFade = ctx.createLinearGradient(0, 0, 0, h * 0.12);
        topFade.addColorStop(0, '#070709');
        topFade.addColorStop(1, 'rgba(7, 7, 9, 0)');
        ctx.fillStyle = topFade;
        ctx.fillRect(0, 0, w, h * 0.12);

        const btmFade = ctx.createLinearGradient(0, h * 0.93, 0, h);
        btmFade.addColorStop(0, 'rgba(7, 7, 9, 0)');
        btmFade.addColorStop(1, '#070709');
        ctx.fillStyle = btmFade;
        ctx.fillRect(0, h * 0.93, w, h * 0.07);
      } else {
        const topFade = ctx.createLinearGradient(0, 0, 0, h * 0.4);
        topFade.addColorStop(0, '#070709');
        topFade.addColorStop(0.68, 'rgba(7, 7, 9, 0.84)');
        topFade.addColorStop(1, 'rgba(7, 7, 9, 0)');
        ctx.fillStyle = topFade;
        ctx.fillRect(0, 0, w, h * 0.4);
      }

      // Subtle warm/cyan rim aura that intensifies as Namaste gesture converges
      const rimStrength = rimIntensityRef.current;
      if (normProg > 0.02 && rimStrength > 0) {
        const rimAlpha = Math.sin(normProg * Math.PI) * 0.14 * rimStrength;
        const rimGrad = ctx.createRadialGradient(
          dx + dw * 0.5,
          dy + dh * 0.58,
          w * 0.02,
          dx + dw * 0.5,
          dy + dh * 0.58,
          h * 0.44
        );
        rimGrad.addColorStop(0, `rgba(245, 158, 11, ${rimAlpha})`);
        rimGrad.addColorStop(0.5, `rgba(56, 189, 248, ${rimAlpha * 0.65})`);
        rimGrad.addColorStop(1, 'rgba(7, 7, 9, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = rimGrad;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();
    };

    const resizeCanvas = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      drawFrame(playhead.frame);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Multi-pass priority frame preloader so full 0..298 Namaste scrub is ready almost immediately
    let loadedCounter = 0;
    const loadSingleFrame = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (isDisposed || loadedFlags[index]) {
          resolve();
          return;
        }
        const img = new Image();
        img.decoding = 'async';
        img.src = HERO_FRAME_URLS[index];
        img.onload = () => {
          if (isDisposed) {
            resolve();
            return;
          }
          heroFrames[index] = img;
          loadedFlags[index] = true;
          loadedCounter++;
          if (index === 0 || Math.abs(index - playhead.frame) <= 8) {
            drawFrame(playhead.frame);
          }
          if (loadedCounter % 25 === 0 || loadedCounter === totalFrames) {
            setLoadedFramesCount(loadedCounter);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    const preloadAllFrames = async () => {
      // Pass 0: Frame 0 for instant initial render
      await loadSingleFrame(0);
      drawFrame(0);

      // Pass 1: 30 evenly spaced keyframes across the ENTIRE 0..298 Namaste sequence concurrently
      const coarseKeyframes: number[] = [];
      for (let i = 0; i < totalFrames; i += 10) {
        coarseKeyframes.push(i);
      }
      if (!coarseKeyframes.includes(totalFrames - 1)) {
        coarseKeyframes.push(totalFrames - 1);
      }
      await Promise.all(coarseKeyframes.map((idx) => loadSingleFrame(idx)));
      drawFrame(playhead.frame);

      // Pass 2: Every 3rd frame in fast concurrent batches
      const mediumKeyframes: number[] = [];
      const fineFrames: number[] = [];
      for (let i = 1; i < totalFrames; i++) {
        if (loadedFlags[i]) continue;
        if (i % 3 === 0) {
          mediumKeyframes.push(i);
        } else {
          fineFrames.push(i);
        }
      }

      const batchLoad = async (indices: number[], batchSize: number) => {
        for (let i = 0; i < indices.length; i += batchSize) {
          if (isDisposed) return;
          const batch = indices.slice(i, i + batchSize);
          await Promise.all(batch.map((idx) => loadSingleFrame(idx)));
        }
      };

      await batchLoad(mediumKeyframes, 30);
      await batchLoad(fineFrames, 40);
    };

    preloadAllFrames();

    // GSAP ScrollTrigger Pin + Frame Scrubber:
    // Pins the hero section at top of viewport, plays all 299 frames of the Namaste animation on scroll,
    // and once completed at 100%, unpins and moves down to the Atmosphere section.
    const gsapCtx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinTarget,
          pin: true,
          start: 'top top',
          end: '+=240%',
          scrub: 0.25,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const pct = Math.round(self.progress * 100);
            if (pctTextRef.current) {
              pctTextRef.current.textContent = `${pct}%`;
            }
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${self.progress * 100}%`;
            }
            playhead.progress = self.progress;
            playhead.frame = self.progress * (totalFrames - 1);
            drawFrame(playhead.frame);
          },
        },
      });

      // Scrub playhead across all 299 frames over normalized timeline duration [0 -> 1]
      tl.to(
        playhead,
        {
          frame: totalFrames - 1,
          duration: 1,
          ease: 'none',
          onUpdate: () => {
            drawFrame(playhead.frame);
          },
        },
        0
      );

      // Smoothly lift and fade out the left intro typography so the Namaste gesture takes center stage
      if (textBlockRef.current) {
        tl.to(
          textBlockRef.current,
          {
            y: -72,
            opacity: 0,
            ease: 'power2.out',
            duration: 0.42,
          },
          0.04
        );
      }
    }, pinTarget);

    // Refresh ScrollTrigger once fonts & layout settle
    const refreshTimer = window.setTimeout(() => {
      if (!isDisposed) {
        ScrollTrigger.refresh();
      }
    }, 250);

    return () => {
      isDisposed = true;
      window.clearTimeout(refreshTimer);
      window.removeEventListener('resize', resizeCanvas);
      gsapCtx.revert();
    };
  }, []);

  // Redraw when rimLightIntensity changes in CMS
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [config.rimLightIntensity]);

  const handleScrollDownPrompt = () => {
    const scrollTarget = window.innerHeight * 2.45;
    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth',
    });
  };

  return (
    <section id="hero" className="relative w-full bg-[#070709]">
      <div
        ref={heroPinRef}
        className="relative w-full h-[100svh] overflow-hidden bg-[#070709] flex items-center"
      >
        {/* Subtle Blue and Amber Ambient Studio Lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[650px] h-[650px] rounded-full bg-[#1e40af] opacity-[0.14] blur-[170px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-[#d97706] opacity-[0.12] blur-[160px]" />
        </div>

        {/* Dominant Full-Screen Portrait Canvas (299-Frame GSAP Scroll Scrubber) */}
        <canvas
          id="hero-canvas"
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Editorial Typography Beside Portrait */}
        <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 flex flex-col justify-start lg:justify-between pt-20 sm:pt-24 pb-8 sm:py-16 pointer-events-none">
          <div className="hidden lg:block h-10" />

          <div
            id="hero-text-block"
            ref={textBlockRef}
            className="max-w-xl flex flex-col justify-start pointer-events-auto will-change-transform"
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-5">
              <span className="type-kicker text-cyan-400">
                {config.kicker.replace(/^\/?\d+\s*[—\-·/]+\s*/i, '')}
              </span>
            </div>

            <h1 className="text-balance mb-5 sm:mb-7">
              <span className="block type-hero-greeting !text-white">
                {config.greeting}
              </span>
              <span className="block type-hero-name-light !text-zinc-300 mt-1.5 sm:mt-2">
                {config.firstName}
              </span>
              <span className="block type-hero-name-bold !text-white mt-0.5">
                {config.lastName}
              </span>
            </h1>

            <p className="type-body-lead !text-zinc-300 max-w-[340px] sm:max-w-[46ch] mb-6 sm:mb-9">
              {config.bio}
            </p>

            <div className="flex items-center gap-3.5 sm:gap-4">
              <a
                href="#atmosphere"
                className="type-nav-button px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-white !text-black hover:bg-zinc-200 transition-all shadow-xl inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>{config.primaryCtaText}</span>
                <span aria-hidden="true">↓</span>
              </a>
              <a
                href="#work"
                className="type-nav-button px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-white/[0.08] backdrop-blur-xl !text-white hover:bg-white/[0.15] transition-all whitespace-nowrap shrink-0"
              >
                {config.secondaryCtaText}
              </a>
            </div>
          </div>

          <div className="mt-auto lg:mt-0 flex items-center justify-between pt-4 sm:pt-6 text-xs text-zinc-400 pointer-events-auto">
            <button
              type="button"
              onClick={handleScrollDownPrompt}
              className="flex items-center gap-3 text-left group cursor-pointer"
              title="Scroll down to play Namaste greeting animation"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="type-kicker !text-zinc-300 group-hover:!text-white transition-colors">
                {config.scrollPrompt}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <span
                ref={pctTextRef}
                className="text-xs font-medium !text-zinc-300 tabular-nums"
                title={`${loadedFramesCount}/${HERO_FRAME_URLS.length} frames ready`}
              >
                0%
              </span>
              <div className="w-24 sm:w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  ref={progressBarRef}
                  className="h-full bg-cyan-400 transition-none"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
