'use client';

import * as React from 'react';
import { z } from 'zod';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppActions, useAppStore } from '@/store/app-store';
import {
  CadencePreset,
  Tracker,
  cadencePresetSchema,
  trackerStatusSchema,
  trackerNotesSchema,
} from '@/domain/types';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { parseAppDate, toAppDateString } from '@/lib/date';

export const weekdayLabels = [
  'أحد',
  'إثنين',
  'ثلاثاء',
  'أربعاء',
  'خميس',
  'جمعة',
  'سبت',
];

export const sortWeekdays = (days: number[]): number[] =>
  Array.from(new Set(days)).sort((a, b) => a - b);

export const arraysShallowEqual = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const itemActiveWeekdaysSchema = z.array(z.number().min(0).max(6));

export const trackerFormSchema = z.object({
  type: z.enum(['status', 'notes']),
  title: z.string().trim().min(2, 'العنوان مطلوب'),
  description: z
    .string()
    .trim()
    .max(280, 'الوصف يجب ألا يتجاوز 280 حرفاً')
    .optional()
    .or(z.literal('')),
  icon: z
    .string()
    .trim()
    .max(4, 'استخدم رمزاً قصيراً أو إيموجي بحد أقصى 4 محارف')
    .optional()
    .or(z.literal('')),
  startDate: z.string().min(1, 'اختر تاريخ البداية'),
  endDate: z.string().optional().or(z.literal('')),
  cadence: cadencePresetSchema,
  activeWeekdays: z
    .array(z.number().min(0).max(6))
    .min(1, 'اختر يوماً واحداً على الأقل'),
  items: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().trim().min(1, 'اسم العنصر مطلوب'),
        activeWeekdays: itemActiveWeekdaysSchema,
      })
    )
    .min(1, 'أضف عنصراً واحداً على الأقل'),
  groupId: z.string().optional().nullable(),
});

export type TrackerFormValues = z.infer<typeof trackerFormSchema>;

export const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}`;

type TrackerCreateSheetProps = {
  projectId: string;
  sectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGroupId?: string | null;
};

export function TrackerCreateSheet({
  projectId,
  sectionId,
  open,
  onOpenChange,
  defaultGroupId = null,
}: TrackerCreateSheetProps) {
  const { addTracker } = useAppActions();
  const groups = useAppStore(
    React.useCallback(
      (state) =>
        state.projects
          .find((project) => project.id === projectId)
          ?.sections.find((section) => section.id === sectionId)?.groups ?? [],
      [projectId, sectionId]
    )
  );
  const defaultWeekdays = React.useMemo(() => sortWeekdays([0, 2, 4]), []);

  const form = useForm<TrackerFormValues>({
    resolver: zodResolver(trackerFormSchema),
    defaultValues: {
      type: 'status',
      title: '',
      description: '',
      icon: '📊',
      startDate: toAppDateString(new Date()),
      endDate: '',
      cadence: 'week',
      activeWeekdays: defaultWeekdays,
      items: [{ id: createId(), label: 'عنصر جديد', activeWeekdays: [...defaultWeekdays] }],
      groupId: null,
    },
  });

  const type = form.watch('type');
  const startDate = form.watch('startDate');
  const cadence = form.watch('cadence');
  const trackerActiveDays = form.watch('activeWeekdays');
  const formItems = form.watch('items');

  React.useEffect(() => {
    if (!open) return;
    form.setValue('groupId', defaultGroupId ?? null, { shouldDirty: false });
  }, [open, defaultGroupId, form]);

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

  React.useEffect(() => {
    const allowed = sortWeekdays(form.getValues('activeWeekdays') ?? defaultWeekdays);
    const currentItems = form.getValues('items');
    let changed = false;
    const normalizedItems = currentItems.map((item) => {
      const base = item.activeWeekdays && item.activeWeekdays.length > 0 ? sortWeekdays(item.activeWeekdays) : allowed;
      const filtered = base.filter((day) => allowed.includes(day));
      const nextActive = filtered.length > 0 ? sortWeekdays(filtered) : allowed;
      if (!arraysShallowEqual(nextActive, sortWeekdays(item.activeWeekdays ?? []))) {
        changed = true;
        return { ...item, activeWeekdays: nextActive };
      }
      return item;
    });
    if (changed) {
      form.setValue('items', normalizedItems, { shouldDirty: true });
    }
  }, [form, trackerActiveDays, defaultWeekdays]);

  const handleSubmit = form.handleSubmit((values) => {
    const baseTracker = {
      id: createId(),
      title: values.title.trim(),
      description: values.description?.trim() || '',
      icon: values.icon?.trim() || (values.type === 'status' ? '📊' : '📝'),
      startDate: values.startDate,
      endDate: values.endDate ? values.endDate : null,
      cadence: values.cadence,
      activeWeekdays: values.activeWeekdays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groupId: values.groupId ?? null,
    };
    const allowedSet = new Set(values.activeWeekdays);
    const resolveItemWeekdays = (input?: number[]) => {
      const base = input && input.length > 0 ? input : values.activeWeekdays;
      const filtered = base.filter((day) => allowedSet.has(day));
      const normalized = sortWeekdays(filtered.length > 0 ? filtered : values.activeWeekdays);
      return normalized;
    };

    if (values.type === 'status') {
      const tracker = trackerStatusSchema.parse({
        ...baseTracker,
        type: 'status',
        items: values.items.map((item) => ({
          id: item.id || createId(),
          label: item.label.trim(),
          createdAt: new Date().toISOString(),
          activeWeekdays: resolveItemWeekdays(item.activeWeekdays),
        })),
        cells: {},
      }) as Tracker;
      addTracker(projectId, sectionId, tracker);
    } else {
      const tracker = trackerNotesSchema.parse({
        ...baseTracker,
        type: 'notes',
        items: values.items.map((item) => ({
          id: item.id || createId(),
          label: item.label.trim(),
          createdAt: new Date().toISOString(),
          activeWeekdays: resolveItemWeekdays(item.activeWeekdays),
        })),
        cells: {},
      }) as Tracker;
      addTracker(projectId, sectionId, tracker);
    }

    onOpenChange(false);
    form.reset();
  });

  const updateItemLabel = React.useCallback(
    (id: string, label: string) => {
      const items = form.getValues('items');
      form.setValue(
        'items',
        items.map((item: TrackerFormValues['items'][number]) =>
          item.id === id ? { ...item, label } : item,
        ),
      );
    },
    [form]
  );

  const addItem = React.useCallback(() => {
    const allowed = sortWeekdays(form.getValues('activeWeekdays') ?? defaultWeekdays);
    form.setValue('items', [
      ...form.getValues('items'),
      { id: createId(), label: '', activeWeekdays: allowed },
    ]);
  }, [form, defaultWeekdays]);

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
      const selected = new Set(form.getValues('activeWeekdays') ?? defaultWeekdays);
      if (selected.has(day)) {
        selected.delete(day);
      } else {
        selected.add(day);
      }
      const result = sortWeekdays(Array.from(selected));
      form.setValue('activeWeekdays', result.length ? result : [day]);
    },
    [form, defaultWeekdays]
  );

  const toggleItemWeekday = React.useCallback(
    (itemId: string, day: number) => {
      const allowed = sortWeekdays(form.getValues('activeWeekdays') ?? defaultWeekdays);
      if (!allowed.includes(day)) return;
      const items = form.getValues('items');
      let changed = false;
      const nextItems = items.map((item) => {
        if (item.id !== itemId) return item;
        const current = new Set(
          item.activeWeekdays && item.activeWeekdays.length > 0
            ? item.activeWeekdays
            : allowed,
        );
        if (current.has(day)) {
          current.delete(day);
        } else {
          current.add(day);
        }
        const normalized = sortWeekdays(
          Array.from(current).filter((value) => allowed.includes(value)),
        );
        const nextActive = normalized.length > 0 ? normalized : allowed;
        if (!arraysShallowEqual(nextActive, sortWeekdays(item.activeWeekdays ?? []))) {
          changed = true;
          return { ...item, activeWeekdays: nextActive };
        }
        return item;
      });
      if (changed) {
        form.setValue('items', nextItems, { shouldDirty: true });
      }
    },
    [form]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-panel max-h-[82vh] overflow-y-auto rounded-t-[2rem] border border-border shadow-glow-soft sm:max-h-[75vh]"
      >
        <SheetHeader className="text-right">
          <SheetTitle>إنشاء جدول متابعة</SheetTitle>
          <SheetDescription>
            اختر نوع الجدول، عناصر المتابعة، ومدى الأيام الفاعلة. يمكنك تعديل كل
            التفاصيل بعد الإنشاء.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Tabs
                value={type}
                onValueChange={(value) =>
                  form.setValue('type', value as TrackerFormValues['type'])
                }
                className="flex flex-col gap-6"
                dir="rtl"
              >
                <TabsList className="glass-panel-muted flex w-full justify-evenly rounded-3xl border border-border/60 text-sm">
                  <TabsTrigger
                    value="status"
                    className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    متابعة بالحالات
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="w-full rounded-3xl px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    متابعة بالملاحظات
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="status" className='hidden' />
                <TabsContent value="notes"  className='hidden'/>
              </Tabs>

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
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المجموعة</FormLabel>
                    <FormControl>
                      <select
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value || null)}
                        className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <option value="">بلا مجموعة</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.title}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      يمكنك ربط الجدول بمجموعة موجودة أو تركه خارج المجموعات.
                    </p>
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
                        placeholder="إيموجي أو رمز قصير مثل 📊"
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
                            field.onChange(option.value as CadencePreset)
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
                  {formItems.map((item, index) => {
                    const trackerDays = sortWeekdays(trackerActiveDays ?? defaultWeekdays);
                    const itemDays =
                      item.activeWeekdays && item.activeWeekdays.length > 0
                        ? sortWeekdays(item.activeWeekdays)
                        : trackerDays;
                    return (
                      <div
                        key={item.id}
                        className="space-y-3 rounded-2xl border border-border/60 bg-white/5 p-3"
                      >
                        <div className="flex items-center gap-2">
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
                        <div className="flex flex-wrap gap-2">
                          {trackerDays.map((day: number) => {
                            const selected = itemDays.includes(day);
                            return (
                              <button
                                key={`${item.id}-${day}`}
                                type="button"
                                onClick={() => toggleItemWeekday(item.id, day)}
                                className={cn(
                                  'rounded-full border px-3 py-1 text-xs transition',
                                  selected
                                    ? 'border-primary bg-primary/15 text-primary shadow-glow-soft'
                                    : 'border-border/60 bg-white/5 text-muted-foreground hover:bg-white/10'
                                )}
                              >
                                {weekdayLabels[day]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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
                  حفظ الجدول
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
