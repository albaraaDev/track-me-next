"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Section } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";

type SectionListProps = {
  projectId: string;
  sections: Section[];
  onCreate?: () => void;
  onEdit?: (sectionId: string) => void;
  onDelete?: (sectionId: string) => void;
};

export function SectionList({ projectId, sections, onCreate, onEdit, onDelete }: SectionListProps) {
  if (sections.length === 0) {
    return (
      <section className="glass-panel rounded-3xl p-6 text-center shadow-glass animate-fade-in-up">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <PlusCircle className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">ابدأ بإضافة قسم</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          الأقسام تساعدك على تجميع الجداول حسب الموضوع أو المجال. يمكنك مثلاً إنشاء قسم للصحة البدنية،
          وآخر للتطوير الشخصي، ثم بناء جداول الحضور والمتابعة داخل كل قسم.
        </p>
        <Button
          className="mt-6 rounded-full bg-primary px-6 text-primary-foreground shadow-glow-soft"
          onClick={onCreate}
        >
          إضافة قسم جديد
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">أقسام المشروع</p>
          <h2 className="text-xl font-semibold">كل الأقسام المرتبطة بهذا المشروع</h2>
        </div>
        <Button
          className="rounded-full bg-primary px-5 text-primary-foreground shadow-glow-soft"
          onClick={onCreate}
        >
          <PlusCircle className="ms-2 size-4" />
          قسم جديد
        </Button>
      </header>

      <div className="grid gap-4">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            projectId={projectId}
            section={section}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
        تبحث عن المزيد؟ يمكنك الانتقال مباشرة إلى أي قسم من الأقسام السابقة أو{" "}
        <Link href={`/projects/${projectId}`} className="text-primary underline underline-offset-4">
          العودة إلى المشروع
        </Link>{" "}
        لتغيير ترتيبهما.
      </div>
    </section>
  );
}
