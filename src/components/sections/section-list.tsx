"use client";

import * as React from "react";
import { PlusCircle, GripVertical } from "lucide-react";
import { Section } from "@/domain/types";
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
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";
import { useAppActions } from "@/store/app-store";

type SectionListProps = {
  projectId: string;
  sections: Section[];
  onCreate?: () => void;
  onEdit?: (sectionId: string) => void;
  onDelete?: (sectionId: string) => void;
};

export function SectionList({ projectId, sections, onCreate, onEdit, onDelete }: SectionListProps) {
  const { reorderSections } = useAppActions();
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

      const targetIndex = sections.findIndex((section) => section.id === over.id);
      if (targetIndex < 0) return;
      reorderSections(projectId, active.id as string, targetIndex);
    },
    [projectId, reorderSections, sections],
  );
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
          <h2 className="text-xl font-semibold">أقسام المشروع</h2>
        </div>
        <Button
          className="rounded-full bg-primary px-5 text-primary-foreground shadow-glow-soft"
          onClick={onCreate}
        >
          <PlusCircle className="ms-2 size-4" />
          قسم جديد
        </Button>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {sections.map((section) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                projectId={projectId}
                onEdit={onEdit}
                onDelete={onDelete}
                isActive={activeId === section.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

type SortableSectionCardProps = {
  section: Section;
  projectId: string;
  onEdit?: (sectionId: string) => void;
  onDelete?: (sectionId: string) => void;
  isActive: boolean;
};

function SortableSectionCard({
  section,
  projectId,
  onEdit,
  onDelete,
  isActive,
}: SortableSectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

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
      <SectionCard
        projectId={projectId}
        section={section}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label="إعادة ترتيب القسم"
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
