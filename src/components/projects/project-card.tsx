"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { EllipsisVertical, CalendarDays, Layers, Table2 } from "lucide-react";
import { Project } from "@/domain/types";
import { useToast } from "@/hooks/use-toast";
import { useAppActions } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ProjectEditSheet } from "./project-edit-sheet";
import { ProjectDeleteDialog } from "./project-delete-dialog";
import { formatAppDate } from "@/lib/date";

type ProjectCardProps = {
  project: Project;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
};

const formatDate = (date: string | null | undefined) => formatAppDate(date, "d MMMM yyyy", { locale: ar });

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const sectionsCount = project.sections.length;
  const trackersCount = project.sections.reduce((sum, section) => sum + section.trackers.length, 0);
  const { removeProject } = useAppActions();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const handleEdit = React.useCallback(() => {
    setIsEditOpen(true);
    onEdit?.(project.id);
  }, [onEdit, project.id]);

  const handleDelete = React.useCallback(() => {
    setIsDeleteOpen(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    removeProject(project.id);
    setIsDeleteOpen(false);
    toast({
      title: "تم حذف المشروع",
      description: `حُذف المشروع "${project.name}" بنجاح.`,
      variant: "destructive",
    });
    onDelete?.(project.id);
  }, [project.id, project.name, removeProject, toast, onDelete]);

  return (
    <>
      <Link href={`/projects/${project.id}`} className="glass-panel relative overflow-hidden rounded-3xl p-5 shadow-glass transition hover:shadow-glow-soft">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-primary/0 to-accent/10" />
        <div className="relative z-10 flex flex-col gap-4">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-white/25 text-2xl backdrop-blur">
                <span aria-hidden>{project.icon || "📁"}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                {project.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
                ) : null}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="glass-panel-muted size-9 rounded-full border border-border/50 text-muted-foreground"
                >
                  <EllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel rounded-2xl border border-border/50">
                <DropdownMenuItem onSelect={handleEdit}>تعديل المشروع</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={handleDelete}>
                  حذف المشروع
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <dl className="grid gap-3 text-xs text-muted-foreground grid-cols-2 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur">
              <CalendarDays className="size-4 text-primary" />
              <div>
                <dt>تاريخ البداية</dt>
                <dd className="text-foreground">{formatDate(project.startDate)}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur">
              <CalendarDays className="size-4 text-primary/70" />
              <div>
                <dt>تاريخ النهاية</dt>
                <dd className="text-foreground">{project.endDate ? formatDate(project.endDate) : "مفتوح"}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur max-sm:col-span-2">
              <Layers className="size-4 text-primary/70" />
              <div>
                <dt>الأقسام</dt>
                <dd className="text-foreground">{sectionsCount}</dd>
              </div>
            </div>
          </dl>

          <div className="flex items-center justify-between gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 text-xs",
                trackersCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              <Table2 className="size-3.5" />
              {trackersCount > 0 ? `${trackersCount} جدول متابعة` : "لم يتم إضافة جداول بعد"}
            </div>
            {/* <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground shadow-glow-soft">
              <Link href={`/projects/${project.id}`}>فتح المشروع</Link>
            </Button> */}
          </div>
        </div>
      </Link>

      <ProjectEditSheet projectId={project.id} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <ProjectDeleteDialog
        projectName={project.name}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
      />
    </>
  );
}
