"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Layers, Table2, Sparkles } from "lucide-react";
import { ar } from "date-fns/locale";
import { AppShell } from "@/components/layout/app-shell";
import { MainHeader } from "@/components/layout/main-header";
import { SectionList } from "@/components/sections/section-list";
import { SectionCreateSheet } from "@/components/sections/section-create-sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { ProfileSheet } from "@/components/profile/profile-sheet";
import { formatAppDate } from "@/lib/date";

type ProjectPageProps = {
  params: { projectId: string };
};

const formatDate = (date: string | null | undefined) => formatAppDate(date, "d MMMM yyyy", { locale: ar });

export default function ProjectPage({ params }: ProjectPageProps) {
  const [isSectionSheetOpen, setIsSectionSheetOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const project = useAppStore(
    React.useCallback(
      (state) => state.projects.find((item) => item.id === params.projectId),
      [params.projectId],
    ),
  );

  const sections = project?.sections ?? [];
  const trackerCount = sections.reduce((sum, section) => sum + section.trackers.length, 0);
  const handleCreateSection = React.useCallback(() => {
    setIsSectionSheetOpen(true);
  }, []);

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-4">
          <MainHeader onRequestProfile={() => setIsProfileOpen(true)} />
          <header className="glass-panel rounded-3xl p-6 shadow-glass">
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    معاينة المشروع
                  </span>
                  <h1 className="text-2xl font-semibold">
                    {project?.name ?? "مشروع غير معروف"}
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {project?.description?.trim()?.length
                      ? project.description
                      : "أضف نبذة ملهمة للمشروع لعرضها هنا ومساعدتك على التذكّر والتركيز على الأهداف."}
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-xs text-muted-foreground transition hover:border-border hover:bg-white/10"
                >
                  <ArrowRight className="size-4" />
                  الرجوع
                </Link>
              </div>

              <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur">
                  <CalendarDays className="size-4 text-primary" />
                  <div>
                    <p>تاريخ البداية</p>
                    <p className="text-foreground">{formatDate(project?.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur">
                  <CalendarDays className="size-4 text-primary/70" />
                  <div>
                    <p>{project?.endDate ? "تاريخ النهاية" : "حالة المشروع"}</p>
                    <p className="text-foreground">
                      {project?.endDate ? formatDate(project.endDate) : "مفتوح بلا تاريخ نهاية"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur">
                  <Layers className="size-4 text-primary/70" />
                  <div>
                    <p>عدد الأقسام</p>
                    <p className="text-foreground">{sections.length} قسم</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-primary/5 p-3 text-xs text-primary">
                <Table2 className="size-4" />
                {trackerCount > 0
                  ? `يضم المشروع حالياً ${trackerCount} جدول متابعة عبر أقسامه المختلفة.`
                  : "قم بإضافة الأقسام والجداول لبدء متابعة الإنجازات اليومية."}
              </div>
            </div>
          </header>
        </div>
      }
    >
      <Tabs defaultValue="sections" className="flex flex-col gap-6">
        <TabsList className="glass-panel-muted flex w-full justify-evenly rounded-3xl border border-border/60 text-sm">
          <TabsTrigger value="overview" className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="sections" className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            الأقسام
          </TabsTrigger>
          <TabsTrigger value="stats" className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            الإحصاءات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-4">
          <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up text-center">
            <Sparkles className="mx-auto size-10 text-primary" />
            <h3 className="mt-3 text-lg font-semibold">ملخص المشروع</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              أنشئ أقسامك الأولى وابدأ بتوزيع الجداول. سنعرض هنا ملخصات ذكية عن نشاط المشروع، التزامك، وأوقات الذروة
              عند توفر البيانات.
            </p>
          </section>
        </TabsContent>

        <TabsContent value="sections" className="mt-0">
          <SectionList
            projectId={project?.id ?? params.projectId}
            sections={sections}
            onCreate={handleCreateSection}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up text-center">
            <h3 className="text-lg font-semibold">لوحة الإحصاءات قادمة قريباً</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              سنقدم رسوماً بيانية صغيرة، مخططات حرارية، ومؤشرات تساعدك على تقييم التقدّم عبر أقسام المشروع. تابعنا أثناء بناء هذه اللوحة.
            </p>
            <Button className="mt-4 rounded-full bg-primary px-6 text-primary-foreground shadow-glow-soft" disabled>
              قيد التطوير
            </Button>
          </section>
        </TabsContent>
      </Tabs>
      <SectionCreateSheet
        projectId={project?.id ?? params.projectId}
        open={isSectionSheetOpen}
        onOpenChange={setIsSectionSheetOpen}
      />
      <ProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </AppShell>
  );
}
