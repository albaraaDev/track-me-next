'use client';

import { useState } from 'react';
import {
  Check,
  AlertTriangle,
  NotebookPen,
  CircleDot,
  ChevronDown,
  Eye,
  X,
} from 'lucide-react';
import { Project } from '@/domain/types';
import { ProjectMetrics } from '@/lib/stats';
import { formatAppDate } from '@/lib/date';

type ProjectOverviewProps = {
  project: Project | undefined;
  metrics: ProjectMetrics | null;
};

const formatPercentage = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
};

export function ProjectOverview({ project, metrics }: ProjectOverviewProps) {
  const [expandedTop, setExpandedTop] = useState<string | null>(null);
  const [expandedAttention, setExpandedAttention] = useState<string | null>(
    null
  );

  if (!project) {
    return (
      <section className="glass-panel rounded-3xl p-6 shadow-glass text-center text-sm text-muted-foreground">
        المشروع المطلوب غير موجود.
      </section>
    );
  }

  if (!metrics) {
    return (
      <section className="glass-panel rounded-3xl p-6 shadow-glass text-center text-sm text-muted-foreground">
        لم يتم تسجيل أي بيانات بعد لهذا المشروع.
      </section>
    );
  }

  const { status, notes, timeframe, sectionsCount, trackersCount } = metrics;
  const hasStatusData = status.total > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <header className="glass-panel rounded-3xl border border-border/60 p-5 shadow-glow-soft lg:col-span-2">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">
                نظرة عامة
              </h2>
              <Eye className='text-indigo-600' />
            </div>
            <p className="text-sm text-muted-foreground">
              يعرض هذا الملخص أداء المشروع خلال الفترة المحددة (
              {timeframe.label}
              ).
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                الأقسام: {sectionsCount}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                الجداول: {trackersCount}
              </span>
              {timeframe.from ? (
                <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
                  من {formatAppDate(timeframe.from, 'd MMM yyyy')} إلى{' '}
                  {timeframe.to
                    ? formatAppDate(timeframe.to, 'd MMM yyyy')
                    : 'اليوم'}
                </span>
              ) : null}
            </div>
          </div>
        </header>
        <article className="glass-panel rounded-3xl p-5 shadow-glass">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              معدل الإنجاز
            </h3>
            <Check className="size-5 text-fuchsia-500" />
          </header>
          <p className="mt-4 text-3xl font-semibold text-foreground">
            {formatPercentage(status.completionRate)}
          </p>
          <ul className="mt-4 grid grid-cols-3 gap-2  text-xs text-muted-foreground">
            <li className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500 text-green-500 text-center">
              <span className="text-foreground">{status.done}</span>
            </li>
            <li className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500 text-yellow-500 text-center">
              <span className="text-foreground">{status.partial}</span>
            </li>
            <li className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500 text-red-500 text-center">
              <span className="text-foreground">{status.missed}</span>
            </li>
          </ul>
          {/* <p className="mt-4 text-xs text-muted-foreground">
            عدد الجداول الفاعلة: {status.activeTrackerCount}
          </p> */}
        </article>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass-panel rounded-3xl p-5 shadow-glass">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              أفضل الإنجازات
            </h3>
            <CircleDot className="size-5 text-emerald-500" />
          </header>
          {hasStatusData && status.topPerformers.length ? (
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {status.topPerformers.map((item) => (
                <li key={item.trackerId} className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTop((prev) =>
                        prev === item.trackerId ? null : item.trackerId
                      )
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/60 bg-white/5 px-3 py-2 text-right text-[13px] text-foreground transition hover:bg-white/10"
                    aria-expanded={expandedTop === item.trackerId}
                  >
                    <span className="line-clamp-1 font-semibold">
                      {item.title}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-primary">
                      {formatPercentage(item.rate)}
                      <ChevronDown
                        className={`size-4 transition ${
                          expandedTop === item.trackerId ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>
                  {expandedTop === item.trackerId && item.items.length ? (
                    <ul className="space-y-1 rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-start text-xs text-muted-foreground">
                      {item.items.map((entry) => (
                        <li
                          key={entry.itemId}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="line-clamp-1 text-foreground">
                            {entry.label}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">
                            {entry.done} من {entry.total}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              لا توجد بيانات كافية لقياس الإنجازات حتى الآن.
            </p>
          )}
        </article>

        <article className="glass-panel rounded-3xl p-5 shadow-glass">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              الإنجازات المجتزءة
            </h3>
            <AlertTriangle className="size-5 text-yellow-400" />
          </header>
          {hasStatusData && status.topPerformers.length ? (
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {status.topPerformers.map((item) => (
                <li key={item.trackerId} className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTop((prev) =>
                        prev === item.trackerId ? null : item.trackerId
                      )
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/60 bg-white/5 px-3 py-2 text-right text-[13px] text-foreground transition hover:bg-white/10"
                    aria-expanded={expandedTop === item.trackerId}
                  >
                    <span className="line-clamp-1 font-semibold">
                      {item.title}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-primary">
                      {formatPercentage(item.rate)}
                      <ChevronDown
                        className={`size-4 transition ${
                          expandedTop === item.trackerId ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>
                  {expandedTop === item.trackerId && item.items.length ? (
                    <ul className="space-y-1 rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-start text-xs text-muted-foreground">
                      {item.items.map((entry) => (
                        <li
                          key={entry.itemId}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="line-clamp-1 text-foreground">
                            {entry.label}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">
                            {entry.done} من {entry.total}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              لا توجد بيانات كافية لقياس الإنجازات حتى الآن.
            </p>
          )}
        </article>

        <article className="glass-panel rounded-3xl p-5 shadow-glass">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              بحاجة إلى انتباه
            </h3>
            <X className="size-5 text-destructive" />
          </header>
          {hasStatusData && status.needsAttention.length ? (
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {status.needsAttention.map((item) => (
                <li key={item.trackerId} className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedAttention((prev) =>
                        prev === item.trackerId ? null : item.trackerId
                      )
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/60 bg-white/5 px-3 py-2 text-right text-[13px] text-foreground transition hover:bg-white/10"
                    aria-expanded={expandedAttention === item.trackerId}
                  >
                    <span className="line-clamp-1 font-semibold">
                      {item.title}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-destructive">
                      {item.missed === 1
                        ? 'حالة واحدة'
                        : item.missed === 2
                        ? 'حالتان'
                        : `${item.missed} حالات`}
                      <ChevronDown
                        className={`size-4 transition ${
                          expandedAttention === item.trackerId
                            ? 'rotate-180'
                            : ''
                        }`}
                      />
                    </span>
                  </button>
                  {expandedAttention === item.trackerId && item.items.length ? (
                    <ul className="space-y-1 rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-start text-xs text-muted-foreground">
                      {item.items.map((entry) => (
                        <li
                          key={entry.itemId}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="line-clamp-1 text-foreground">
                            {entry.label}
                          </span>
                          <span className="rounded-full bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                            {entry.missed} من {entry.total}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              لا توجد عناصر متعثرة خلال الفترة المحددة.
            </p>
          )}
        </article>
      </section>

      <section className="glass-panel rounded-3xl p-5 shadow-glass">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            أحدث الملاحظات
          </h3>
          <NotebookPen className="size-5 text-primary/70" />
        </header>
        {notes.recent.length ? (
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {notes.recent.map((entry) => (
              <li
                key={`${entry.trackerId}-${entry.date}-${entry.itemLabel}`}
                className="rounded-2xl border border-border/60 bg-white/5 p-3"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="line-clamp-1 text-foreground font-medium">
                    {entry.trackerTitle} • {entry.itemLabel}
                  </span>
                  <span>{formatAppDate(entry.date, 'd MMM')}</span>
                </div>
                <p className="mt-2 text-sm text-foreground leading-relaxed">
                  {entry.note}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            لم تُسجّل ملاحظات ضمن الفترة الحالية.
          </p>
        )}
      </section>
    </div>
  );
}
