"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MainHeader } from "@/components/layout/main-header";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectCreateSheet } from "@/components/projects/project-create-sheet";
import { ProfileSheet } from "@/components/profile/profile-sheet";
import { useAppActions, useAppStore } from "@/store/app-store";
import {
  buildExportFileName,
  createExportBlob,
  createExportPayload,
  getExportableData,
  parseImportPayload,
  readFileAsText,
} from "@/lib/data-transfer";

const highlights = [
  {
    title: "مشاريع منظمة",
    description:
      "قسّم عاداتك وأهدافك إلى مشاريع واضحة، مع أقسام وجداول تتيح لك رؤية الصورة الكاملة سريعاً.",
  },
  {
    title: "جداول تفاعلية",
    description:
      "تابع التقدّم يومياً بحالات مرئية أو ملاحظات مفصلة، مع ألوان تنبض بالحياة وتلائم الحالة.",
  },
  {
    title: "بيانات تبقى معك",
    description:
      "كل شيء محفوظ محلياً على جهازك مع إمكان التصدير والاستيراد بصيغة JSON وقتما تشاء.",
  },
];

export default function Home() {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const { hydrate, setLastBackupAt } = useAppActions();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const showFeedback = React.useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
  }, []);

  const handleCreateProject = React.useCallback(() => {
    setIsCreateProjectOpen(true);
  }, []);

  const handleEditProject = React.useCallback((projectId: string) => {
    console.info("سيتم فتح نافذة تعديل المشروع قريباً:", projectId);
  }, []);

  const handleDeleteProject = React.useCallback((projectId: string) => {
    console.info("سيتم تنفيذ حذف المشروع مع تأكيد قريباً:", projectId);
  }, []);

  const handleProfile = React.useCallback(() => {
    setIsProfileOpen(true);
  }, []);

  const handleImport = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleExport = React.useCallback(() => {
    try {
      const { actions: _actions, ...state } = useAppStore.getState();
      const exportable = getExportableData(state);
      const payload = createExportPayload(exportable);
      const blob = createExportBlob(payload);
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(blob);
      anchor.download = buildExportFileName(exportable.profile.displayName);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(anchor.href);
      setLastBackupAt(payload.exportedAt);
      showFeedback("success", "تم تصدير البيانات بنجاح.");
    } catch (error) {
      console.error(error);
      showFeedback("error", "تعذّر تصدير البيانات. تأكد من سلامة البيانات ثم أعد المحاولة.");
    }
  }, [setLastBackupAt, showFeedback]);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await readFileAsText(file);
        const data = parseImportPayload(text);
        hydrate(data);
        setLastBackupAt(new Date().toISOString());
        showFeedback("success", "تم استيراد البيانات بنجاح.");
      } catch (error) {
        console.error(error);
        showFeedback(
          "error",
          error instanceof Error ? error.message : "تعذّر استيراد الملف. تأكد من اختيار ملف JSON صحيح.",
        );
      } finally {
        event.target.value = "";
      }
    },
    [hydrate, setLastBackupAt, showFeedback],
  );

  React.useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  return (
    <>
      <AppShell
        header={
          <div className="flex flex-col gap-4 sticky top-4 z-40">
            <MainHeader
              onRequestProfile={handleProfile}
              onRequestImport={handleImport}
              onRequestExport={handleExport}
            />
            {/* <HomeHero /> */}
          </div>
        }
      >
        {feedback ? (
          <div
            className={`glass-panel flex items-center justify-between rounded-3xl border px-4 py-3 text-sm shadow-glow-soft ${
              feedback.type === "success" ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-full border border-current/30 px-3 py-1 text-xs"
            >
              إغلاق
            </button>
          </div>
        ) : null}

        <ProjectList
          onCreate={handleCreateProject}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
        />

        <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">جاهز للتخصيص</p>
              <h2 className="mt-1 text-xl font-semibold">أحدث الإحصاءات</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-4 py-1 text-xs text-primary">
              لوحة متكاملة قريباً
            </span>
          </header>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="glass-panel-muted rounded-2xl p-4">
              <p className="text-sm text-muted-foreground">
                ستوفر صفحة الإحصاءات الذكية نظرة معمقة على الأداء، مع منحنيات المصغرات (sparklines) ومؤشرات
                تساعدك على اتخاذ قرارات يومية.
              </p>
            </div>
            <div className="glass-panel-muted rounded-2xl p-4">
              <p className="text-sm text-muted-foreground">
                ستحصل على توصيات محلية مثل تذكير بالمهام منخفضة الإنجاز، وكل ذلك دون مغادرة بيانات جهازك.
              </p>
            </div>
          </div>
        </section>
      </AppShell>

      <ProjectCreateSheet open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen} />
      <ProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}

function HomeHero() {
  return (
    <header className="glass-panel rounded-3xl p-6 shadow-glass">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">أهلاً بك في تراك مي</p>
          <h1 className="mt-2 text-3xl font-semibold leading-10 text-foreground sm:text-4xl">
            تعقب عاداتك بذكاء، رتّب مشاريعك بمرونة، واحتفظ ببياناتك دائماً معك.
          </h1>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {highlights.map((highlight) => (
            <li key={highlight.title} className="glass-panel-muted rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-foreground">{highlight.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {highlight.description}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">تجربة عربية بالكامل</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
            دعم كامل للوضع الداكن والفاتح
          </span>
          <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
            تخزين محلي + تصدير JSON
          </span>
        </div>
      </div>
    </header>
  );
}
