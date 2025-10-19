'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Edit,
  EllipsisVertical,
  Eraser,
  GripVertical,
  Minus,
  NotebookPen,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { Tracker } from '@/domain/types';
import { cn } from '@/lib/utils';
import { useAppActions } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatAppDate, parseAppDate, toAppDateString } from '@/lib/date';
import { useToast } from '@/hooks/use-toast';
import { TrackerEditSheet } from './tracker-edit-sheet';
import { TrackerDeleteDialog } from './tracker-delete-dialog';
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
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TrackerPreviewProps = {
  trackers: Tracker[];
  projectId: string;
  sectionId: string;
  groupId?: string | null;
  onRequestUngroup?: (trackerId: string) => void;
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
  groupId = null,
  onRequestUngroup,
}: TrackerPreviewProps) {
  const { toast } = useToast();
  const { removeTracker, reorderTrackers } = useAppActions();
  const [editTrackerId, setEditTrackerId] = React.useState<string | null>(null);
  const [deleteTrackerId, setDeleteTrackerId] = React.useState<string | null>(
    null
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const targetIndex = trackers.findIndex((tracker) => tracker.id === over.id);
      if (targetIndex < 0) return;
      reorderTrackers(projectId, sectionId, active.id as string, targetIndex, {
        groupId: groupId ?? null,
      });
    },
    [projectId, reorderTrackers, sectionId, trackers, groupId]
  );

  const trackerMap = React.useMemo(() => {
    const map = new Map<string, Tracker>();
    trackers.forEach((tracker) => {
      map.set(tracker.id, tracker);
    });
    return map;
  }, [trackers]);

  const handleConfirmDelete = React.useCallback(() => {
    if (!deleteTrackerId) return;
    const tracker = trackerMap.get(deleteTrackerId);
    removeTracker(projectId, sectionId, deleteTrackerId);
    toast({
      title: 'تم حذف الجدول',
      description: tracker
        ? `حُذف الجدول "${tracker.title}" بنجاح.`
        : 'تم حذف جدول المتابعة بنجاح.',
      variant: 'destructive',
    });
    setDeleteTrackerId(null);
  }, [deleteTrackerId, trackerMap, removeTracker, projectId, sectionId, toast]);

  if (!trackers.length) {
    const title = groupId
      ? 'لا توجد جداول داخل هذه المجموعة بعد'
      : 'لم يتم إنشاء أي جداول متابعة بعد';
    const description = groupId
      ? 'أضف جدولاً جديداً أو انقل جدولاً موجوداً إلى هذه المجموعة عبر التعديل.'
      : 'أنشئ جدول متابعة للحالات أو الملاحظات لتبدأ بتسجيل إنجازاتك اليومية داخل القسم.';
    return (
      <div className="glass-panel rounded-3xl p-6 text-center shadow-glass">
        <Table2 className="mx-auto size-10 text-primary" />
        <h3 className="mt-3 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={trackers.map((tracker) => tracker.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3" dir="rtl">
            {trackers.map((tracker) => (
              <SortableTrackerItem
                key={tracker.id}
                tracker={tracker}
                projectId={projectId}
                sectionId={sectionId}
                onEdit={() => setEditTrackerId(tracker.id)}
                onDelete={() => setDeleteTrackerId(tracker.id)}
                isActive={activeId === tracker.id}
                groupId={groupId}
                onRequestUngroup={groupId ? onRequestUngroup : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editTrackerId ? (
        <TrackerEditSheet
          projectId={projectId}
          sectionId={sectionId}
          trackerId={editTrackerId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditTrackerId(null);
            }
          }}
        />
      ) : null}

      <TrackerDeleteDialog
        trackerName={
          deleteTrackerId
            ? trackerMap.get(deleteTrackerId)?.title ?? 'هذا الجدول'
            : 'هذا الجدول'
        }
        open={deleteTrackerId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTrackerId(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
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

type StatusEditorState = {
  trackerId: string;
  trackerTitle: string;
  itemId: string;
  itemLabel: string;
  iso: string;
  currentStatus: StatusTracker['cells'][string][string]['status'] | null;
  currentNote: string | null;
  nextStatus: StatusTracker['cells'][string][string]['status'] | null;
  noteDraft: string;
};

type StatusPreviewState = {
  trackerId: string;
  trackerTitle: string;
  itemId: string;
  itemLabel: string;
  iso: string;
  status: StatusTracker['cells'][string][string]['status'];
  note: string;
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

type SortableTrackerItemProps = {
  tracker: Tracker;
  projectId: string;
  sectionId: string;
  onEdit: () => void;
  onDelete: () => void;
  isActive: boolean;
  groupId?: string | null;
  onRequestUngroup?: (trackerId: string) => void;
};

function SortableTrackerItem({
  tracker,
  projectId,
  sectionId,
  onEdit,
  onDelete,
  isActive,
  groupId = null,
  onRequestUngroup,
}: SortableTrackerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tracker.id });
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = React.useState(false);
  const description = tracker.description?.trim() ?? '';
  const hasDescription = description.length > 0;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-2xl border border-border/50 bg-white/5 px-4 py-3 backdrop-blur transition',
        isDragging ? 'opacity-80 shadow-glow-soft' : undefined
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-start gap-3">
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label="إعادة ترتيب الجدول"
              className={cn(
                'glass-panel-muted flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive || isDragging ? 'text-foreground' : undefined
              )}
            >
              <GripVertical className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="flex flex-1 items-center justify-between gap-3 text-right"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="text-xl">
                    {tracker.icon || (tracker.type === 'status' ? '📊' : '📝')}
                  </span>
                  {tracker.title}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{formatDate(tracker.startDate)}</span>
                  <span>⇠</span>
                  <span>{tracker.endDate ? formatDate(tracker.endDate) : 'متابعة مفتوحة'}</span>
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'size-4 text-muted-foreground transition-transform duration-200 ease-out',
                  isExpanded ? 'rotate-180' : 'rotate-0'
                )}
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="glass-panel-muted size-9 rounded-full border border-border/60 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <EllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass-panel rounded-2xl border border-border/50 p-1 text-right text-sm"
              >
                {groupId ? (
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-foreground"
                    onSelect={() => onRequestUngroup?.(tracker.id)}
                  >
                    إزالة من المجموعة
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="flex items-center gap-2 text-foreground"
                  disabled={!hasDescription}
                  onSelect={() => hasDescription && setIsDescriptionOpen(true)}
                >
                  <NotebookPen className="size-4 text-primary" />
                  عرض الوصف
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-foreground"
                  onSelect={onEdit}
                >
                  <Edit className="size-4 text-green-500" />
                  تعديل الجدول
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-destructive"
                  onSelect={onDelete}
                >
                  <Trash2 className="size-4" />
                  حذف الجدول
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isExpanded ? (
          <div className="space-y-4 border-t border-border/40 pt-3">
            <TrackerMeta tracker={tracker} />
            {tracker.type === 'status' ? (
              <StatusTrackerPreview
                tracker={tracker as StatusTracker}
                projectId={projectId}
                sectionId={sectionId}
              />
            ) : (
              <NotesTrackerPreview
                tracker={tracker as NotesTracker}
                projectId={projectId}
                sectionId={sectionId}
              />
            )}
          </div>
        ) : null}
      </div>
      <Dialog open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
        <DialogContent className="glass-panel max-w-md rounded-3xl border border-border/70 text-right shadow-glow-soft">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              وصف الجدول
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {tracker.title}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-relaxed text-foreground">
            {hasDescription ? description : 'لا يوجد وصف لهذا الجدول حالياً.'}
          </div>
          <DialogFooter className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setIsDescriptionOpen(false)}
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [statusEditor, setStatusEditor] =
    React.useState<StatusEditorState | null>(null);
  const openEditor = React.useCallback(
    (itemId: string, isoDate: string) => {
      const cell = tracker.cells?.[itemId]?.[isoDate];
      const item = tracker.items.find((entry) => entry.id === itemId);
      setStatusEditor({
        trackerId: tracker.id,
        trackerTitle: tracker.title,
        itemId,
        itemLabel: item?.label ?? 'عنصر',
        iso: isoDate,
        currentStatus: cell?.status ?? null,
        currentNote: cell?.note ?? null,
        nextStatus: cell?.status ?? 'done',
        noteDraft: cell?.note ?? '',
      });
    },
    [tracker]
  );
  const [notePreview, setNotePreview] =
    React.useState<StatusPreviewState | null>(null);

  const openPreview = React.useCallback(
    (itemId: string, isoDate: string) => {
      const cell = tracker.cells?.[itemId]?.[isoDate];
      if (!cell || !cell.note) return;
      const item = tracker.items.find((entry) => entry.id === itemId);
      setNotePreview({
        trackerId: tracker.id,
        trackerTitle: tracker.title,
        itemId,
        itemLabel: item?.label ?? 'عنصر',
        iso: isoDate,
        status: cell.status,
        note: cell.note,
      });
    },
    [tracker]
  );

  const handlePreviewEdit = React.useCallback(() => {
    if (!notePreview) return;
    const { itemId, iso } = notePreview;
    setNotePreview(null);
    openEditor(itemId, iso);
  }, [notePreview, openEditor]);

  const handleDeleteNote = React.useCallback(() => {
    if (!notePreview) return;
    const nextCells = { ...(tracker.cells ?? {}) };
    const itemCells = { ...(nextCells[notePreview.itemId] ?? {}) };
    const existing = itemCells[notePreview.iso];
    if (!existing) {
      setNotePreview(null);
      return;
    }
    itemCells[notePreview.iso] = {
      ...existing,
      note: undefined,
      updatedAt: new Date().toISOString(),
    };
    nextCells[notePreview.itemId] = itemCells;
    updateTracker(projectId, sectionId, tracker.id, {
      cells: nextCells,
    });
    setNotePreview(null);
  }, [
    notePreview,
    tracker.cells,
    updateTracker,
    projectId,
    sectionId,
    tracker.id,
  ]);

  const closeEditor = React.useCallback((open: boolean) => {
    if (!open) {
      setStatusEditor(null);
    }
  }, []);

  const commitStatus = React.useCallback(() => {
    if (!statusEditor) return;
    const nextCells = { ...(tracker.cells ?? {}) };
    const itemCells = { ...(nextCells[statusEditor.itemId] ?? {}) };
    const trimmed = statusEditor.noteDraft.trim();

    if (!statusEditor.nextStatus) {
      delete itemCells[statusEditor.iso];
      if (Object.keys(itemCells).length) {
        nextCells[statusEditor.itemId] = itemCells;
      } else {
        delete nextCells[statusEditor.itemId];
      }
      updateTracker(projectId, sectionId, tracker.id, {
        cells: nextCells,
      });
      setStatusEditor(null);
      return;
    }

    itemCells[statusEditor.iso] = {
      status: statusEditor.nextStatus,
      note: trimmed || undefined,
      updatedAt: new Date().toISOString(),
    };
    nextCells[statusEditor.itemId] = itemCells;
    updateTracker(projectId, sectionId, tracker.id, {
      cells: nextCells,
    });
    setStatusEditor(null);
  }, [
    statusEditor,
    tracker.cells,
    updateTracker,
    projectId,
    sectionId,
    tracker.id,
  ]);

  const statusCards: Array<{
    value: StatusTracker['cells'][string][string]['status'] | null;
    title: string;
    description: string;
    accent: string;
    icon: React.ReactNode;
  }> = [
    {
      value: 'done',
      title: 'إنجاز كامل',
      description: 'أُنجز العنصر كما خُطط له؛ يمكنك توثيق تفاصيل إضافية.',
      accent: 'border-status-done/50 bg-status-done/10 text-status-done',
      icon: <Check className="size-5" />,
    },
    {
      value: 'partial',
      title: 'إنجاز جزئي',
      description: 'أنجزت جزءاً من المهمة وتحتاج لتوثيق ما تبقى.',
      accent:
        'border-status-partial/50 bg-status-partial/10 text-status-partial',
      icon: <Minus className="size-5" />,
    },
    {
      value: 'missed',
      title: 'لم يتم التنفيذ',
      description: 'لم يكتمل الإنجاز اليوم—شارك السبب لنتعلم منه.',
      accent: 'border-status-missed/50 bg-status-missed/10 text-status-missed',
      icon: <X className="size-5" />,
    },
    {
      value: null,
      title: 'إزالة الحالة',
      description: 'إعادة اليوم إلى وضعه المحايد دون أي حالة مسجلة.',
      accent: 'border-border/60 bg-white/5 text-muted-foreground',
      icon: <Eraser className="size-5" />,
    },
  ];

  const showNoteField =
    statusEditor?.nextStatus !== null && statusEditor?.nextStatus !== undefined;
  const formattedDate = statusEditor
    ? formatAppDate(statusEditor.iso, 'd MMM yyyy')
    : null;
  const previewDate = notePreview
    ? formatAppDate(notePreview.iso, 'd MMM yyyy')
    : null;
  const trimmedDraft = statusEditor ? statusEditor.noteDraft.trim() : '';
  const trimmedCurrentNote = statusEditor?.currentNote?.trim() ?? '';
  const noteLength = trimmedDraft.length;
  const currentStatusLabel = statusEditor?.currentStatus
    ? statusLabel(statusEditor.currentStatus)
    : 'بدون حالة';
  const nextStatusLabel =
    statusEditor?.nextStatus !== null && statusEditor?.nextStatus !== undefined
      ? statusLabel(statusEditor.nextStatus)
      : 'إزالة الحالة';
  const noteChanged =
    !!statusEditor &&
    statusEditor.nextStatus !== null &&
    trimmedDraft !== trimmedCurrentNote;
  const statusChanged =
    statusEditor?.nextStatus !== statusEditor?.currentStatus || noteChanged;

  const handlePickStatus = React.useCallback(
    (value: StatusTracker['cells'][string][string]['status'] | null) => {
      setStatusEditor((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nextStatus: value,
          noteDraft: value === null ? '' : prev.noteDraft,
        };
      });
    },
    [setStatusEditor]
  );

  if (!tracker.items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
        أضف عناصر متابعة لعرض الشبكة هنا.
      </div>
    );
  }

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
                    const hasNote =
                      !!cell &&
                      typeof cell.note === 'string' &&
                      cell.note.trim().length > 0;
                    return (
                      <td
                        key={iso}
                        className="min-w-[95px] border-l border-border/40 p-0 text-center relative"
                      >
                        <StatusCell
                          active={isActive}
                          cell={cell}
                          onOpen={() => {
                            if (!isActive) return;
                            openEditor(item.id, iso);
                          }}
                          onPreview={
                            hasNote ? () => openPreview(item.id, iso) : undefined
                          }
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

      <Dialog
        open={!!notePreview}
        onOpenChange={(open) => !open && setNotePreview(null)}
      >
        <DialogContent className="glass-panel max-w-sm rounded-3xl border border-border/70 text-right shadow-glow-soft">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              ملاحظة الحالة
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {notePreview?.trackerTitle} • {notePreview?.itemLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p className="text-xs text-muted-foreground">
              التاريخ: {previewDate ?? '—'} • الحالة:{' '}
              {notePreview ? statusLabel(notePreview.status) : '—'}
            </p>
            <p>{notePreview?.note ?? 'لا توجد ملاحظة مسجلة.'}</p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setNotePreview(null)}
            >
              إغلاق
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={handlePreviewEdit}
            >
              تعديل
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={handleDeleteNote}
            >
              حذف الملاحظة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!statusEditor} onOpenChange={closeEditor}>
        <SheetContent
          side="bottom"
          className="glass-panel max-h-[75vh] overflow-y-auto rounded-t-[2rem] border border-border shadow-glow-soft"
        >
          <SheetHeader className="text-right">
            <SheetTitle>
              <span>تحديث الحالة</span>
            </SheetTitle>
            <SheetDescription>
              <div className="flex justify-between items-center">
                <span>
                  {statusEditor?.trackerTitle} • {statusEditor?.itemLabel}
                </span>
                {formattedDate ?? '—'}
              </div>
            </SheetDescription>
          </SheetHeader>

          {statusEditor ? (
            <div className="mt-6 space-y-6 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    اختر الحالة
                  </p>
                  <span className="rounded-full bg-status-done/10 px-3 py-1 text-center text-status-done text-xs">
                    الحالة الحالية: {currentStatusLabel}
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  {statusCards.map((card) => {
                    const isActive = statusEditor.nextStatus === card.value;
                    return (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => handlePickStatus(card.value)}
                        className={cn(
                          'rounded-3xl border p-4 text-right transition shadow-sm hover:shadow-glow-soft text-xs sm:text-sm',
                          isActive
                            ? `${card.accent} shadow-glow-soft`
                            : 'border-border/60 bg-white/5 text-muted-foreground hover:bg-white/10'
                        )}
                        aria-pressed={isActive}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'grid size-9 place-content-center rounded-2xl border',
                              isActive
                                ? 'border-current bg-background/70'
                                : 'border-border/40 bg-background/60'
                            )}
                          >
                            {card.icon}
                          </span>
                          {isActive ? (
                            <span className="rounded-full border border-current/40 px-2 py-0.5 text-[11px]">
                              مختارة
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {card.title}
                          </p>
                          <p className="text-[11px] leading-5 text-muted-foreground">
                            {card.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showNoteField && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="status-note-field"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      ملاحظة مرافقة
                    </label>
                    {showNoteField ? (
                      <span className="text-[11px] text-muted-foreground/80">
                        {noteLength} حرف
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/70">
                        لا حاجة لملاحظة مع هذه الحالة
                      </span>
                    )}
                  </div>
                  <Textarea
                    id="status-note-field"
                    rows={4}
                    disabled={!showNoteField}
                    value={statusEditor.noteDraft}
                    onChange={(event) => {
                      if (!showNoteField) return;
                      const nextNote = event.target.value;
                      setStatusEditor((prev) =>
                        prev ? { ...prev, noteDraft: nextNote } : prev
                      );
                    }}
                    className={cn(
                      'w-full rounded-3xl h-12 border border-border/60 bg-white/5 p-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition',
                      !showNoteField && 'cursor-not-allowed opacity-50'
                    )}
                    placeholder={
                      'دوّن ما حدث اليوم، سواء تفاصيل النجاح أو ملاحظات للمستقبل.'
                    }
                  />
                </div>
              )}
            </div>
          ) : null}
          <SheetFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="rounded-full bg-primary px-6 text-primary-foreground shadow-glow-soft"
              onClick={commitStatus}
            >
              حفظ الحالة
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setStatusEditor(null)}
            >
              إلغاء
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
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
    [editing, tracker.cells, updateTracker, projectId, sectionId, tracker.id]
  );

  const handleCloseSheet = React.useCallback((open: boolean) => {
    if (!open) {
      setEditing(null);
    }
  }, []);

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

      <Dialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
      >
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
          className="glass-panel max-h-[75vh] overflow-y-auto rounded-t-[2rem] border border-border shadow-glow-soft"
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
              className="w-full rounded-2xl border border-border/60 bg-white/5 p-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

type StatusCellProps = {
  active: boolean;
  cell?: StatusTracker['cells'][string][string];
  onOpen: () => void;
  onPreview?: () => void;
};

function StatusCell({ active, cell, onOpen, onPreview }: StatusCellProps) {
  const clickTimeoutRef = React.useRef<number | null>(null);
  const shouldPreview =
    !!onPreview &&
    active &&
    !!cell &&
    typeof cell.note === 'string' &&
    cell.note.trim().length > 0;

  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      disabled={!active}
      onClick={() => {
        if (!active) return;
        if (shouldPreview) {
          if (clickTimeoutRef.current !== null) return;
          clickTimeoutRef.current = window.setTimeout(() => {
            clickTimeoutRef.current = null;
            onPreview?.();
          }, 220);
          return;
        }
        onOpen();
      }}
      onDoubleClick={(event) => {
        if (!active) return;
        if (shouldPreview) {
          event.preventDefault();
          if (clickTimeoutRef.current !== null) {
            window.clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }
          onOpen();
          return;
        }
        onOpen();
      }}
      className={cn(
        'absolute top-0 left-0 size-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary z-20',
        !active && 'bg-muted/30 text-muted-foreground/70',
        active && 'bg-white/5 hover:bg-white/10'
      )}
    >
      {cell ? (
        <span
          className={cn(
            'absolute size-full left-0 top-0 grid place-content-center',
            statusColorMap[cell.status] ??
              'bg-white/10 text-foreground border-border/40'
          )}
        >
          {cell.note ? (
            <span className="absolute top-1 left-1 inline-flex size-2 rounded-full bg-primary" />
          ) : null}
          {statusLabel(cell.status) === 'تم' ? (
            <Check />
          ) : statusLabel(cell.status) === 'لم يتم' ? (
            <X />
          ) : statusLabel(cell.status) === 'جزئي' ? (
            <Minus />
          ) : (
            '×'
          )}
        </span>
      ) : active ? (
        <span className="absolute size-full left-0 top-0 grid place-content-center">
          -
        </span>
      ) : (
        <span className="absolute size-full left-0 top-0 grid place-content-center cursor-not-allowed">
          ×
        </span>
      )}
    </button>
  );
}
