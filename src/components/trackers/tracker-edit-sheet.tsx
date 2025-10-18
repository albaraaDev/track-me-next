'use client';

import * as React from 'react';
import { addDays, addMonths } from 'date-fns';
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
import { useAppActions, useAppStore } from '@/store/app-store';
import {
  trackerNotesSchema,
  trackerStatusSchema,
} from '@/domain/types';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  createId,
  trackerFormSchema,
  TrackerFormValues,
  weekdayLabels,
} from './tracker-create-sheet';
import { parseAppDate, toAppDateString } from '@/lib/date';

type TrackerEditSheetProps = {
  projectId: string;
  sectionId: string;
  trackerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DEFAULT_STATUS_ICON = '📊';
const DEFAULT_NOTES_ICON = '📝';

export function TrackerEditSheet({
  projectId,
  sectionId,
  trackerId,
  open,
  onOpenChange,
}: TrackerEditSheetProps) {
  const { updateTracker } = useAppActions();
  const { toast } = useToast();
  const tracker = useAppStore(
    React.useCallback(
      (state) =>
        state.projects
          .find((project) => project.id === projectId)
          ?.sections.find((section) => section.id === sectionId)
          ?.trackers.find((item) => item.id === trackerId),
      [projectId, sectionId, trackerId]
    )
  );

  React.useEffect(() => {
    if (open && !tracker) {
      onOpenChange(false);
    }
  }, [tracker, open, onOpenChange]);

  const form = useForm<TrackerFormValues>({
    resolver: zodResolver(trackerFormSchema),
    defaultValues: {
      type: tracker?.type ?? 'status',
      title: tracker?.title ?? '',
      description: tracker?.description ?? '',
      icon:
        tracker?.icon ??
        (tracker?.type === 'notes' ? DEFAULT_NOTES_ICON : DEFAULT_STATUS_ICON),
      startDate: tracker?.startDate
        ? tracker.startDate
        : toAppDateString(new Date()),
      endDate: tracker?.endDate ?? '',
      cadence: tracker?.cadence ?? 'week',
      activeWeekdays: tracker?.activeWeekdays ?? [0, 2, 4],
      items:
        tracker?.items.map((item) => ({
          id: item.id,
          label: item.label,
        })) ?? [{ id: createId(), label: 'عنصر جديد' }],
    },
  });

  React.useEffect(() => {
    if (!tracker) return;
    form.reset({
      type: tracker.type,
      title: tracker.title,
      description: tracker.description ?? '',
      icon:
        tracker.icon ??
        (tracker.type === 'notes' ? DEFAULT_NOTES_ICON : DEFAULT_STATUS_ICON),
      startDate: tracker.startDate,
      endDate: tracker.endDate ?? '',
      cadence: tracker.cadence,
      activeWeekdays: tracker.activeWeekdays,
      items: tracker.items.map((item) => ({
        id: item.id,
        label: item.label,
      })),
    });
  }, [tracker, form, open]);

  const startDate = form.watch('startDate');
  const cadence = form.watch('cadence');

  React.useEffect(() => {
    if (!startDate) return;
    if (cadence === 'custom') return;
    const start = parseAppDate(startDate);
    if (!start) return;
    let end: Date;
    if (cadence === 'week') {
      end = addDays(start, 6);
    } else if (cadence === 'two-weeks') {
      end = addDays(start, 13);
    } else {
      end = addMonths(start, 1);
    }
    form.setValue('endDate', toAppDateString(end), { shouldDirty: true });
  }, [cadence, startDate, form]);

  const updateItemLabel = React.useCallback(
    (id: string, label: string) => {
      form.setValue(
        'items',
        form
          .getValues('items')
          .map((item) => (item.id === id ? { ...item, label } : item))
      );
    },
    [form]
  );

  const addItem = React.useCallback(() => {
    form.setValue('items', [
      ...form.getValues('items'),
      { id: createId(), label: '' },
    ]);
  }, [form]);

  const removeItem = React.useCallback(
    (id: string) => {
      const items = form.getValues('items');
      if (items.length === 1) return;
      form.setValue(
        'items',
        items.filter((item) => item.id !== id)
      );
    },
    [form]
  );

  const toggleWeekday = React.useCallback(
    (day: number) => {
      const selected = new Set(form.getValues('activeWeekdays'));
      if (selected.has(day)) {
        selected.delete(day);
      } else {
        selected.add(day);
      }
      const result = Array.from(selected).sort((a, b) => a - b);
      form.setValue('activeWeekdays', result.length ? result : [day]);
    },
    [form]
  );

  const handleSubmit = form.handleSubmit((values) => {
    if (!tracker) return;
    const timestamp = new Date().toISOString();
    const baseUpdate = {
      title: values.title.trim(),
      description: values.description?.trim() || '',
      icon:
        values.icon?.trim() ||
        (tracker.type === 'notes' ? DEFAULT_NOTES_ICON : DEFAULT_STATUS_ICON),
      startDate: values.startDate,
      endDate: values.endDate ? values.endDate : null,
      cadence: values.cadence,
      activeWeekdays: values.activeWeekdays,
    };

    const nextItems = values.items.map((item) => {
      const existing = tracker.items.find((entry) => entry.id === item.id);
      return {
        id: item.id || createId(),
        label: item.label.trim(),
        createdAt: existing?.createdAt ?? timestamp,
      };
    });

    if (tracker.type === 'status') {
      const nextCells: Record<string, typeof tracker.cells[string]> = {};
      nextItems.forEach((item) => {
        const existing = tracker.cells[item.id];
        if (existing) {
          nextCells[item.id] = existing;
        }
      });
      updateTracker(projectId, sectionId, tracker.id, {
        ...baseUpdate,
        items: nextItems,
        cells: nextCells,
      });
    } else {
      const nextCells: Record<string, typeof tracker.cells[string]> = {};
      nextItems.forEach((item) => {
        const existing = tracker.cells[item.id];
        if (existing) {
          nextCells[item.id] = existing;
        }
      });
      updateTracker(projectId, sectionId, tracker.id, {
        ...baseUpdate,
        items: nextItems,
        cells: nextCells,
      });
    }

    toast({
      title: 'تم تحديث الجدول',
      description: 'حُفظت التعديلات على جدول المتابعة بنجاح.',
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
          <SheetTitle>تعديل جدول المتابعة</SheetTitle>
          <SheetDescription>
            حدّث تفاصيل الجدول، غيّر الأيقونة أو الأيام الفاعلة، وأعد تنظيم العناصر كما تشاء.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-3xl border border-border/60 bg-white/5 p-4 text-sm text-muted-foreground">
                نوع الجدول:{' '}
                <span className="text-foreground font-semibold">
                  {tracker?.type === 'notes'
                    ? 'متابعة بالملاحظات'
                    : 'متابعة بالحالات'}
                </span>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان الجدول</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: متابعة التمارين الصباحية"
                        {...field}
                      />
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
                        placeholder="أضف وصفاً موجزاً لهذا الجدول"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأيقونة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`إيموجي أو رمز قصير مثل ${
                          tracker?.type === 'notes'
                            ? DEFAULT_NOTES_ICON
                            : DEFAULT_STATUS_ICON
                        }`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ البداية</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ النهاية</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={cadence !== 'custom'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cadence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النطاق الزمني</FormLabel>
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      {[
                        { value: 'week', label: 'أسبوع' },
                        { value: 'two-weeks', label: 'أسبوعان' },
                        { value: 'month', label: 'شهر' },
                        { value: 'custom', label: 'مخصص' },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            field.value === option.value ? 'default' : 'ghost'
                          }
                          className={cn(
                            'rounded-full border border-border/40 px-4 py-1 text-xs',
                            field.value === option.value
                              ? 'bg-primary text-primary-foreground shadow-glow-soft'
                              : 'text-muted-foreground'
                          )}
                          onClick={() =>
                            field.onChange(option.value as TrackerFormValues['cadence'])
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activeWeekdays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأيام الفاعلة</FormLabel>
                    <div className="flex flex-wrap justify-start gap-2">
                      {weekdayLabels.map((label, index) => {
                        const selected = field.value.includes(index);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleWeekday(index)}
                            className={cn(
                              'rounded-full border px-4 py-1 text-xs transition',
                              selected
                                ? 'border-primary bg-primary/15 text-primary shadow-glow-soft'
                                : 'border-border/60 bg-white/5 text-muted-foreground hover:bg-white/10'
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    عناصر المتابعة
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    onClick={addItem}
                  >
                    إضافة عنصر
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.watch('items').map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.label}
                        placeholder={`عنصر #${index + 1}`}
                        onChange={(event) =>
                          updateItemLabel(item.id, event.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full border border-border/50"
                        onClick={() => removeItem(item.id)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <SheetFooter className="sm:justify-between">
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
                  className="rounded-full bg-primary px-8 text-primary-foreground shadow-glow-soft"
                >
                  حفظ التعديلات
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
