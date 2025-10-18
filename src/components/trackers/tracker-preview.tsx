'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarDays, Check, NotebookPen, Table2, X } from 'lucide-react';
import { Tracker } from '@/domain/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useAppActions } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { formatAppDate, parseAppDate, toAppDateString } from '@/lib/date';

type TrackerPreviewProps = {
  trackers: Tracker[];
  projectId: string;
  sectionId: string;
};

const weekdayLabels = [
  'أحد',
  'إثنين',
  'ثلاثاء',
  'أربعاء',
  'خميس',
  'جمعة',
  'سبت',
];

export function TrackerPreview({
  trackers,
  projectId,
  sectionId,
}: TrackerPreviewProps) {
  if (!trackers.length) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-center shadow-glass">
        <Table2 className="mx-auto size-10 text-primary" />
        <h3 className="mt-3 text-lg font-semibold">
          لم يتم إنشاء أي جداول متابعة بعد
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          أنشئ جدول متابعة للحالات أو الملاحظات لتبدأ بتسجيل إنجازاتك اليومية
          داخل القسم.
        </p>
      </div>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="glass-panel rounded-3xl p-4 shadow-glass space-y-3"
      dir="rtl"
    >
      {trackers.map((tracker) => (
        <AccordionItem
          key={tracker.id}
          value={tracker.id}
          className="rounded-2xl border border-border/50 bg-white/5 px-4 backdrop-blur"
        >
          <AccordionTrigger className="flex items-center justify-between gap-3 py-3 text-right text-sm font-medium text-foreground">
            <div className="flex flex-col items-start gap-1">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="text-xl">
                  {tracker.icon || (tracker.type === 'status' ? '📊' : '📝')}
                </span>
                {tracker.title}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span>
                  {formatDate(tracker.startDate)}
                </span>
                ⇠
                <span>
                  {tracker.endDate
                    ? formatDate(tracker.endDate)
                    : 'متابعة مفتوحة'}
                </span>
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <TrackerMeta tracker={tracker} />
            {tracker.type === 'status' ? (
              <StatusTrackerPreview
                tracker={tracker}
                projectId={projectId}
                sectionId={sectionId}
              />
            ) : (
              <NotesTrackerPreview
                tracker={tracker}
                projectId={projectId}
                sectionId={sectionId}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function TrackerMeta({ tracker }: { tracker: Tracker }) {
  return (
    <div className="grid gap-3 rounded-2xl bg-white/5 p-3 text-xs text-muted-foreground grid-cols-2 sm:grid-cols-3">
      <div className="flex items-center gap-2 max-sm:col-span-2">
        <Table2 className="size-4 text-primary/70" />
        <div>
          <p>الأيام الفاعلة</p>
          <p className="text-foreground mt-1">
            {tracker.activeWeekdays.length === 7
              ? 'كل الأيام'
              : tracker.activeWeekdays
                  .map((day) => weekdayLabels[day])
                  .join('، ')}
          </p>
        </div>
      </div>
    </div>
  );
}

type StatusTracker = Extract<Tracker, { type: 'status' }>;
type NotesTracker = Extract<Tracker, { type: 'notes' }>;

function StatusTrackerPreview({
  tracker,
  projectId,
  sectionId,
}: {
  tracker: StatusTracker;
  projectId: string;
  sectionId: string;
}) {
  const summary = React.useMemo(() => {
    const counts = { done: 0, partial: 0, missed: 0, reset: 0 };
    const notes: string[] = [];

    Object.values(tracker.cells ?? {}).forEach((days) => {
      Object.values(days ?? {}).forEach((cell) => {
        if (!cell) return;
        counts[cell.status] = (counts[cell.status] ?? 0) + 1;
        if (cell.note) notes.push(cell.note);
      });
    });

    const total = Object.values(counts).reduce((acc, n) => acc + n, 0);
    return { counts, total, notes: notes.slice(0, 3) };
  }, [tracker.cells]);

  const previewItems = tracker.items.slice(0, 3);
  const sampleWeekdays = tracker.activeWeekdays.slice(0, 5);
  const dateRange = React.useMemo(
    () => buildDateRange(tracker.startDate, tracker.endDate),
    [tracker.startDate, tracker.endDate]
  );

  return (
    <div className="space-y-4">
      {summary.notes.length ? (
        <div className="rounded-2xl border border-border/60 bg-white/5 p-3 text-xs text-muted-foreground">
          <p className="text-foreground">ملاحظات حديثة:</p>
          <ul className="mt-2 space-y-1">
            {summary.notes.map((note, idx) => (
              <li key={idx} className="line-clamp-1">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <StatusGrid
        tracker={tracker}
        dateRange={dateRange}
        projectId={projectId}
        sectionId={sectionId}
      />
    </div>
  );
}

function NotesTrackerPreview({
  tracker,
  projectId,
  sectionId,
}: {
  tracker: NotesTracker;
  projectId: string;
  sectionId: string;
}) {
  const entries = React.useMemo(() => {
    const result: { label: string; notes: string[] }[] = tracker.items.map(
      (item) => ({
        label: item.label,
        notes: Object.values(tracker.cells[item.id] ?? {})
          .map((cell) => cell.note ?? '')
          .filter(Boolean),
      })
    );
    return result;
  }, [tracker.cells, tracker.items]);

  return (
    <div className="space-y-4 text-xs text-muted-foreground">
      <NotesGrid
        tracker={tracker}
        projectId={projectId}
        sectionId={sectionId}
      />
    </div>
  );
}

const formatDate = (date: string | null | undefined) =>
  formatAppDate(date, 'd MMMM yyyy', { locale: ar });

function statusLabel(status: string) {
  switch (status) {
    case 'done':
      return 'تم';
    case 'partial':
      return 'جزئي';
    case 'missed':
      return 'لم يتم';
    case 'reset':
      return 'مصفّر';
    default:
      return status;
  }
}

function buildDateRange(
  startValue: string | null | undefined,
  endValue: string | null | undefined,
  limit = 30
) {
  const start = parseAppDate(startValue);
  if (!start) return [];

  const maxEnd = addDays(start, limit);
  const rawEnd = endValue ? parseAppDate(endValue) : null;
  const endCandidate = rawEnd && rawEnd < maxEnd ? rawEnd : maxEnd;
  const end = endCandidate < start ? start : endCandidate;

  const result: Date[] = [];
  let cursor = start;

  while (cursor <= end) {
    result.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return result;
}

const statusColorMap: Record<string, string> = {
  done: 'bg-status-done/20 text-status-done border-status-done/50',
  partial: 'bg-status-partial/20 text-status-partial border-status-partial/50',
  missed: 'bg-status-missed/20 text-status-missed border-status-missed/50',
  reset: 'bg-status-reset/20 text-status-reset border-status-reset/50',
};

function StatusGrid({
  tracker,
  dateRange,
  projectId,
  sectionId,
}: {
  tracker: StatusTracker;
  dateRange: Date[];
  projectId: string;
  sectionId: string;
}) {
  const { updateTracker } = useAppActions();

  const handleToggle = React.useCallback(
    (
      itemId: string,
      isoDate: string,
      cell?: StatusTracker['cells'][string][string]
    ) => {
      const states: StatusTracker['cells'][string][string]['status'][] = [
        'done',
        'partial',
        'missed',
        'reset',
      ];
      const nextStatus = cell?.status
        ? states[(states.indexOf(cell.status) + 1) % states.length]
        : states[0];
      const existingItemCells = { ...(tracker.cells?.[itemId] ?? {}) };
      existingItemCells[isoDate] = {
        status: nextStatus,
        note: cell?.note,
        updatedAt: new Date().toISOString(),
      };
      updateTracker(projectId, sectionId, tracker.id, {
        cells: {
          ...tracker.cells,
          [itemId]: existingItemCells,
        },
      });
    },
    [projectId, sectionId, tracker.cells, tracker.id, updateTracker]
  );

  if (!tracker.items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
        أضف عناصر متابعة لعرض الشبكة هنا.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <table className="min-w-full border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky right-0 z-10 bg-background px-4 py-3 text-center font-semibold text-foreground shadow-[2px_0_6px_rgba(15,23,42,0.08)] backdrop-blur">
              العنصر
            </th>
            {dateRange.map((date) => {
              const dateKey = toAppDateString(date);
              return (
                <th
                  key={dateKey}
                  className="min-w-[95px] bg-white/5 px-3 py-2 text-center font-medium text-muted-foreground"
                >
                  <div>{format(date, 'd MMM', { locale: ar })}</div>
                  <div className="text-[10px] text-muted-foreground/80">
                    {weekdayLabels[date.getDay()]}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tracker.items.map((item) => {
            const dayCells = tracker.cells?.[item.id] ?? {};
            return (
              <tr key={item.id} className="border-t border-border/60">
                <td className="sticky right-0 z-10 bg-background min-w-[115px] px-4 py-3 text-sm text-center text-foreground shadow-[2px_0_6px_rgba(15,23,42,0.08)] backdrop-blur">
                  {item.label}
                </td>
                {dateRange.map((date) => {
                  const iso = toAppDateString(date);
                  const cell = dayCells?.[iso];
                  const isActive = tracker.activeWeekdays.includes(
                    date.getDay()
                  );
                  return (
                    <td
                      key={iso}
                      className="min-w-[95px] border-l border-border/40 p-0 text-center relative"
                    >
                      <button
                        type="button"
                        disabled={!isActive}
                        onClick={() => handleToggle(item.id, iso, cell)}
                        className={cn(
                          'absolute top-0 left-0 size-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary z-20',
                          !isActive && 'bg-muted/30 text-muted-foreground/70',
                          isActive && 'bg-white/5 hover:bg-white/10'
                        )}
                      >
                        {cell && (
                          <span
                            className={cn(
                              'absolute size-full left-0 top-0 grid place-content-center',
                              statusColorMap[cell.status] ??
                                'bg-white/10 text-foreground border-border/40'
                            )}
                          >
                            {statusLabel(cell.status) === 'تم' ? (
                              <Check />
                            ) : statusLabel(cell.status) === 'لم يتم' ? (
                              <X />
                            ) : statusLabel(cell.status) === 'جزئي' ? (
                              <NotebookPen />
                            ) : null}
                          </span>
                        )}
                        {!cell && (
                          <span
                            className={cn(
                              'absolute size-full left-0 top-0 grid place-content-center'
                            )}
                          >
                            -
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NotesGrid({
  tracker,
  projectId,
  sectionId,
}: {
  tracker: NotesTracker;
  projectId: string;
  sectionId: string;
}) {
  const { updateTracker } = useAppActions();

  if (!tracker.items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
        أضف عناصر متابَعة لتظهر مخططات الملاحظات هنا.
      </div>
    );
  }

  const dateRange = buildDateRange(tracker.startDate, tracker.endDate, 14);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <table className="min-w-full border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky right-0 z-10 bg-background px-4 py-3 text-center font-semibold text-foreground shadow-[2px_0_6px_rgba(15,23,42,0.08)] backdrop-blur">
              العنصر
            </th>
            {dateRange.map((date) => {
              const dateKey = toAppDateString(date);
              return (
                <th
                  key={dateKey}
                  className="min-w-[88px] bg-white/5 px-3 py-2 text-center font-medium text-muted-foreground"
                >
                  <div>{format(date, 'd MMM', { locale: ar })}</div>
                  <div className="text-[10px] text-muted-foreground/80">
                    {weekdayLabels[date.getDay()]}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tracker.items.map((item) => {
            const cells = tracker.cells?.[item.id] ?? {};
            return (
              <tr key={item.id} className="border-t border-border/60">
                <td className="sticky right-0 z-10 bg-background min-w-[115px] px-4 py-3 text-sm text-center text-foreground shadow-[2px_0_6px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                  {item.label}
                </td>
                {dateRange.map((date) => {
                  const iso = toAppDateString(date);
                  const note = cells?.[iso]?.note;
                  const isActive = tracker.activeWeekdays.includes(
                    date.getDay()
                  );
                  return (
                    <td
                      key={iso}
                      className="min-w-[88px] border-l border-border/40 p-0 text-center"
                    >
                      <NotesCell
                        active={isActive}
                        note={note}
                        onSave={(value) => {
                          const trimmed = value?.trim();
                          const itemCells = {
                            ...(tracker.cells?.[item.id] ?? {}),
                          };
                          if (trimmed && trimmed.length) {
                            itemCells[iso] = {
                              note: trimmed,
                              updatedAt: new Date().toISOString(),
                            };
                          } else {
                            delete itemCells[iso];
                          }
                          updateTracker(projectId, sectionId, tracker.id, {
                            cells: {
                              ...tracker.cells,
                              [item.id]: itemCells,
                            },
                          });
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NotesCell({
  active,
  note,
  onSave,
}: {
  active: boolean;
  note?: string;
  onSave: (value?: string) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(note ?? '');

  React.useEffect(() => {
    setDraft(note ?? '');
  }, [note]);

  if (!active) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30 px-3 py-3 text-muted-foreground/70">
        —
      </div>
    );
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={cn(
          'flex h-full w-full items-center justify-center px-3 py-3 text-[11px] text-muted-foreground transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        {note ? (
          <span className="line-clamp-2 text-start">{note}</span>
        ) : (
          'أضف ملاحظة'
        )}
      </button>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-2 bg-background/95 px-3 py-3">
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-20 w-full resize-none rounded-xl border border-border/60 bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="اكتب ملاحظتك..."
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full px-4 py-1 text-xs"
          onClick={() => {
            setDraft(note ?? '');
            setIsEditing(false);
          }}
        >
          إلغاء
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-full bg-primary px-4 py-1 text-xs text-primary-foreground"
          onClick={() => {
            const trimmed = draft.trim();
            onSave(trimmed || undefined);
            setIsEditing(false);
          }}
        >
          حفظ
        </Button>
      </div>
    </div>
  );
}
