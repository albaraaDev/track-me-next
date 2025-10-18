'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  CalendarDays,
  Filter,
  Layers,
  Table2,
  User2,
} from 'lucide-react';
import { ar } from 'date-fns/locale';
import { AppShell } from '@/components/layout/app-shell';
import { SectionList } from '@/components/sections/section-list';
import { SectionCreateSheet } from '@/components/sections/section-create-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';
import { ProfileSheet } from '@/components/profile/profile-sheet';
import { formatAppDate } from '@/lib/date';
import { ProjectOverview } from '@/components/projects/project-overview';
import { computeProjectMetrics } from '@/lib/stats';
import { ProjectFilters } from '@/components/projects/project-filters';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const ProjectStats = dynamic(
  () =>
    import('@/components/projects/project-stats').then(
      (mod) => mod.ProjectStats
    ),
  { ssr: false }
);

type ProjectPageProps = {
  params: { projectId: string };
};

const formatDate = (date: string | null | undefined) =>
  formatAppDate(date, 'd MMMM yyyy', { locale: ar });

export default function ProjectPage({ params }: ProjectPageProps) {
  const [isSectionSheetOpen, setIsSectionSheetOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const project = useAppStore(
    React.useCallback(
      (state) => state.projects.find((item) => item.id === params.projectId),
      [params.projectId]
    )
  );
  const filters = useAppStore((state) => state.filters);
  const metrics = React.useMemo(
    () => computeProjectMetrics(project, filters),
    [project, filters]
  );

  const sections = project?.sections ?? [];
  const trackerCount = sections.reduce(
    (sum, section) => sum + section.trackers.length,
    0
  );
  const handleCreateSection = React.useCallback(() => {
    setIsSectionSheetOpen(true);
  }, []);

  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const openFilters = React.useCallback(() => {
    setIsFiltersOpen(true);
  }, []);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !hasHydrated) {
    return (
      <AppShell
        header={
          <div className="flex flex-col gap-4">
            <div className="glass-panel h-40 rounded-3xl animate-pulse" />
          </div>
        }
      >
        <section className="glass-panel h-64 rounded-3xl animate-pulse" />
      </AppShell>
    );
  }

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-4">
          <header className="glass-panel rounded-3xl p-4 shadow-glass">
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border/70 size-10 text-xs text-muted-foreground transition hover:border-border hover:bg-white/10 shrink-0"
                >
                  <ArrowRight className="size-4" />
                </Link>
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between items-center gap-4">
                    <h1 className="text-xl font-bold">
                      {project?.name ?? 'مشروع غير معروف'}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 rounded-2xl bg-primary/5 p-3 text-xs text-primary shrink-0">
                        <Table2 className="size-4" />
                        {trackerCount > 0 ? trackerCount : 'لا توجد جداول بعد'}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-border/60 text-xs text-muted-foreground hover:text-foreground grid place-content-center p-0 size-10"
                        onClick={openFilters}
                      >
                        <Filter className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm shrink text-muted-foreground">
                    {project?.description?.trim()?.length
                      ? project.description
                      : 'أضف نبذة ملهمة للمشروع لعرضها هنا.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-xs text-muted-foreground grid-cols-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-3 backdrop-blur">
                  <CalendarDays className="size-4 text-primary" />
                  <div>
                    <p>تاريخ البداية</p>
                    <p className="text-foreground">
                      {formatDate(project?.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-3 backdrop-blur">
                  <CalendarDays className="size-4 text-primary/70" />
                  <div>
                    <p>{project?.endDate ? 'تاريخ النهاية' : 'حالة المشروع'}</p>
                    <p className="text-foreground">
                      {project?.endDate
                        ? formatDate(project.endDate)
                        : 'مفتوح بلا تاريخ نهاية'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-3 backdrop-blur max-sm:col-span-2">
                  <Layers className="size-4 text-primary/70" />
                  <div>
                    <p>عدد الأقسام</p>
                    <p className="text-foreground">{sections.length} قسم</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>
      }
    >
      <Tabs defaultValue="sections" className="flex flex-col gap-6" dir="rtl">
        <TabsList className="glass-panel-muted flex w-full justify-evenly rounded-3xl border border-border/60 text-sm">
          <TabsTrigger
            value="overview"
            className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger
            value="sections"
            className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            الأقسام
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            الإحصاءات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-4">
          <ProjectOverview project={project} metrics={metrics} />
        </TabsContent>

        <TabsContent value="sections" className="mt-0">
          <SectionList
            projectId={project?.id ?? params.projectId}
            sections={sections}
            onCreate={handleCreateSection}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-0 space-y-4">
          <ProjectStats project={project} metrics={metrics} />
        </TabsContent>
      </Tabs>
      <SectionCreateSheet
        projectId={project?.id ?? params.projectId}
        open={isSectionSheetOpen}
        onOpenChange={setIsSectionSheetOpen}
      />
      <ProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent
          side="bottom"
          className="glass-panel max-h-[80vh] overflow-y-auto rounded-t-[2.5rem] border border-border p-6 shadow-glow-soft"
        >
          <ProjectFilters projectId={project?.id ?? params.projectId} />
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
