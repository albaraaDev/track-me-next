'use client';

import { useCallback, useMemo } from 'react';
import { CalendarRange, Filter, ListChecks, RotateCcw, Sparkles } from 'lucide-react';
import { FilterState } from '@/domain/types';
import { useAppActions, useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { formatAppDate } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

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
  const {
    setTimeframe,
    setFilterRange,
    setIncludeOpenEnded,
    toggleFilterSection,
    setFilters,
    resetFilters,
  } = useAppActions();

  const rangeDisplay = useMemo(() => {
    if (!filters.customRange?.from) return null;
    const fromLabel = formatAppDate(filters.customRange.from, 'd MMM yyyy');
    const toLabel = filters.customRange?.to
      ? formatAppDate(filters.customRange.to, 'd MMM yyyy')
      : 'اليوم';
    return `${fromLabel} → ${toLabel}`;
  }, [filters.customRange]);

  const selectedSections = useMemo(
    () => (filters.sectionIds ?? []).filter((entry) => entry.projectId === projectId),
    [filters.sectionIds, projectId]
  );

  const clearSectionFilters = useCallback(() => {
    const remaining = (filters.sectionIds ?? []).filter((entry) => entry.projectId !== projectId);
    setFilters({ sectionIds: remaining });
  }, [filters.sectionIds, projectId, setFilters]);

  const timeframeLabel = useMemo(() => {
    return timeframeOptions.find((option) => option.value === filters.timeframe)?.label ?? 'شهر';
  }, [filters.timeframe]);

  const totalSections = project?.sections.length ?? 0;
  const selectionSummary = selectedSections.length
    ? `يُعرض ${selectedSections.length} من أصل ${totalSections} قسم`
    : totalSections
      ? 'جميع الأقسام معروضة'
      : 'لا توجد أقسام بعد';

  const hasCustomRange = filters.timeframe === 'custom' && !!filters.customRange?.from;
  const hasActiveFilters =
    filters.timeframe !== 'month' ||
    hasCustomRange ||
    !filters.includeOpenEnded ||
    selectedSections.length > 0;

  if (!project) return null;

  return (
    <section className="glass-panel rounded-3xl border border-border/60 p-5 shadow-glass space-y-6 text-sm">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3 text-foreground">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-glow-soft">
            <Filter className="size-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">مرشحات المشروع</p>
            <h3 className="text-lg font-semibold">اضبط المشهد كما تحب</h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
            النطاق: {timeframeLabel}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
            {selectionSummary}
          </span>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full gap-1 text-xs"
              onClick={() => resetFilters()}
            >
              <RotateCcw className="size-4" />
              إعادة التعيين
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-5">
        <article className="glass-panel-muted rounded-3xl border border-border/60 p-4 shadow-inner space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-foreground">
              <CalendarRange className="size-4 text-primary" />
              <div>
                <h4 className="text-sm font-semibold">النطاق الزمني</h4>
                <p className="text-xs text-muted-foreground">
                  اختر المدة المناسبة لمراجعة التقدّم.
                </p>
              </div>
            </div>
            {filters.timeframe !== 'month' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setTimeframe('month')}
              >
                العودة للنطاق الافتراضي
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {timeframeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimeframe(option.value)}
                className={cn(
                  'rounded-full border border-border/50 px-4 py-1.5 transition text-xs font-medium tracking-tight',
                  filters.timeframe === option.value
                    ? 'bg-primary text-primary-foreground shadow-glow-soft'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {filters.timeframe === 'custom' ? (
            <div className="rounded-2xl border border-border/60 bg-background/80 p-3 text-xs text-muted-foreground space-y-3">
              <p className="flex items-center gap-2 text-foreground">
                <Sparkles className="size-4 text-primary" />
                نطاق مخصص
              </p>
              <div className="grid gap-3 grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span>من</span>
                  <input
                    type="date"
                    className="rounded-2xl border border-border/60 bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={filters.customRange?.from ?? ''}
                    onChange={(event) =>
                      setFilterRange(event.target.value || null, filters.customRange?.to ?? null)
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>إلى</span>
                  <input
                    type="date"
                    className="rounded-2xl border border-border/60 bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={filters.customRange?.to ?? ''}
                    onChange={(event) =>
                      setFilterRange(filters.customRange?.from ?? null, event.target.value || null)
                    }
                  />
                </label>
              </div>
              {rangeDisplay ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {rangeDisplay}
                  </span>
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => setFilterRange(null, null)}
                  >
                    مسح التواريخ
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="glass-panel-muted rounded-3xl border border-border/60 p-4 shadow-inner space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="size-4 text-primary" />
            <div>
              <h4 className="text-sm font-semibold">التفاصيل المتقدمة</h4>
              <p className="text-xs text-muted-foreground">
                تحكم بما يظهر في الجداول بناءً على حالة التكرار.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">الجداول المفتوحة</p>
              <p className="text-xs text-muted-foreground">
                عند التعطيل، لن تظهر الجداول التي لا تحتوي على تاريخ نهاية.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-open-ended"
                checked={filters.includeOpenEnded}
                onCheckedChange={(value) => setIncludeOpenEnded(!!value)}
              />
              <label htmlFor="include-open-ended" className="text-xs text-muted-foreground">
                تضمين
              </label>
            </div>
          </div>
        </article>

        {project.sections.length ? (
          <article className="glass-panel-muted rounded-3xl border border-border/60 p-4 shadow-inner space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-foreground">
                <ListChecks className="size-4 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold">الأقسام المعروضة</h4>
                  <p className="text-xs text-muted-foreground">
                    اختر الأقسام التي ترغب في تحليلها الآن.
                  </p>
                </div>
              </div>
              {selectedSections.length ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={clearSectionFilters}
                >
                  إظهار كل الأقسام
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {project.sections.map((section) => {
                const isSelected = selectedSections.some((entry) => entry.sectionId === section.id);
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => toggleFilterSection(project.id, section.id)}
                    className={cn(
                      'rounded-full border px-4 py-1.5 text-xs transition',
                      isSelected
                        ? 'border-primary bg-primary/15 text-primary shadow-glow-soft'
                        : 'border-border/60 bg-white/5 text-muted-foreground hover:bg-white/10'
                    )}
                  >
                    {section.name}
                  </button>
                );
              })}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
