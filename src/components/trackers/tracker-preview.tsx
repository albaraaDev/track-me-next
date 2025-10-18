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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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

type NoteCellState = {
  itemId: string;
  itemLabel: string;
  iso: string;
  dateLabel: string;
  note: string | null;
};

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
    const counts = { done: 0, partial: 0, missed: 0 };
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
      const sequence: StatusTracker['cells'][string][string]['status'][] = [
        'done',
        'partial',
        'missed',
      ];

      const currentIndex = cell ? sequence.indexOf(cell.status) : -1;
      const nextIndex = currentIndex + 1;
      const nextCells = { ...(tracker.cells ?? {}) };
      const itemCells = { ...(nextCells[itemId] ?? {}) };

      if (nextIndex >= sequence.length) {
        delete itemCells[isoDate];
      } else {
        const nextStatus = sequence[nextIndex];
        itemCells[isoDate] = {
          status: nextStatus,
          note: cell?.note,
          updatedAt: new Date().toISOString(),
        };
      }

      if (Object.keys(itemCells).length === 0) {
        delete nextCells[itemId];
      } else {
        nextCells[itemId] = itemCells;
      }

      updateTracker(projectId, sectionId, tracker.id, {
        cells: nextCells,
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
                            ) : "×"}
                          </span>
                        )}
                        {!cell && isActive && (
                          <span
                            className={cn(
                              'absolute size-full left-0 top-0 grid place-content-center'
                            )}
                          >
                            -
                          </span>
                        )}
                        {!cell && !isActive && (
                          <span
                            className={cn(
                              'absolute size-full left-0 top-0 grid place-content-center cursor-not-allowed'
                            )}
                          >
                            ×
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
  const [preview, setPreview] = React.useState<NoteCellState | null>(null);
  const [editing, setEditing] = React.useState<NoteCellState | null>(null);
  const [draftNote, setDraftNote] = React.useState('');

  React.useEffect(() => {
    if (editing) {
      setDraftNote(editing.note ?? '');
    } else {
      setDraftNote('');
    }
  }, [editing]);

  const commitNote = React.useCallback(
    (nextValue: string) => {
      if (!editing) return;
      const trimmed = nextValue.trim();
      const nextCells = { ...(tracker.cells ?? {}) };
      const itemCells = { ...(nextCells[editing.itemId] ?? {}) };

      if (trimmed) {
        itemCells[editing.iso] = {
          note: trimmed,
          updatedAt: new Date().toISOString(),
        };
        nextCells[editing.itemId] = itemCells;
      } else {
        delete itemCells[editing.iso];
        if (Object.keys(itemCells).length > 0) {
          nextCells[editing.itemId] = itemCells;
        } else {
          delete nextCells[editing.itemId];
        }
      }

      updateTracker(projectId, sectionId, tracker.id, {
        cells: nextCells,
      });
      setEditing(null);
      setDraftNote('');
      setPreview((current) => {
        if (
          current &&
          current.itemId === editing.itemId &&
          current.iso === editing.iso
        ) {
          return { ...current, note: trimmed || null };
        }
        return current;
      });
    },
    [
      editing,
      tracker.cells,
      updateTracker,
      projectId,
      sectionId,
      tracker.id,
    ]
  );

  const handleCloseSheet = React.useCallback(
    (open: boolean) => {
      if (!open) {
        setEditing(null);
      }
    },
    []
  );

  if (!tracker.items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
        أضف عناصر متابَعة لتظهر مخططات الملاحظات هنا.
      </div>
    );
  }

  const dateRange = buildDateRange(tracker.startDate, tracker.endDate, 14);

  return (
    <>
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
                    const cellState: NoteCellState = {
                      itemId: item.id,
                      itemLabel: item.label,
                      iso,
                      dateLabel: format(date, 'EEEE، d MMMM yyyy', {
                        locale: ar,
                      }),
                      note: note ?? null,
                    };
                    return (
                      <td
                        key={iso}
                        className="min-w-[88px] border-l border-border/40 p-0 text-center relative"
                      >
                        <NotesCell
                          active={isActive}
                          note={note}
                          onPreview={() => setPreview(cellState)}
                          onEdit={() => {
                            setEditing(cellState);
                            setPreview(null);
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

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="glass-panel max-w-md rounded-3xl border border-border/60 text-right shadow-glow-soft">
          <DialogHeader className="text-right">
            <DialogTitle>تفاصيل الملاحظة</DialogTitle>
            <DialogDescription>
              {preview?.itemLabel} • {preview?.dateLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border/60 bg-white/5 p-4 text-sm leading-relaxed text-muted-foreground">
            {preview?.note ? preview.note : 'لا توجد ملاحظة مسجلة لهذا اليوم.'}
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setPreview(null)}
            >
              إغلاق
            </Button>
            <Button
              type="button"
              className="rounded-full bg-primary px-5 text-primary-foreground shadow-glow-soft"
              onClick={() => {
                if (!preview) return;
                setEditing(preview);
                setPreview(null);
              }}
            >
              {preview?.note ? 'تعديل' : 'إضافة ملاحظة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!editing} onOpenChange={handleCloseSheet}>
        <SheetContent
          side="bottom"
          className="glass-panel max-h-[75vh] overflow-y-auto rounded-t-[2rem] border border-border p-6 pb-16 shadow-glow-soft"
        >
          <SheetHeader className="text-right">
            <SheetTitle>تحرير الملاحظة</SheetTitle>
            <SheetDescription>
              {editing?.itemLabel} • {editing?.dateLabel}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <Textarea
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-border/60 bg-white/5 p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="اكتب ملاحظتك هنا..."
            />
            <p className="text-xs text-muted-foreground text-right">
              اترك الحقل فارغاً لإزالة الملاحظة لهذا اليوم.
            </p>
          </div>
          <SheetFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setEditing(null)}
            >
              إلغاء
            </Button>
            {(editing?.note || draftNote.trim().length > 0) && (
              <Button
                type="button"
                variant="destructive"
                className="rounded-full px-6 shadow-glow-soft"
                onClick={() => commitNote('')}
              >
                إزالة الملاحظة
              </Button>
            )}
            <Button
              type="button"
              className="rounded-full bg-primary px-6 text-primary-foreground shadow-glow-soft"
              onClick={() => commitNote(draftNote)}
            >
              حفظ
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function NotesCell({
  active,
  note,
  onPreview,
  onEdit,
}: {
  active: boolean;
  note?: string;
  onPreview: () => void;
  onEdit: () => void;
}) {
  const clickTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  if (!active) {
    return (
      <div className="flex size-full absolute top-0 left-0 items-center justify-center bg-muted/30 px-3 py-3 text-muted-foreground/70 cursor-not-allowed">
        ×
      </div>
    );
  }

  const handleClick = () => {
    if (clickTimeoutRef.current !== null) return;
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
      onPreview();
    }, 200);
  };

  const handleDoubleClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    onEdit();
  };

  return (
    <button
      type="button"
      onClick={note ? handleClick : handleDoubleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'flex size-full absolute top-0 left-0 items-center justify-center px-3 py-3 text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        note
          ? 'bg-primary/10 text-foreground hover:bg-primary/15'
          : 'text-muted-foreground hover:bg-white/10'
      )}
      title={note ?? undefined}
    >
      {note ? (
        <span className="line-clamp-1 size-full text-center">{note}</span>
      ) : (
        'أضف ملاحظة'
      )}
    </button>
  );
}
