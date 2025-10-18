'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Table2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { useAppStore } from '@/store/app-store';
import { ar } from 'date-fns/locale';
import { TrackerPreview } from '@/components/trackers/tracker-preview';
import { Button } from '@/components/ui/button';
import { TrackerCreateSheet } from '@/components/trackers/tracker-create-sheet';
import { ProfileSheet } from '@/components/profile/profile-sheet';
import { formatAppDate } from '@/lib/date';
import { useHasMounted } from '@/hooks/use-has-mounted';

type SectionPageProps = {
  params: { projectId: string; sectionId: string };
};

export default function SectionPage({ params }: SectionPageProps) {
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
  const [isTrackerSheetOpen, setIsTrackerSheetOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const hasMounted = useHasMounted();

  const formatDate = React.useCallback(
    (date: string | null | undefined) =>
      formatAppDate(date, 'd MMMM yyyy', { locale: ar }),
    []
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
                <div className="grid gap-3 text-xs text-muted-foreground grid-cols-2">
                  <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
                  <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
                </div>
              </div>
            </header>
          </div>
        }
      >
        <section className="flex flex-col gap-4 rounded-3xl">
          <div className="flex items-center justify-between gap-2">
            <div className="h-6 w-32 rounded-full bg-muted animate-pulse" />
            <div className="h-10 w-28 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="glass-panel h-64 rounded-3xl animate-pulse" />
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-4">
          <header className="glass-panel rounded-3xl p-6 shadow-glass">
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <Link
                  href={`/projects/${params.projectId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border/70 size-10 text-xs text-muted-foreground transition hover:border-border hover:bg-white/10 shrink-0"
                >
                  <ArrowRight className="size-4" />
                </Link>
                <div className="space-y-2 flex-1">
                  <div className="flex gap-4 justify-between items-center">
                    <h1 className="text-2xl font-semibold">
                      {section?.name ?? 'ملخص القسم'}
                    </h1>
                    <div className="flex items-center gap-2 rounded-2xl bg-primary/5 p-3 text-xs text-primary shrink-0">
                      <Table2 className="size-4" />
                      {trackerCount > 0 ? trackerCount : 'لا توجد جداول بعد'}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {section?.description?.trim()?.length
                      ? section.description
                      : 'أضف وصفاً للقسم لتتذكر هدفه ودوره داخل المشروع.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-xs text-muted-foreground grid-cols-2">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-3 backdrop-blur">
                  <CalendarDays className="size-4 text-primary" />
                  <div>
                    <p>تاريخ البداية</p>
                    <p className="text-foreground">
                      {formatDate(section?.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-3 backdrop-blur">
                  <CalendarDays className="size-4 text-primary/70" />
                  <div>
                    <p>تاريخ آخر تحديث</p>
                    <p className="text-foreground">
                      {section?.updatedAt ? formatDate(section.updatedAt) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>
      }
    >
      <section className="flex flex-col gap-4 rounded-3xl animate-fade-in-up">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">جداول المتابعة</h2>
          </div>
          <Button
            className="rounded-full bg-primary px-6 text-primary-foreground"
            onClick={() => setIsTrackerSheetOpen(true)}
          >
            إضافة جدول
          </Button>
        </div>
        <TrackerPreview
          trackers={section?.trackers ?? []}
          projectId={project?.id ?? params.projectId}
          sectionId={section?.id ?? params.sectionId}
        />
      </section>

      <TrackerCreateSheet
        projectId={project?.id ?? params.projectId}
        sectionId={section?.id ?? params.sectionId}
        open={isTrackerSheetOpen}
        onOpenChange={setIsTrackerSheetOpen}
      />
      <ProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </AppShell>
  );
}
