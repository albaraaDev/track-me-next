"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppActions } from "@/store/app-store";
import { parseAppDate, toAppDateString } from "@/lib/date";

const sectionFormSchema = z
  .object({
    name: z.string().trim().min(2, "اسم القسم مطلوب"),
    description: z
      .string()
      .trim()
      .max(280, "الوصف يجب ألا يتجاوز 280 حرفاً")
      .optional()
      .or(z.literal("")),
    icon: z
      .string()
      .trim()
      .max(4, "استخدم رمزاً قصيراً أو إيموجي بحد أقصى 4 محارف")
      .optional()
      .or(z.literal("")),
    startDate: z.string().min(1, "اختر تاريخ البداية"),
    endDate: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      const start = parseAppDate(data.startDate);
      const end = parseAppDate(data.endDate);
      if (!start || !end) return false;
      return end >= start;
    },
    {
      path: ["endDate"],
      message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
    },
  );

type SectionFormValues = z.infer<typeof sectionFormSchema>;

const DEFAULT_ICON = "🗂️";

type SectionCreateSheetProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SectionCreateSheet({ projectId, open, onOpenChange }: SectionCreateSheetProps) {
  const { addSection } = useAppActions();

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: DEFAULT_ICON,
      startDate: toAppDateString(new Date()),
      endDate: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `section-${Date.now()}`;
    const timestamp = new Date().toISOString();

    addSection(projectId, {
      id,
      name: values.name.trim(),
      description: values.description?.trim() || "",
      icon: values.icon?.trim() || DEFAULT_ICON,
      startDate: values.startDate,
      endDate: values.endDate ? values.endDate : null,
      trackers: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    form.reset({
      name: "",
      description: "",
      icon: DEFAULT_ICON,
      startDate: toAppDateString(new Date()),
      endDate: "",
    });
    onOpenChange(false);
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset({
        name: "",
        description: "",
        icon: DEFAULT_ICON,
        startDate: toAppDateString(new Date()),
        endDate: "",
      });
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-panel max-h-[80vh] overflow-y-auto rounded-t-[2rem] border border-border p-6 pb-16 shadow-glow-soft sm:max-h-[70vh]"
      >
        <SheetHeader className="text-right">
          <SheetTitle>قسم جديد</SheetTitle>
          <SheetDescription>
            أنشئ حاوية مرتبة لجدول أو أكثر، وحدد تاريخ البداية والنهاية إن رغبت. يمكنك تعديل هذه
            التفاصيل لاحقاً.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم القسم</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: التمارين الرياضية" {...field} />
                    </FormControl>
                    <FormDescription>اختر اسمًا يعبّر عن مجموعة الجداول التي سيحتويها القسم.</FormDescription>
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
                      <Textarea rows={3} placeholder="أضف وصفًا قصيرًا للمجال الذي يغطيه هذا القسم." {...field} />
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
                    <FormLabel>أيقونة القسم</FormLabel>
                    <FormControl>
                      <Input placeholder="إيموجي أو رمز قصير مثل 🧠" {...field} />
                    </FormControl>
                    <FormDescription>استخدم 1-4 محارف لتمييز القسم بصرياً.</FormDescription>
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
                      <FormLabel>تاريخ النهاية (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>اترك الحقل فارغاً إذا أردت قسماً مستمراً بدون نهاية.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="sm:justify-between">
                <Button type="button" variant="ghost" className="rounded-full" onClick={() => handleOpenChange(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="rounded-full bg-primary px-8 text-primary-foreground shadow-glow-soft">
                  حفظ القسم
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
