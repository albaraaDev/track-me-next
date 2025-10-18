'use client';

import { useMemo } from 'react';
import { FilterState } from '@/domain/types';
import { useAppActions, useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { formatAppDate } from '@/lib/date';

type ProjectFiltersProps = {
  projectId: string;
};

const timeframeOptions: Array<{ value: FilterState['timeframe']; label: string }> = [
  { value: 'week', label: 'أسبوع' },
  { value: 'two-weeks', label: 'أسبوعان' },
  { value: 'month', label: 'شهر' },
  { value: 'all', label: 'كل الوقت' },
  { value: 'custom', label: 'مخصص' },
];

export function ProjectFilters({ projectId }: ProjectFiltersProps) {
  const filters = useAppStore((state) => state.filters);
  const project = useAppStore((state) =>
    state.projects.find((entry) => entry.id === projectId)
  );
  const { setTimeframe, setFilterRange, setIncludeOpenEnded } = useAppActions();

  const rangeDisplay = useMemo(() => {
    if (!filters.customRange?.from) return null;
    const fromLabel = formatAppDate(filters.customRange.from, 'd MMM yyyy');
    const toLabel = filters.customRange?.to
      ? formatAppDate(filters.customRange.to, 'd MMM yyyy')
      : 'اليوم';
    return `${fromLabel} → ${toLabel}`;
  }, [filters.customRange]);

  if (!project) return null;

  return (
    <div className="glass-panel rounded-3xl border border-border/60 p-4 shadow-glass flex flex-col gap-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {timeframeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTimeframe(option.value)}
            className={cn(
              'rounded-full border border-border/50 px-4 py-1 transition text-xs',
              filters.timeframe === option.value
                ? 'bg-primary text-primary-foreground shadow-glow-soft'
                : 'text-muted-foreground hover:bg-white/10'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filters.timeframe === 'custom' ? (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <span>من</span>
            <input
              type="date"
              className="rounded-full border border-border/60 bg-background px-3 py-1 text-foreground"
              value={filters.customRange?.from ?? ''}
              onChange={(event) =>
                setFilterRange(event.target.value || null, filters.customRange?.to ?? null)
              }
            />
          </label>
          <label className="flex items-center gap-2">
            <span>إلى</span>
            <input
              type="date"
              className="rounded-full border border-border/60 bg-background px-3 py-1 text-foreground"
              value={filters.customRange?.to ?? ''}
              onChange={(event) =>
                setFilterRange(filters.customRange?.from ?? null, event.target.value || null)
              }
            />
          </label>
          {rangeDisplay ? (
            <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
              {rangeDisplay}
            </span>
          ) : null}
        </div>
      ) : null}

      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          className="size-4 rounded border border-border/60"
          checked={filters.includeOpenEnded}
          onChange={(event) => setIncludeOpenEnded(event.target.checked)}
        />
        تضمين الجداول مفتوحة المدة (بدون تاريخ نهاية)
      </label>
    </div>
  );
}

