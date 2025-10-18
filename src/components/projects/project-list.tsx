"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { ProjectCard } from "./project-card";
import { Button } from "@/components/ui/button";

type ProjectListProps = {
  onCreate?: () => void;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
};

export function ProjectList({ onCreate, onEdit, onDelete }: ProjectListProps) {
  const projects = useAppStore((state) => state.projects);

  if (!projects.length) {
    return (
      <section className="glass-panel rounded-3xl p-6 text-center shadow-glass animate-fade-in-up">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PlusCircle className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">ابدأ مشروعك الأول</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          أنشئ مشروعاً جديداً، أضف الأقسام المناسبة، ثم صمّم جداول المتابعة التي تعكس عاداتك ومهامك.
          يمكنك دائماً استيراد بياناتك السابقة إذا كانت لديك نسخة احتياطية.
        </p>
        <Button
          className="mt-6 rounded-full bg-primary px-6 text-primary-foreground shadow-glow-soft"
          onClick={onCreate}
        >
          إنشاء مشروع جديد
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">قائمة المشاريع</p>
          <h2 className="text-xl font-semibold">جميع مشاريعك الحالية</h2>
        </div>
        <Button
          className="rounded-full bg-primary px-5 text-primary-foreground shadow-glow-soft"
          onClick={onCreate}
        >
          <PlusCircle className="ms-2 size-4" />
          إضافة مشروع
        </Button>
      </header>
      <div className="grid gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
