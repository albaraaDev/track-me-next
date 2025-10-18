'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { EllipsisVertical, CalendarDays, Table2 } from 'lucide-react';
import { Section } from '@/domain/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SectionEditSheet } from './section-edit-sheet';
import { SectionDeleteDialog } from './section-delete-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppActions } from '@/store/app-store';
import { formatAppDate } from '@/lib/date';

type SectionCardProps = {
  projectId: string;
  section: Section;
  onEdit?: (sectionId: string) => void;
  onDelete?: (sectionId: string) => void;
};

const formatDate = (date: string | null | undefined) =>
  formatAppDate(date, 'd MMM yyyy', { locale: ar });

export function SectionCard({
  projectId,
  section,
  onEdit,
  onDelete,
}: SectionCardProps) {
  const trackersCount = section.trackers.length;
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const { removeSection } = useAppActions();
  const { toast } = useToast();

  const handleEdit = React.useCallback(() => {
    setIsEditOpen(true);
    onEdit?.(section.id);
  }, [onEdit, section.id]);

  const handleDelete = React.useCallback(() => {
    setIsDeleteOpen(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    removeSection(projectId, section.id);
    setIsDeleteOpen(false);
    toast({
      title: 'تم حذف القسم',
      description: `حُذف القسم "${section.name}" وكل الجداول المرتبطة به.`,
      variant: 'destructive',
    });
    onDelete?.(section.id);
  }, [projectId, removeSection, section.id, section.name, toast, onDelete]);

  return (
    <>
      <article className="glass-panel relative overflow-hidden rounded-3xl p-5 shadow-glass transition hover:shadow-glow-soft">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5" />
        <div className="relative z-10 flex flex-col gap-4">
          <header className="flex items-start justify-between gap-3">
            <Link
              href={`/projects/${projectId}/sections/${section.id}`}
              className="flex items-center gap-3 flex-1"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-white/25 text-2xl backdrop-blur">
                <span aria-hidden>{section.icon || '📂'}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {section.name}
                </h3>
                {section.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {section.description}
                  </p>
                ) : null}
              </div>
            </Link>
            <div className="flex gap-2 items-center">
              <span
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1 text-xs',
                  trackersCount > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Table2 className="size-3.5" />
                {trackersCount > 0
                  ? `${
                      trackersCount === 1
                        ? 'جدول متابعة واحد'
                        : trackersCount === 2
                        ? 'جدولا متابعة'
                        : trackersCount + ' جداول متابعة'
                    } `
                  : 'لا توجد جداول بعد'}
              </span>
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
                <DropdownMenuContent
                  align="start"
                  className="glass-panel rounded-2xl border border-border/50"
                >
                  <DropdownMenuItem onSelect={handleEdit}>
                    تعديل القسم
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={handleDelete}
                  >
                    حذف القسم
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <Link href={`/projects/${projectId}/sections/${section.id}`}>
            <dl className="grid gap-3 text-xs text-muted-foreground grid-cols-2">
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-3 backdrop-blur">
                <CalendarDays className="size-4 text-primary" />
                <div>
                  <dt>تاريخ البداية</dt>
                  <dd className="text-foreground">
                    {formatDate(section.startDate)}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-3 backdrop-blur">
                <CalendarDays className="size-4 text-primary/70" />
                <div>
                  <dt>تاريخ النهاية</dt>
                  <dd className="text-foreground">
                    {section.endDate
                      ? formatDate(section.endDate)
                      : 'مفتوح حتى إشعار آخر'}
                  </dd>
                </div>
              </div>
            </dl>
          </Link>
        </div>
      </article>

      <SectionEditSheet
        projectId={projectId}
        sectionId={section.id}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <SectionDeleteDialog
        sectionName={section.name}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={confirmDelete}
      />
    </>
  );
}
