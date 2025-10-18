'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type TrackerDeleteDialogProps = {
  trackerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function TrackerDeleteDialog({
  trackerName,
  open,
  onOpenChange,
  onConfirm,
}: TrackerDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-panel max-w-sm rounded-3xl border border-border/70 text-right shadow-glow-soft">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-destructive">
            حذف جدول المتابعة
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
            سيتم حذف الجدول{' '}
            <strong className="text-foreground">&quot;{trackerName}&quot;</strong>{' '}
            وكل البيانات المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full border border-border/60"
            >
              إلغاء
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full px-6 shadow-glow-soft"
              onClick={onConfirm}
            >
              حذف الجدول
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
