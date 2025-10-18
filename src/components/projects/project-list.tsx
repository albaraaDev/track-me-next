"use client";

import * as React from "react";
import { GripVertical, PlusCircle } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppActions, useAppStore } from "@/store/app-store";
import { ProjectCard } from "./project-card";
import { Button } from "@/components/ui/button";
import { Project } from "@/domain/types";

type ProjectListProps = {
  onCreate?: () => void;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
};

export function ProjectList({ onCreate, onEdit, onDelete }: ProjectListProps) {
  const projects = useAppStore((state) => state.projects);
  const { reorderProjects } = useAppActions();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const targetIndex = projects.findIndex((project) => project.id === over.id);
      if (targetIndex < 0) return;
      reorderProjects(active.id as string, targetIndex);
    },
    [projects, reorderProjects],
  );

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {projects.map((project) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                onEdit={onEdit}
                onDelete={onDelete}
                isActive={activeId === project.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

type SortableProjectCardProps = {
  project: Project;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  isActive: boolean;
};

function SortableProjectCard({ project, onEdit, onDelete, isActive }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-80" : undefined}
    >
      <ProjectCard
        project={project}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label="إعادة ترتيب المشروع"
            className="glass-panel-muted flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            data-active={isActive || isDragging ? "true" : undefined}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}
