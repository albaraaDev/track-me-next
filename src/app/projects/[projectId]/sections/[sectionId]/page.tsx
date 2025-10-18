"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Table2, ChartBar, Check, X, Minus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MainHeader } from "@/components/layout/main-header";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { ar } from "date-fns/locale";
import { TrackerPreview } from "@/components/trackers/tracker-preview";
import { Button } from "@/components/ui/button";
import { TrackerCreateSheet } from "@/components/trackers/tracker-create-sheet";
import { ProfileSheet } from "@/components/profile/profile-sheet";
import { formatAppDate } from "@/lib/date";

type SectionPageProps = {
  params: { projectId: string; sectionId: string };
};

const sectionHighlights = [
  {
    title: "ترويسة القسم",
    description:
      "نوضح اسم القسم، وصفه، تاريخه، وعدد الجداول الحالية مع خيارات سريعة للتحرير أو الحذف.",
  },
  {
    title: "الجداول الزجاجية",
    description:
      "كل جدول يظهر في Accordion أنيق، يمكن طيّه أو فتحه بلمسة واحدة مع حركة سلسة.",
  },
  {
    title: "التفاعل السريع",
    description:
      "النقر المزدوج على الخلايا للتبديل بين الحالات أو تحرير الملاحظات، والضغط المطوّل لعرض التفاصيل.",
  },
];

export default function SectionPage({ params }: SectionPageProps) {
  const project = useAppStore(
    React.useCallback(
      (state) => state.projects.find((item) => item.id === params.projectId),
      [params.projectId],
    ),
  );
  const section = project?.sections.find((item) => item.id === params.sectionId);
  const trackerCount = section?.trackers.length ?? 0;
  const [isTrackerSheetOpen, setIsTrackerSheetOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const formatDate = React.useCallback(
    (date: string | null | undefined) => formatAppDate(date, "d MMMM yyyy", { locale: ar }),
    [],
  );

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-4">
          <MainHeader onRequestProfile={() => setIsProfileOpen(true)} />
          <header className="glass-panel rounded-3xl p-6 shadow-glass">
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                    {project?.name ?? "مشروع غير معروف"} → {section?.name ?? `قسم ${params.sectionId}`}
                  </span>
                  <h1 className="text-2xl font-semibold">{section?.name ?? "ملخص القسم"}</h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {section?.description?.trim()?.length
                      ? section.description
                      : "أضف وصفاً للقسم لتتذكر هدفه ودوره داخل المشروع."}
                  </p>
                </div>
                <Link
                  href={`/projects/${params.projectId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-xs text-muted-foreground transition hover:border-border hover:bg-white/10"
                >
                  <ArrowRight className="size-4" />
                  الرجوع للمشروع
                </Link>
              </div>

              <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur">
                  <CalendarDays className="size-4 text-primary" />
                  <div>
                    <p>تاريخ البداية</p>
                    <p className="text-foreground">{formatDate(section?.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur">
                  <CalendarDays className="size-4 text-primary/70" />
                  <div>
                    <p>تاريخ آخر تحديث</p>
                    <p className="text-foreground">
                      {section?.updatedAt ? formatDate(section.updatedAt) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur">
                  <Table2 className="size-4 text-primary/70" />
                  <div>
                    <p>عدد الجداول</p>
                    <p className="text-foreground">
                      {trackerCount > 0 ? `${trackerCount} جدول` : "لا توجد جداول بعد"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-accent/30 p-3 text-xs text-accent-foreground">
                <ChartBar className="size-4" />
                سيتم هنا عرض نظرة مختصرة على حالة الجداول خلال الأيام الأخيرة لتبقى على اطلاع دائم.
              </div>
            </div>
          </header>
        </div>
      }
    >
      <section className="flex flex-col gap-4 rounded-3xl animate-fade-in-up">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">جداول المتابعة</h2>
            <p className="text-sm text-muted-foreground">
              أنشئ جدولاً جديداً لتتبع العادات أو الملاحظات داخل هذا القسم.
            </p>
          </div>
          <Button className="rounded-full bg-primary px-6 text-primary-foreground" onClick={() => setIsTrackerSheetOpen(true)}>
            إضافة جدول
          </Button>
        </div>
        <TrackerPreview
          trackers={section?.trackers ?? []}
          projectId={project?.id ?? params.projectId}
          sectionId={section?.id ?? params.sectionId}
        />
      </section>

      <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up">
        <h2 className="text-lg font-semibold">ملامح التجربة القادمة</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {sectionHighlights.map((item) => (
            <article key={item.title} className="glass-panel-muted rounded-2xl p-4">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up">
        <h3 className="text-lg font-semibold">حالات الخلايا</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          سنوفر حالات مرئية واضحة: تم (أخضر)، لم يتم (أحمر)، تم جزئياً مع ملاحظة (أصفر + نافذة
          منبثقة)، وإعادة التعيين (لون محايد). سيتم تمييز الأيام غير الفاعلة بلون هادئ للحفاظ على
          التركيز.
        </p>
      </section>

      <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up">
        <h3 className="text-lg font-semibold">نموذج شبكة المتابعة</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          يعرض هذا المثال الشكل المتوقع للجداول: الأعمدة تمثل الأيام، والصفوف تمثل العناصر التي ترغب
          بمتابعتها. سيتم تلوين الخلايا تبعاً للحالة المختارة وإظهار ملاحظات عند الضغط المطوّل.
        </p>
        <div className="mt-6 overflow-hidden rounded-3xl border border-border/70">
          <div className="grid grid-cols-8 bg-secondary/40 text-xs text-secondary-foreground">
            <div className="px-4 py-2 font-semibold text-foreground">العنصر</div>
            {["أحد", "إثن", "ثلث", "أربع", "خميس", "جمع", "سبت"].map((day) => (
              <div key={day} className="px-3 py-2 text-center">
                {day}
              </div>
            ))}
          </div>
          {[["تمارين الصباح", "done"], ["قراءة 20 دقيقة", "partial"], ["مشروب صحي", "missed"]].map(
            ([label, status]) => (
              <div
                key={label}
                className="grid grid-cols-8 border-t border-border/60 text-xs text-muted-foreground"
              >
                <div className="flex items-center px-4 py-3 text-foreground">{label}</div>
                {["", "", "", "", "", "", ""].map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-center border-r border-border/40 px-2 py-3 last:border-r-0",
                      status === "done"
                        ? "bg-status-done/15 text-status-done"
                        : status === "partial"
                        ? "bg-status-partial/15 text-status-partial"
                        : status === "missed"
                        ? "bg-status-missed/15 text-status-missed"
                        : "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {status === "done" ? (
                      <Check className="size-4" />
                    ) : status === "partial" ? (
                      <Minus className="size-4" />
                    ) : status === "missed" ? (
                      <X className="size-4" />
                    ) : null}
                  </div>
                ))}
              </div>
            ),
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          ستُظهر الخلايا الفارغة الأيام غير المفعّلة بلون محايد، وتتيح النقرة المزدوجة تغيير الحالة بسرعة.
        </p>
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
