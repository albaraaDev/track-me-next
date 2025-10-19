"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type GroupDeleteDialogProps = {
  groupTitle: string;
  open: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function GroupDeleteDialog({
  groupTitle,
  open,
  onConfirm,
  onOpenChange,
}: GroupDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-panel max-w-sm rounded-3xl border border-border/70 shadow-glow-soft">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right text-lg font-semibold text-destructive">
            حذف المجموعة
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right text-sm leading-relaxed text-muted-foreground">
            سيؤدي حذف المجموعة <strong className="text-foreground">{groupTitle}</strong> إلى إزالة جميع الجداول التابعة لها نهائياً.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-between gap-2">
          <AlertDialogCancel asChild>
            <Button variant="ghost" className="grow rounded-full border border-border/70">
              إلغاء
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              className="grow rounded-full bg-destructive text-destructive-foreground shadow-glow-soft"
              onClick={onConfirm}
            >
              حذف المجموعة
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

