'use client';

import { Check, AlertTriangle, NotebookPen, CircleDot } from 'lucide-react';
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
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-border/60 p-5 shadow-glow-soft">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">نظرة عامة</h2>
          <p className="text-sm text-muted-foreground">
            يعرض هذا الملخص أداء المشروع خلال الفترة المحددة ({timeframe.label}).
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
                {timeframe.to ? formatAppDate(timeframe.to, 'd MMM yyyy') : 'اليوم'}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass-panel rounded-3xl p-5 shadow-glass">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">معدل الإنجاز</h3>
            <Check className="size-5 text-primary" />
          </header>
          <p className="mt-4 text-3xl font-semibold text-foreground">
            {formatPercentage(status.completionRate)}
          </p>
          <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
            <li>
              تم: <span className="text-foreground">{status.done}</span>
            </li>
            <li>
              جزئي: <span className="text-foreground">{status.partial}</span>
            </li>
            <li>
              لم يتم: <span className="text-foreground">{status.missed}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            عدد الجداول الفاعلة: {status.activeTrackerCount}
          </p>
        </article>

        <article className="glass-panel rounded-3xl p-5 shadow-glass">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">أفضل الإنجازات</h3>
            <CircleDot className="size-5 text-emerald-500" />
          </header>
          {hasStatusData && status.topPerformers.length ? (
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {status.topPerformers.map((item) => (
                <li key={item.trackerId} className="flex items-center justify-between gap-2">
                  <span className="text-foreground font-medium line-clamp-1">
                    {item.title}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">
                    {formatPercentage(item.rate)}
                  </span>
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
            <h3 className="text-sm font-semibold text-foreground">بحاجة إلى انتباه</h3>
            <AlertTriangle className="size-5 text-destructive" />
          </header>
          {hasStatusData && status.needsAttention.length ? (
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {status.needsAttention.map((item) => (
                <li key={item.trackerId} className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1 text-foreground">{item.title}</span>
                  <span className="rounded-full bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                    {item.missed} حالات متعثرة
                  </span>
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
          <h3 className="text-sm font-semibold text-foreground">أحدث الملاحظات</h3>
          <NotebookPen className="size-5 text-primary/70" />
        </header>
        {notes.recent.length ? (
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {notes.recent.map((entry) => (
              <li key={`${entry.trackerId}-${entry.date}-${entry.itemLabel}`} className="rounded-2xl border border-border/60 bg-white/5 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="line-clamp-1 text-foreground font-medium">
                    {entry.trackerTitle} • {entry.itemLabel}
                  </span>
                  <span>{formatAppDate(entry.date, 'd MMM')}</span>
                </div>
                <p className="mt-2 text-sm text-foreground leading-relaxed">{entry.note}</p>
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
