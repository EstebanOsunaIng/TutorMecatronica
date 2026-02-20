import React, { useMemo, useState } from 'react';
import Card from '../common/Card.jsx';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatInt(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('es-CO');
}

function timeAgo(dateInput) {
  const t = dateInput ? new Date(dateInput).getTime() : NaN;
  if (!Number.isFinite(t)) return null;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return 'hace poco';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return 'hace 1 min';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 2) return 'hace 1 h';
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 2) return 'hace 1 dia';
  if (days < 14) return `hace ${days} dias`;
  const weeks = Math.floor(days / 7);
  if (weeks < 2) return 'hace 1 sem';
  return `hace ${weeks} sem`;
}

export default function MyRankCard({ position, total, badgesCount, completedModules, totalModules, lastBadgeUnlockedAt, top }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const pos = Number.isFinite(Number(position)) ? Number(position) : null;

  const myBadges = Number.isFinite(Number(badgesCount)) ? Number(badgesCount) : 0;
  const myCompleted = Number.isFinite(Number(completedModules)) ? Number(completedModules) : 0;

  const above = pos && pos > 1 && pos <= 5 ? (top || [])[pos - 2] : null;
  const aboveBadges = above ? Number(above.badgesCount || 0) : NaN;
  const aboveCompleted = above ? Number(above.completedModulesCount || 0) : NaN;

  const lastBadgeText = timeAgo(lastBadgeUnlockedAt);

  const targetMetric = (() => {
    if (!pos || pos <= 1) return null;
    if (!above) return 'badges';
    if (!Number.isFinite(aboveBadges)) return 'badges';
    if (myBadges < aboveBadges) return 'badges';
    return 'modules';
  })();

  const targetValue = (() => {
    if (!pos || pos <= 1) return null;
    if (targetMetric === 'modules') {
      if (Number.isFinite(aboveCompleted)) return Math.max(0, aboveCompleted) + 1;
      return myCompleted + 1;
    }
    if (Number.isFinite(aboveBadges)) return Math.max(0, aboveBadges) + 1;
    return myBadges + 1;
  })();

  const currentValue = targetMetric === 'modules' ? myCompleted : myBadges;
  const remaining = targetValue && targetMetric ? Math.max(0, targetValue - currentValue) : 0;
  const progressPct = targetValue && targetValue > 0 ? clamp((currentValue / targetValue) * 100, 6, 100) : 0;

  const detailsTitle = useMemo(() => {
    if (!pos) return 'Como entrar al ranking';
    if (pos === 1) return 'Mantente en #1';
    return `Para subir a #${pos - 1}`;
  }, [pos]);

  const detailsHeadline = useMemo(() => {
    if (!pos) return 'Completa 1 modulo al 100%.';
    if (pos === 1) return 'Desbloquea 1 insignia mas.';
    if (targetMetric === 'modules') return `Completa +${Math.max(1, remaining)} modulo${Math.max(1, remaining) === 1 ? '' : 's'}.`;
    if (targetMetric === 'badges') return `Desbloquea +${Math.max(1, remaining)} insignia${Math.max(1, remaining) === 1 ? '' : 's'}.`;
    return 'Completa 1 modulo.';
  }, [pos, remaining, targetMetric]);

  return (
    <Card className="group relative h-full overflow-hidden border-cyan-100/70 bg-gradient-to-br from-sky-50/85 via-cyan-50/60 to-slate-50 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:bg-none dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-2xl dark:bg-cyan-400/15" />
        <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-sky-400/15 blur-2xl dark:bg-sky-500/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:22px_22px] opacity-35 dark:opacity-25" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(34,211,238,0.22),transparent_55%)]" />
        <div className="absolute left-0 top-6 h-10 w-full bg-[linear-gradient(to_right,transparent,rgba(34,211,238,0.20),transparent)] blur-[1px]" />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-3 top-3 h-3 w-3 border-l border-t border-cyan-300/60" />
        <div className="absolute right-3 top-3 h-3 w-3 border-r border-t border-cyan-300/60" />
        <div className="absolute left-3 bottom-3 h-3 w-3 border-b border-l border-cyan-300/60" />
        <div className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-cyan-300/60" />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Mi posicion</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-4xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">#{pos || '-'}</div>
              <div className="pb-1 text-xs font-semibold text-slate-500 dark:text-slate-300">de {formatInt(total || 0)}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/75 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-300">
              Actualizado: ahora
            </span>
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="inline-flex items-center rounded-full border border-cyan-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-cyan-900 shadow-sm transition hover:brightness-105 dark:border-cyan-300/30 dark:bg-slate-900/40 dark:text-cyan-200"
              aria-expanded={detailsOpen}
              aria-label={detailsOpen ? 'Cerrar detalles de ranking' : 'Ver detalles de ranking'}
            >
              Detalles
              <span className={`ml-1 inline-block transition-transform ${detailsOpen ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          {lastBadgeText && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/75 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-300">
              Ultima insignia: {lastBadgeText}
            </span>
          )}
        </div>

        <div className="mt-auto">
          {(pos && pos > 1 && targetMetric && targetValue) && (
            <div className="mt-3 rounded-2xl border border-cyan-100/70 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/25">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Para subir a #{pos - 1}</div>
                <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-100">{Math.round(progressPct)}%</div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {detailsOpen && (
            <div className="mt-3 rounded-2xl border border-cyan-200/70 bg-white/80 p-4 shadow-[0_20px_40px_-30px_rgba(2,132,199,0.55)] dark:border-cyan-300/25 dark:bg-slate-950/55">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">{detailsTitle}</div>
                  <div className="mt-2 text-lg font-extrabold leading-snug text-slate-900 dark:text-white">{detailsHeadline}</div>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">Completa un modulo al 100% y ganas 1 insignia.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                  aria-label="Cerrar detalles"
                >
                  ✕
                </button>
              </div>

              {(pos && pos > 1 && targetMetric && targetValue) && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <span>
                      Tu progreso: {formatInt(currentValue)}/{formatInt(targetValue)} {targetMetric === 'modules' ? 'modulos' : 'insignias'}
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{Math.round(progressPct)}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {lastBadgeText && (
                <div className="mt-4 text-[11px] font-semibold text-slate-500 dark:text-slate-300">Ultima insignia: {lastBadgeText}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
