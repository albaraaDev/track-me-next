'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppActions } from '@/store/app-store';
import { createId } from '@/components/trackers/tracker-create-sheet';

const groupFormSchema = z.object({
  title: z.string().trim().min(2, 'العنوان مطلوب'),
  description: z
    .string()
    .trim()
    .max(400, 'الوصف طويل جداً')
    .optional()
    .or(z.literal('')),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

type GroupCreateSheetProps = {
  projectId: string;
  sectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GroupCreateSheet({
  projectId,
  sectionId,
  open,
  onOpenChange,
}: GroupCreateSheetProps) {
  const { addGroup } = useAppActions();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ title: '', description: '' });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit((values) => {
    const timestamp = new Date().toISOString();
    addGroup(projectId, sectionId, {
      id: createId(),
      title: values.title.trim(),
      description: values.description?.trim() || '',
      trackerIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-panel max-h-[70vh] overflow-y-auto rounded-t-[2rem] border border-border shadow-glow-soft"
      >
        <SheetHeader className="text-right">
          <SheetTitle>إنشاء مجموعة جديدة</SheetTitle>
          <SheetDescription>
            اجمع الجداول المتصلة ببعضها داخل القسم تحت مجموعة واحدة.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المجموعة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: مهام الصباح" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="اشرح هدف المجموعة أو معايير الانضمام"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => onOpenChange(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-primary px-6 text-primary-foreground shadow-glow-soft"
                >
                  حفظ المجموعة
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

