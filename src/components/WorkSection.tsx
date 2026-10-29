import React, { useState } from 'react';
import { ExternalLink, X, CheckCircle2, Maximize2 } from 'lucide-react';
import { WorkProject } from '../data/portfolioData';
import { SplineAiConciergeApp } from './demos/SplineAiConciergeApp';
import { CinemaReservationApp } from './demos/CinemaReservationApp';
import {
  TritonInteractivePreview,
  JagireyyInteractivePreview,
  FinGuardInteractivePreview,
} from './demos/ProjectShowcases';

interface WorkSectionProps {
  projects: WorkProject[];
}

export const WorkSection: React.FC<WorkSectionProps> = ({ projects }) => {
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<WorkProject | null>(null);
  const [fullscreenApp, setFullscreenApp] = useState<'ai-concierge' | 'cinema-reserve' | null>(
    null
  );

  const renderProjectPreview = (project: WorkProject) => {
    switch (project.demoType) {
      case 'triton':
        return <TritonInteractivePreview liveUrl={project.liveUrl} />;
      case 'jagireyy':
        return <JagireyyInteractivePreview liveUrl={project.liveUrl} />;
      case 'ai-concierge':
        return (
          <SplineAiConciergeApp
            isExpanded={false}
            onToggleExpand={() => setFullscreenApp('ai-concierge')}
          />
        );
      case 'cinema-reserve':
        return (
          <CinemaReservationApp
            isExpanded={false}
            onToggleExpand={() => setFullscreenApp('cinema-reserve')}
          />
        );
      case 'finguard':
        return <FinGuardInteractivePreview isAnalytics={false} />;
      case 'analytics':
        return <FinGuardInteractivePreview isAnalytics={true} />;
      default:
        return (
          <div className="h-64 sm:h-72 rounded-2xl bg-black/40 border border-white/[0.06] flex flex-col items-center justify-center p-6 text-center">
            <span className="font-serif text-5xl sm:text-7xl italic text-white/25 mb-3">
              {project.title.substring(0, 3)}
            </span>
            <span className="font-mono text-xs text-zinc-400">{project.category}</span>
          </div>
        );
    }
  };

  return (
    <section id="work" className="relative w-full py-32 px-6 sm:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-20 sm:mb-24">
          <span className="type-kicker text-cyan-400 block mb-4">
            Selected Work
          </span>
          <h2 className="type-section-heading mb-5">
            Selected Work.
          </h2>
          <p className="type-body-lead">
            Ideas explored, problems solved, and production systems brought to life — including live
            deployments and interactive spatial applications built directly into this portfolio.
          </p>
        </div>

        <div className="space-y-24 sm:space-y-32" id="work-showcase">
          {projects.map((p, idx) => {
            const isEven = idx % 2 === 0;
            const isFullApp =
              p.demoType === 'ai-concierge' || p.demoType === 'cinema-reserve';

            return (
              <article
                key={p.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
              >
                {/* Interactive Project Card / Embedded Web Application */}
                <div
                  className={`${
                    isFullApp ? 'lg:col-span-8' : 'lg:col-span-7'
                  } ${isEven ? 'lg:order-1' : 'lg:order-2'}`}
                >
                  <div className="card-surface rounded-3xl p-5 sm:p-8 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-5 text-xs text-zinc-300">
                      <span className="type-kicker">{p.category}</span>
                      <span className="text-cyan-400 font-medium text-sm">✦ {p.metric}</span>
                    </div>

                    <div className="my-2">{renderProjectPreview(p)}</div>

                    <div className="pt-4 mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="font-normal text-sm text-zinc-300">
                        {p.featuredBadge || 'Interactive Case Study'}
                      </span>
                      {p.liveUrl && (
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 font-medium text-sm hover:underline inline-flex items-center gap-1"
                        >
                          <span>{p.liveUrl.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editorial Project Description */}
                <div
                  className={`${
                    isFullApp ? 'lg:col-span-4' : 'lg:col-span-5'
                  } flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}
                >
                  <span className="type-kicker text-cyan-400 mb-3">
                    {p.category}
                  </span>
                  <h3 className="type-card-heading mb-4 text-balance">
                    {p.title}
                  </h3>
                  <p className="font-sans text-base sm:text-[1.0625rem] text-zinc-300 leading-relaxed mb-6 font-normal max-w-[54ch]">
                    {p.desc}
                  </p>

                  {/* Unboxed clean metadata with typographic separators */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm font-normal text-zinc-400 mb-8">
                    {p.tech.map((t, i) => (
                      <React.Fragment key={t}>
                        <span>{t}</span>
                        {i < p.tech.length - 1 && (
                          <span aria-hidden="true" className="text-zinc-600">
                            ·
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-fit px-6 py-3 rounded-full type-nav-button bg-white !text-black hover:bg-zinc-200 transition-all shadow-xl inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <span>Visit Live Site</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {isFullApp && (
                      <button
                        type="button"
                        onClick={() =>
                          setFullscreenApp(
                            p.demoType as 'ai-concierge' | 'cinema-reserve'
                          )
                        }
                        className="w-fit px-6 py-3 rounded-full type-nav-button bg-white !text-black hover:bg-zinc-200 transition-all shadow-xl inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span>Open Fullscreen App</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedCaseStudy(p)}
                      className={`w-fit px-6 py-3 rounded-full type-nav-button transition-all whitespace-nowrap shrink-0 ${
                        p.liveUrl || isFullApp
                          ? 'card-elevated text-white hover:brightness-110'
                          : 'bg-white !text-black hover:bg-zinc-200 shadow-xl'
                      }`}
                    >
                      Case Study Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Case Study Modal */}
      {selectedCaseStudy && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedCaseStudy(null)}
        >
          <div
            className="max-w-2xl w-full rounded-3xl card-surface p-6 sm:p-10 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="type-kicker text-cyan-400 block mb-1.5">
                  {selectedCaseStudy.category} · {selectedCaseStudy.metric}
                </span>
                <h3 className="type-card-heading">
                  {selectedCaseStudy.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseStudy(null)}
                className="p-2.5 rounded-full card-elevated text-zinc-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-sans text-base sm:text-[1.0625rem] text-zinc-200 leading-relaxed">
              {selectedCaseStudy.desc}
            </p>

            {selectedCaseStudy.highlights && selectedCaseStudy.highlights.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="type-kicker text-zinc-400">
                  Architectural Highlights
                </div>
                {selectedCaseStudy.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-base text-zinc-200">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm font-normal text-zinc-300">
                {selectedCaseStudy.tech.join(' · ')}
              </div>

              {selectedCaseStudy.liveUrl && (
                <a
                  href={selectedCaseStudy.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-white !text-black type-nav-button inline-flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                >
                  <span>Launch Production URL</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Interactive Application Modal */}
      {fullscreenApp && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-8 overflow-y-auto"
          onClick={() => setFullscreenApp(null)}
        >
          <div
            className="w-full max-w-6xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="type-kicker text-zinc-400">
                Interactive Live Application Studio — Press ESC or Close to return
              </span>
              <button
                type="button"
                onClick={() => setFullscreenApp(null)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white type-nav-button inline-flex items-center gap-1.5"
              >
                <span>Close Studio</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {fullscreenApp === 'ai-concierge' ? (
              <SplineAiConciergeApp
                isExpanded={true}
                onToggleExpand={() => setFullscreenApp(null)}
              />
            ) : (
              <CinemaReservationApp
                isExpanded={true}
                onToggleExpand={() => setFullscreenApp(null)}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
};
