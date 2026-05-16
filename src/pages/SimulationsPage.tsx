import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SteamiLayout } from '@/components/SteamiLayout';
import { QuantumBlochSphere } from '@/components/simulations/QuantumBlochSphere';
import { ThreeBodySim } from '@/components/simulations/ThreeBodySim';
import { staggerContainer, cardVariants, cardHover, cardTap, overlayVariants, modalVariants, fadeInUp } from '@/lib/motion';
import { Lightbulb, ChevronDown, X } from 'lucide-react';
import { ShareMenu } from '@/components/ShareMenu';
import { TextSelectionPopover } from '@/components/TextSelectionPopover';
import { PopupLinkPill } from '@/components/PopupLinkPill';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimulationRecord {
  id:              string;
  title:           string;
  field:           string;
  fieldColor:      string;
  description:     string;
  caption:         string;
  readTime:        string;
  simulation_type: string;
  component_id:    string;
  insights:        string[];
  snapshot_url:    string;
  glb_url:         string;
  tags:            string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const logPopupEvent = (popup_type: string, popup_id: string | undefined | null, popup_title?: string) => {
  if (!popup_id) return;
  api.dashboard.event({ popup_type, popup_id, popup_title: popup_title ?? '' }).catch(() => {});
};

/**
 * Map a component_id (stored in DB) to the actual React component.
 * Add new simulations here as your library grows.
 */
function SimulationRenderer({ componentId }: { componentId: string }) {
  switch (componentId) {
    case 'quantum':    return <QuantumBlochSphere />;
    case 'threebody':  return <ThreeBodySim />;
    default:
      return (
        <div className="flex flex-col items-center justify-center rounded-xl py-16 gap-3"
          style={{ background: 'rgba(6,16,38,0.5)', border: '1px solid rgba(99,179,237,0.14)' }}>
          <span className="text-3xl">🔬</span>
          <p className="font-mono text-[11px] text-muted-foreground tracking-wider">
            COMPONENT <span className="text-steami-cyan">"{componentId}"</span> NOT YET REGISTERED
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/60">
            Add it to the SimulationRenderer switch in SimulationsPage.tsx
          </p>
        </div>
      );
  }
}

// ─── Skeleton card shown while loading ───────────────────────────────────────

function SimulationSkeleton() {
  return (
    <div className="glass-card relative overflow-hidden animate-pulse">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10" />
      <div className="p-7 space-y-3">
        <div className="h-5 w-24 rounded bg-white/10" />
        <div className="h-6 w-3/4 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-5/6 rounded bg-white/10" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-8 w-32 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SimulationsPage() {
  const [simulations,       setSimulations]       = useState<SimulationRecord[]>([]);
  const [loadingList,       setLoadingList]       = useState(true);
  const [listError,         setListError]         = useState('');
  const [openSim,           setOpenSim]           = useState<string | null>(null);
  const [expandedInsights,  setExpandedInsights]  = useState<Record<string, boolean>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Fetch simulations from backend ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    setListError('');
    api.simulations.list()
      .then((data: any) => {
        if (cancelled) return;
        // Backend returns { simulations: [...], total: n }
        const list: SimulationRecord[] = Array.isArray(data)
          ? data
          : data?.simulations ?? [];
        setSimulations(list);
      })
      .catch((err: any) => {
        if (!cancelled) setListError(err?.message || 'Failed to load simulations');
      })
      .finally(() => { if (!cancelled) setLoadingList(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Auto-open via URL param ?simulation=quantum ────────────────────────────
  useEffect(() => {
    if (loadingList) return;
    const params = new URLSearchParams(window.location.search);
    const simId  = params.get('simulation') ?? params.get('open');
    if (simId && simulations.some((s) => s.id === simId)) {
      setOpenSim(simId);
      const sim = simulations.find((s) => s.id === simId);
      if (sim) logPopupEvent('simulation', sim.id, sim.title);
      params.delete('simulation');
      params.delete('open');
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
      );
    }
  }, [loadingList, simulations]);

  const toggleInsights = (id: string) =>
    setExpandedInsights((prev) => ({ ...prev, [id]: !prev[id] }));

  const openedSim = simulations.find((s) => s.id === openSim);

  // ── Accent colour per simulation (fallback if fieldColor not set) ──────────
  const accentColor = (sim: SimulationRecord) =>
    sim.simulation_type === 'bloch_sphere' || sim.component_id === 'quantum'
      ? 'hsl(var(--steami-violet))'
      : sim.simulation_type === 'three_body' || sim.component_id === 'threebody'
      ? 'hsl(var(--steami-cyan))'
      : 'hsl(var(--steami-gold))';

  return (
    <SteamiLayout>
      {/* Page header */}
      <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible">
        <div className="steami-section-label">◆ INTERACTIVE SIMULATIONS</div>
        <h1 className="steami-heading text-2xl md:text-3xl mt-2">
          3D Simulations Lab
        </h1>
        <p className="text-[18px] font-medium text-muted-foreground mt-3 max-w-[560px] leading-relaxed">
          Hands-on, interactive 3D visualisations that bring abstract scientific concepts to life.
          Drag, adjust, and explore — learning through direct manipulation.
        </p>
      </motion.div>

      {/* ── Error state ── */}
      {listError && (
        <div className="glass-card p-6 text-center mb-6">
          <p className="font-mono text-[12px] text-steami-red">{listError}</p>
          <button
            className="steami-btn text-[11px] mt-3"
            onClick={() => window.location.reload()}
          >
            ↺ Retry
          </button>
        </div>
      )}

      {/* ── Simulation cards ── */}
      {loadingList ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimulationSkeleton />
          <SimulationSkeleton />
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {simulations.map((sim, idx) => (
            <motion.div
              key={sim.id}
              custom={idx}
              variants={cardVariants}
              layoutId={`sim-card-${sim.id}`}
              className="glass-card relative overflow-hidden"
            >
              {/* Accent bar */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: accentColor(sim) }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />

              {/* Snapshot thumbnail — shown if available */}
              {sim.snapshot_url && (
                <div className="relative overflow-hidden" style={{ height: 140 }}>
                  <img
                    src={sim.snapshot_url}
                    alt={sim.title}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.75) saturate(1.2)' }}
                  />
                  {/* Gradient fade into card body */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--steami-card-bg, #07111f) 100%)' }}
                  />
                </div>
              )}

              <div className="p-7">
                <span className={`steami-badge ${sim.fieldColor || 'steami-badge-cyan'} mb-3 inline-block`}>
                  {sim.field}
                </span>
                <h2 className="steami-heading text-lg mb-3">{sim.title}</h2>
                <p className="text-[14px] font-medium text-muted-foreground leading-relaxed mb-4">
                  {sim.description}
                </p>

                {/* Key Insights collapsible */}
                {sim.insights?.length > 0 && (
                  <div className="mb-4">
                    <motion.button
                      onClick={() => toggleInsights(sim.id)}
                      className="flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-2 w-full"
                      whileHover={{ x: 2 }}
                    >
                      <Lightbulb className="w-3 h-3" />
                      KEY INSIGHTS
                      <motion.span
                        animate={{ rotate: expandedInsights[sim.id] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </motion.span>
                    </motion.button>
                    <AnimatePresence>
                      {expandedInsights[sim.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div
                            className="rounded-lg p-3"
                            style={{ background: 'rgba(6,16,38,0.5)', border: '1px solid rgba(99,179,237,0.14)' }}
                          >
                            {sim.insights.map((insight, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 py-1.5 border-b border-steami-cyan/5 last:border-0"
                              >
                                <span className="text-steami-cyan text-xs mt-0.5">◆</span>
                                <span className="font-mono text-[11px] text-muted-foreground leading-relaxed">{insight}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground tracking-wider">
                    {sim.readTime}
                  </span>
                  <div className="flex items-center gap-2">
                    <ShareMenu title={sim.title} popupType="simulation" popupId={sim.id} compact />
                    <motion.button
                      whileHover={cardHover}
                      whileTap={cardTap}
                      onClick={() => {
                        setOpenSim(sim.id);
                        logPopupEvent('simulation', sim.id, sim.title);
                      }}
                      className="steami-btn text-[11px]"
                    >
                      LAUNCH SIMULATION
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty state */}
          {!loadingList && simulations.length === 0 && !listError && (
            <div className="md:col-span-2 glass-card p-12 text-center">
              <p className="font-mono text-[12px] text-muted-foreground tracking-wider">
                NO SIMULATIONS AVAILABLE YET
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/50 mt-2">
                Admin / mod users can add simulations via the Content Operations page.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Modal overlay ── */}
      <AnimatePresence>
        {openSim && openedSim && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ background: 'rgba(2,8,18,0.82)', backdropFilter: 'blur(8px)' }}
            onClick={() => setOpenSim(null)}
          >
            <motion.div
              className="w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                background: 'var(--steami-modal-bg)',
                backdropFilter: 'blur(24px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(99,179,237,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 z-10"
                style={{ background: 'rgba(5,14,32,0.92)', backdropFilter: 'blur(20px)' }}
              >
                <div className="flex items-center gap-3">
                  <span className={`steami-badge ${openedSim.fieldColor || 'steami-badge-cyan'}`}>
                    {openedSim.field}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {openedSim.readTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PopupLinkPill type="simulation" id={openSim} />
                  <ShareMenu
                    title={openedSim.title}
                    popupType="simulation"
                    popupId={openSim}
                    compact
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpenSim(null)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10,25,55,0.4)' }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Modal body */}
              <div ref={contentRef} className="p-6 md:p-8">
                <TextSelectionPopover
                  containerRef={contentRef as React.RefObject<HTMLDivElement>}
                  source={openedSim.title}
                  sourceType="simulation"
                  field={openedSim.field}
                  sourceId={openSim}
                />

                <motion.h2
                  className="steami-heading text-xl md:text-2xl mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {openedSim.title}
                </motion.h2>

                <motion.p
                  className="text-[18px] font-medium italic leading-relaxed mb-6"
                  style={{ color: '#8aacca', borderLeft: '2px solid hsl(var(--steami-gold))', paddingLeft: 18 }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {openedSim.description}
                </motion.p>

                {/* 3D Simulation — rendered by component_id */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <SimulationRenderer componentId={openedSim.component_id} />
                </motion.div>

                {/* Caption */}
                {openedSim.caption && (
                  <motion.div
                    className="mt-4 p-3 rounded-lg"
                    style={{ background: 'rgba(6,16,38,0.5)', border: '1px solid rgba(99,179,237,0.14)' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <p className="font-mono text-[11px] text-muted-foreground tracking-wider leading-relaxed">
                      ◆ {openedSim.caption}
                    </p>
                  </motion.div>
                )}

                {/* GLB download link — shown if a 3-D file was uploaded */}
                {openedSim.glb_url && (
                  <motion.div
                    className="mt-3 flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <a
                      href={openedSim.glb_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-steami-cyan hover:underline"
                    >
                      ↗ Download 3D model (.glb)
                    </a>
                  </motion.div>
                )}

                {/* Tags */}
                {openedSim.tags?.length > 0 && (
                  <motion.div
                    className="mt-4 flex flex-wrap gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                  >
                    {openedSim.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] px-2 py-0.5 rounded"
                        style={{ background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', color: '#63b3ed' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SteamiLayout>
  );
}
