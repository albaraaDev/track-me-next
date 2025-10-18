'use client';

import { CalendarRange, BarChart3, Flame } from 'lucide-react';
import { Project } from '@/domain/types';
import { ProjectMetrics } from '@/lib/stats';
import { formatAppDate } from '@/lib/date';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type ProjectStatsProps = {
  project: Project | undefined;
  metrics: ProjectMetrics | null;
};

const MAX_SERIES_LABELS = 12;

export function ProjectStats({ project, metrics }: ProjectStatsProps) {
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
        لا توجد بيانات لحساب الإحصاءات حتى الآن.
      </section>
    );
  }

  const { status, notes, timeframe } = metrics;
  const hasStatusData = status.total > 0;
  const series = status.dailySeries;
  const sliceFactor = Math.ceil(series.length / MAX_SERIES_LABELS) || 1;
  const chartData = series.map((point) => ({
    date: formatAppDate(point.date, 'd MMM'),
    done: point.done,
    partial: point.partial,
    missed: point.missed,
    total: point.done + point.partial + point.missed,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const items = payload.filter((entry: any) => entry.value > 0);
    if (!items.length) return null;
    return (
      <div className="rounded-2xl border border-border/60 bg-background/95 px-3 py-2 text-xs shadow-glow-soft">
        <p className="font-semibold text-foreground">{label}</p>
        <ul className="mt-1 space-y-1 text-muted-foreground">
          {items.map((entry: any) => (
            <li key={entry.dataKey} className="flex items-center justify-between gap-2">
              <span>{entry.name}</span>
              <span className="text-foreground font-medium">{entry.value}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  console.log(series);
  
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-border/60 p-5 shadow-glow-soft">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            لوحة الإحصاءات
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
              الفترة: {timeframe.label}
            </span>
            {timeframe.from ? (
              <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
                من {formatAppDate(timeframe.from, 'd MMM yyyy')} إلى{' '}
                {timeframe.to ? formatAppDate(timeframe.to, 'd MMM yyyy') : 'اليوم'}
              </span>
            ) : null}
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              إجمالي السجلات: {status.total}
            </span>
            <span className="rounded-full bg-emerald-100/60 px-3 py-1 text-emerald-700">
              معدل الإنجاز: {status.completionRate !== null ? `${Math.round(status.completionRate * 100)}%` : '—'}
            </span>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-5 shadow-glass">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">النشاط اليومي</h3>
          <CalendarRange className="size-5 text-primary" />
        </header>
        {hasStatusData && chartData.length ? (
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis
                  dataKey="date"
                  interval={sliceFactor - 1}
                  tick={{ fill: 'var(--foreground)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--foreground)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.15 }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }}
                />
                <Bar dataKey="done" name="تم" stackId="status" fill="hsl(var(--status-done) / 0.85)" />
                <Bar dataKey="partial" name="جزئي" stackId="status" fill="hsl(var(--status-partial) / 0.75)" />
                <Bar dataKey="missed" name="لم يتم" stackId="status" fill="hsl(var(--status-missed) / 0.6)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            لا توجد سجلات للحالات خلال الفترة المحددة.
          </p>
        )}
      </section>

      <section className="glass-panel rounded-3xl p-5 shadow-glass">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">ملخص الملاحظات</h3>
          <Flame className="size-5 text-primary/80" />
        </header>
        {notes.totalEntries ? (
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-white/5 p-3">
              <p>إجمالي الملاحظات</p>
              <p className="mt-2 text-foreground text-2xl font-semibold">
                {notes.totalEntries}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/5 p-3 sm:col-span-2">
              <p>أحدث الملاحظات</p>
              <ul className="mt-3 space-y-2 text-xs">
                {notes.recent.map((item) => (
                  <li key={`${item.trackerId}-${item.date}-${item.itemLabel}`} className="rounded-2xl border border-border/60 bg-background/40 p-3">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-foreground font-medium line-clamp-1">
                        {item.trackerTitle} • {item.itemLabel}
                      </span>
                      <span>{formatAppDate(item.date, 'd MMM')}</span>
                    </div>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      {item.note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            لا توجد ملاحظات مسجلة في الفترة الحالية.
          </p>
        )}
      </section>
    </div>
  );
}
