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
import { useAppActions } from '@/store/app-store';
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

const weekdayLabels = [
  'أحد',
  'إثنين',
  'ثلاثاء',
  'أربعاء',
  'خميس',
  'جمعة',
  'سبت',
];

const trackerFormSchema = z.object({
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
      })
    )
    .min(1, 'أضف عنصراً واحداً على الأقل'),
});

type TrackerFormValues = z.infer<typeof trackerFormSchema>;

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}`;

type TrackerCreateSheetProps = {
  projectId: string;
  sectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TrackerCreateSheet({
  projectId,
  sectionId,
  open,
  onOpenChange,
}: TrackerCreateSheetProps) {
  const { addTracker } = useAppActions();

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
      activeWeekdays: [0, 2, 4],
      items: [{ id: createId(), label: 'عنصر جديد' }],
    },
  });

  const type = form.watch('type');
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
    };

    if (values.type === 'status') {
      const tracker = trackerStatusSchema.parse({
        ...baseTracker,
        type: 'status',
        items: values.items.map((item) => ({
          id: item.id || createId(),
          label: item.label.trim(),
          createdAt: new Date().toISOString(),
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
                <TabsContent value="status" />
                <TabsContent value="notes" />
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
                    <div className="flex flex-wrap items-center justify-end gap-2">
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
                    <div className="flex flex-wrap justify-end gap-2">
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
