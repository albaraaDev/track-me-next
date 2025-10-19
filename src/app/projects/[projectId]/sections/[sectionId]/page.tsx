'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Edit,
  EllipsisVertical,
  PlusCircle,
  Table2,
  Trash2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { useAppActions, useAppStore } from '@/store/app-store';
import { ar } from 'date-fns/locale';
import { formatAppDate } from '@/lib/date';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrackerPreview } from '@/components/trackers/tracker-preview';
import { TrackerCreateSheet } from '@/components/trackers/tracker-create-sheet';
import { GroupCreateSheet } from '@/components/groups/group-create-sheet';
import { GroupEditSheet } from '@/components/groups/group-edit-sheet';
import { GroupDeleteDialog } from '@/components/groups/group-delete-dialog';
import type { Group, Tracker, SectionView } from '@/domain/types';
import { cn } from '@/lib/utils';

type SectionPageProps = {
  params: { projectId: string; sectionId: string };
};

type GroupPanelProps = {
  group: Group;
  trackers: Tracker[];
  projectId: string;
  sectionId: string;
  onEdit: (groupId: string) => void;
  onDelete: (groupId: string) => void;
  onAddTracker: (groupId: string) => void;
  onUngroupTracker: (trackerId: string) => void;
};

function GroupPanel({
  group,
  trackers,
  projectId,
  sectionId,
  onEdit,
  onDelete,
  onAddTracker,
  onUngroupTracker,
}: GroupPanelProps) {
  const [expanded, setExpanded] = React.useState(true);
  const trackerCount = trackers.length;
  const description = group.description?.trim();

  return (
    <div className="glass-panel rounded-3xl p-4 shadow-glass">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="group flex flex-1 items-center gap-2 text-right justify-between"
          >
            <span className="text-lg font-semibold text-foreground">
              {group.title}
            </span>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2 rounded-2xl bg-primary/5 px-3 py-2 text-xs text-primary shrink-0">
                <Table2 className="size-4" />
                {trackerCount > 0 ? trackerCount : 'لا توجد جداول بعد'}
              </div>
              <span className="ms-auto inline-flex size-6 items-center justify-center">
                <ChevronDown
                  className={cn(
                    'size-4 text-muted-foreground transition-transform duration-200 ease-out',
                    expanded ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="glass-panel-muted size-9 rounded-full border border-border/60 text-muted-foreground"
                >
                  <EllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass-panel rounded-2xl border border-border/50 p-1 text-right text-sm"
              >
                <DropdownMenuItem onSelect={() => onAddTracker(group.id)}>
                  <PlusCircle className="text-green-500" />
                  إضافة جدول
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onEdit(group.id)}>
                  <Edit className="text-blue-500" />
                  تعديل المجموعة
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDelete(group.id)}>
                  <Trash2 className="text-red-500" />
                  حذف المجموعة
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        {expanded ? (
          <div className="mt-1">
            <TrackerPreview
              trackers={trackers}
              projectId={projectId}
              sectionId={sectionId}
              groupId={group.id}
              onRequestUngroup={onUngroupTracker}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SectionPage({ params }: SectionPageProps) {
  const { setSectionDefaultView, removeGroup, updateTracker } = useAppActions();
  const project = useAppStore(
    React.useCallback(
      (state) => state.projects.find((item) => item.id === params.projectId),
      [params.projectId]
    )
  );
  const section = project?.sections.find(
    (item) => item.id === params.sectionId
  );
  const trackerCount = section?.trackers.length ?? 0;

  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const hasMounted = useHasMounted();

  const [activeTab, setActiveTab] = React.useState<SectionView>('trackers');
  const lastDefaultViewRef = React.useRef<SectionView | null>(null);
  React.useEffect(() => {
    if (!section?.defaultView) return;
    if (lastDefaultViewRef.current !== section.defaultView) {
      lastDefaultViewRef.current = section.defaultView;
      setActiveTab(section.defaultView);
    }
  }, [section?.defaultView]);

  const [isTrackerSheetOpen, setIsTrackerSheetOpen] = React.useState(false);
  const [trackerSheetGroupId, setTrackerSheetGroupId] = React.useState<
    string | null
  >(null);
  const [isGroupCreateOpen, setIsGroupCreateOpen] = React.useState(false);
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(
    null
  );
  const [isGroupEditOpen, setIsGroupEditOpen] = React.useState(false);
  const [deletingGroupId, setDeletingGroupId] = React.useState<string | null>(
    null
  );
  const [isGroupDeleteOpen, setIsGroupDeleteOpen] = React.useState(false);

  const formatDate = React.useCallback(
    (date: string | null | undefined) =>
      formatAppDate(date, 'd MMMM yyyy', { locale: ar }),
    []
  );

  const trackerMap = React.useMemo(() => {
    const map = new Map<string, Tracker>();
    (section?.trackers ?? []).forEach((tracker) => {
      map.set(tracker.id, tracker);
    });
    return map;
  }, [section?.trackers]);

  const groupsWithTrackers = React.useMemo(
    () =>
      (section?.groups ?? []).map((group) => ({
        group,
        trackers: group.trackerIds
          .map((trackerId) => trackerMap.get(trackerId))
          .filter((item): item is Tracker => Boolean(item)),
      })),
    [section?.groups, trackerMap]
  );

  const ungroupedTrackers = React.useMemo(
    () => (section?.trackers ?? []).filter((tracker) => !tracker.groupId),
    [section?.trackers]
  );

  const handleTabChange = React.useCallback((value: string) => {
    if (value === 'groups' || value === 'trackers') {
      setActiveTab(value);
    }
  }, []);

  const handleSetDefaultView = React.useCallback(() => {
    if (!project?.id || !section?.id) return;
    setSectionDefaultView(project.id, section.id, activeTab);
  }, [activeTab, project?.id, section?.id, setSectionDefaultView]);

  const handleOpenTrackerSheet = React.useCallback(
    (groupId: string | null = null) => {
      setTrackerSheetGroupId(groupId);
      setIsTrackerSheetOpen(true);
    },
    []
  );

  const handleConfirmDeleteGroup = React.useCallback(() => {
    if (!project?.id || !section?.id || !deletingGroupId) return;
    removeGroup(project.id, section.id, deletingGroupId);
    setIsGroupDeleteOpen(false);
    setDeletingGroupId(null);
  }, [project?.id, section?.id, deletingGroupId, removeGroup]);

  const handleUngroupTracker = React.useCallback(
    (trackerId: string) => {
      if (!project?.id || !section?.id) return;
      updateTracker(project.id, section.id, trackerId, { groupId: null });
    },
    [project?.id, section?.id, updateTracker]
  );

  if (!hasMounted || !hasHydrated) {
    return (
      <AppShell
        header={
          <div className="flex flex-col gap-4">
            <header className="glass-panel rounded-3xl p-6 shadow-glass">
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="inline-flex size-10 items-center justify-center rounded-md border border-border/70 text-xs text-muted-foreground" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-40 rounded-full bg-muted animate-pulse" />
                    <div className="h-4 w-3/4 rounded-full bg-muted/80 animate-pulse" />
                  </div>
                  <div className="h-10 w-28 rounded-2xl bg-muted animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded-full bg-muted/70 animate-pulse" />
                  <div className="h-4 w-2/3 rounded-full bg-muted/60 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
                  <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
                </div>
              </div>
            </header>
          </div>
        }
      >
        <section className="flex flex-col gap-4 rounded-3xl">
          <div className="glass-panel h-64 rounded-3xl animate-pulse" />
        </section>
      </AppShell>
    );
  }

  if (!section || !project) {
    return (
      <AppShell>
        <section className="glass-panel rounded-3xl p-6 text-center shadow-glass">
          <h1 className="text-xl font-semibold text-foreground">
            لم يتم العثور على هذا القسم
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            تحقّق من الرابط أو عد إلى صفحة المشروع الرئيسية.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href={`/projects/${params.projectId}`}>
              العودة إلى المشروع
            </Link>
          </Button>
        </section>
      </AppShell>
    );
  }

  const deletingGroup = section.groups.find(
    (item) => item.id === deletingGroupId
  );

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-4">
          <header className="glass-panel rounded-3xl p-3 shadow-glass">
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <Link
                  href={`/projects/${params.projectId}`}
                  className="inline-flex size-10 items-center justify-center gap-2 rounded-md border border-border/70 text-xs text-muted-foreground transition hover:border-border hover:bg-white/10"
                >
                  <ArrowRight className="size-4" />
                </Link>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-semibold text-foreground">
                      {section.name}
                    </h1>
                    <div className="flex items-center gap-2 rounded-2xl bg-primary/5 px-3 py-2 text-xs text-primary">
                      <Table2 className="size-4" />
                      {trackerCount > 0
                        ? `${trackerCount}`
                        : 'لا توجد جداول بعد'}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {section.description?.trim()?.length
                      ? section.description
                      : 'أضف وصفاً للقسم لتتذكر هدفه ودوره داخل المشروع.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-3 dark:bg-white/5">
                  <CalendarDays className="size-4 text-primary" />
                  <div>
                    <p>تاريخ البداية</p>
                    <p className="text-foreground">
                      {formatDate(section.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-3 dark:bg-white/5">
                  <CalendarDays className="size-4 text-primary/70" />
                  <div>
                    <p>تاريخ آخر تحديث</p>
                    <p className="text-foreground">
                      {section.updatedAt ? formatDate(section.updatedAt) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>
      }
    >
      <section className="flex flex-col gap-6">
        <Tabs
          dir="rtl"
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col gap-4"
        >
          <TabsList className="glass-panel-muted flex w-full justify-evenly rounded-3xl border border-border/60 text-sm">
            <TabsTrigger
              value="trackers"
              className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              قائمة الجداول
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              قائمة المجموعات
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/60 text-xs text-muted-foreground hover:text-foreground"
              disabled={section.defaultView === activeTab}
              onClick={handleSetDefaultView}
            >
              {section.defaultView === activeTab
                ? 'هذا التبويب هو الافتراضي حالياً'
                : 'اجعل هذا التبويب افتراضياً'}
            </Button>
            {activeTab === 'groups' ? (
              <Button
                type="button"
                className="rounded-full bg-primary px-5 text-primary-foreground shadow-glow-soft"
                onClick={() => setIsGroupCreateOpen(true)}
              >
                <PlusCircle className="ms-2 size-4" />
                إضافة مجموعة
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-full bg-primary px-5 text-primary-foreground shadow-glow-soft"
                onClick={() => handleOpenTrackerSheet(null)}
              >
                <PlusCircle className="ms-2 size-4" />
                إضافة جدول
              </Button>
            )}
          </div>

          <TabsContent value="trackers" className="space-y-4">
            {ungroupedTrackers.length ? (
              <TrackerPreview
                trackers={ungroupedTrackers}
                projectId={project.id}
                sectionId={section.id}
              />
            ) : (
              <div className="glass-panel rounded-3xl p-6 text-center shadow-glass">
                <Table2 className="mx-auto size-10 text-primary" />
                <h3 className="mt-3 text-lg font-semibold">
                  لا توجد جداول غير مصنفة حالياً
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  يمكنك إنشاء جدول جديد أو نقل الجداول الموجودة إلى خارج
                  المجموعات من خلال التعديل.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            {groupsWithTrackers.length ? (
              groupsWithTrackers.map(({ group, trackers }) => (
                <GroupPanel
                  key={group.id}
                  group={group}
                  trackers={trackers}
                  projectId={project.id}
                  sectionId={section.id}
                  onEdit={(id) => {
                    setEditingGroupId(id);
                    setIsGroupEditOpen(true);
                  }}
                  onDelete={(id) => {
                    setDeletingGroupId(id);
                    setIsGroupDeleteOpen(true);
                  }}
                  onAddTracker={(id) => handleOpenTrackerSheet(id)}
                  onUngroupTracker={handleUngroupTracker}
                />
              ))
            ) : (
              <div className="glass-panel rounded-3xl p-6 text-center shadow-glass">
                <Table2 className="mx-auto size-10 text-primary" />
                <h3 className="mt-3 text-lg font-semibold">
                  لم يتم إنشاء مجموعات بعد
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  نظّم جداولك في مجموعات متخصصة لتقريب المهام المتشابهة أو
                  العادات ذات الصلة.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <TrackerCreateSheet
        projectId={project.id}
        sectionId={section.id}
        open={isTrackerSheetOpen}
        onOpenChange={(open) => {
          setIsTrackerSheetOpen(open);
          if (!open) {
            setTrackerSheetGroupId(null);
          }
        }}
        defaultGroupId={trackerSheetGroupId}
      />

      <GroupCreateSheet
        projectId={project.id}
        sectionId={section.id}
        open={isGroupCreateOpen}
        onOpenChange={setIsGroupCreateOpen}
      />

      {editingGroupId ? (
        <GroupEditSheet
          projectId={project.id}
          sectionId={section.id}
          groupId={editingGroupId}
          open={isGroupEditOpen}
          onOpenChange={(open) => {
            setIsGroupEditOpen(open);
            if (!open) {
              setEditingGroupId(null);
            }
          }}
        />
      ) : null}

      {deletingGroupId ? (
        <GroupDeleteDialog
          groupTitle={deletingGroup?.title ?? 'هذه المجموعة'}
          open={isGroupDeleteOpen}
          onOpenChange={(open) => {
            setIsGroupDeleteOpen(open);
            if (!open) {
              setDeletingGroupId(null);
            }
          }}
          onConfirm={handleConfirmDeleteGroup}
        />
      ) : null}
    </AppShell>
  );
}
