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
import { Checkbox } from '@/components/ui/checkbox';
import { useAppActions, useAppStore } from '@/store/app-store';

const groupEditSchema = z.object({
  title: z.string().trim().min(2, 'العنوان مطلوب'),
  description: z
    .string()
    .trim()
    .max(400, 'الوصف طويل جداً')
    .optional()
    .or(z.literal('')),
  trackerIds: z.array(z.string()).default([]),
});

type GroupEditValues = z.infer<typeof groupEditSchema>;

type GroupEditSheetProps = {
  projectId: string;
  sectionId: string;
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GroupEditSheet({
  projectId,
  sectionId,
  groupId,
  open,
  onOpenChange,
}: GroupEditSheetProps) {
  const { updateGroup } = useAppActions();
  const section = useAppStore(
    React.useCallback(
      (state) =>
        state.projects
          .find((project) => project.id === projectId)
          ?.sections.find((entry) => entry.id === sectionId),
      [projectId, sectionId]
    )
  );
  const group = section?.groups.find((entry) => entry.id === groupId);
  const trackers = section?.trackers ?? [];

  React.useEffect(() => {
    if (open && !group) {
      onOpenChange(false);
    }
  }, [group, open, onOpenChange]);

  const form = useForm<GroupEditValues>({
    resolver: zodResolver(groupEditSchema),
    defaultValues: {
      title: group?.title ?? '',
      description: group?.description ?? '',
      trackerIds: group?.trackerIds ?? [],
    },
  });

  React.useEffect(() => {
    if (!group) return;
    form.reset({
      title: group.title,
      description: group.description ?? '',
      trackerIds: group.trackerIds ?? [],
    });
  }, [group, form, open]);

  const selectedTrackers = form.watch('trackerIds');
  const selectionSet = React.useMemo(() => new Set(selectedTrackers), [selectedTrackers]);

  const trackerGroupMap = React.useMemo(() => {
    const map = new Map<string, string | null>();
    section?.groups.forEach((item) => {
      item.trackerIds.forEach((trackerId) => {
        map.set(trackerId, item.id);
      });
    });
    return map;
  }, [section]);

  const handleSubmit = form.handleSubmit((values) => {
    if (!group) return;
    updateGroup(projectId, sectionId, group.id, {
      title: values.title.trim(),
      description: values.description?.trim() || '',
      trackerIds: values.trackerIds,
    });
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-panel max-h-[82vh] overflow-y-auto rounded-t-[2rem] border border-border shadow-glow-soft sm:max-h-[75vh]"
      >
        <SheetHeader className="text-right">
          <SheetTitle>تعديل المجموعة</SheetTitle>
          <SheetDescription>
            عدّل بيانات المجموعة وحدد الجداول التي تنتمي إليها.
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
                        placeholder="اشرح الهدف من هذه المجموعة"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trackerIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجداول المرتبطة</FormLabel>
                    <div className="space-y-2 rounded-3xl border border-border/60 bg-white/5 p-3">
                      {trackers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          لا توجد جداول بعد داخل هذا القسم.
                        </p>
                      ) : (
                        trackers.map((tracker) => {
                          const isChecked = selectionSet.has(tracker.id);
                          const otherGroupId = trackerGroupMap.get(tracker.id);
                          const belongsElsewhere =
                            otherGroupId && otherGroupId !== groupId;
                          return (
                            <label
                              key={tracker.id}
                              className="flex items-start justify-between gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-foreground transition hover:border-border/60"
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const current = new Set(field.value ?? []);
                                    if (checked) {
                                      current.add(tracker.id);
                                    } else {
                                      current.delete(tracker.id);
                                    }
                                    field.onChange(Array.from(current));
                                  }}
                                />
                                <div>
                                  <p className="font-medium">
                                    {tracker.icon || '📊'} {tracker.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {tracker.description?.trim() || 'لا يوجد وصف'}
                                  </p>
                                </div>
                              </div>
                              {belongsElsewhere ? (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                                  ضمن مجموعة أخرى
                                </span>
                              ) : null}
                            </label>
                          );
                        })
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      إضافة جدول هنا ستنقله تلقائياً من أي مجموعة أخرى.
                    </p>
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
                  حفظ التغييرات
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

