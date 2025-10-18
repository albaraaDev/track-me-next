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
import { useAppActions, useAppStore } from "@/store/app-store";
import { parseAppDate, toAppDateString } from "@/lib/date";

const sectionEditSchema = z
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

type SectionEditValues = z.infer<typeof sectionEditSchema>;

type SectionEditSheetProps = {
  projectId: string;
  sectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SectionEditSheet({ projectId, sectionId, open, onOpenChange }: SectionEditSheetProps) {
  const { updateSection } = useAppActions();
  const section = useAppStore((state) =>
    state.projects
      .find((project) => project.id === projectId)
      ?.sections.find((item) => item.id === sectionId),
  );
  const toInputDate = React.useCallback((value: string | null | undefined) => {
    const parsed = parseAppDate(value);
    return parsed ? toAppDateString(parsed) : "";
  }, []);

  const form = useForm<SectionEditValues>({
    resolver: zodResolver(sectionEditSchema),
    defaultValues: {
      name: section?.name ?? "",
      description: section?.description ?? "",
      icon: section?.icon ?? "📂",
      startDate: toInputDate(section?.startDate),
      endDate: toInputDate(section?.endDate),
    },
  });

  React.useEffect(() => {
    if (!section) return;
    form.reset({
      name: section.name,
      description: section.description ?? "",
      icon: section.icon ?? "📂",
      startDate: toInputDate(section.startDate),
      endDate: toInputDate(section.endDate),
    });
  }, [section, form, open, toInputDate]);

  const handleSubmit = form.handleSubmit((values) => {
    updateSection(projectId, sectionId, {
      name: values.name.trim(),
      description: values.description?.trim() || "",
      icon: values.icon?.trim() || "📂",
      startDate: values.startDate,
      endDate: values.endDate ? values.endDate : null,
    });
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-panel max-h-[80vh] overflow-y-auto rounded-t-[2rem] border border-border p-6 shadow-glow-soft sm:max-h-[90vh]"
      >
        <SheetHeader className="text-right">
          <SheetTitle>تعديل القسم</SheetTitle>
          <SheetDescription>
            حدّث بيانات القسم لتبقى أقسامك منسقة وتعكس ما يحدث فعلياً في مشروعك.
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
                      <Input placeholder="اسم القسم" {...field} />
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
                      <Textarea rows={3} placeholder="أضف وصفاً مختصراً لهذا القسم" {...field} />
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
                      <Input placeholder="إيموجي أو رمز قصير" {...field} />
                    </FormControl>
                    <FormDescription>استخدم رمزاً قصيراً أو إيموجي بحد أقصى 4 محارف.</FormDescription>
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
                      <FormDescription>اترك الحقل فارغاً إذا أردت استمرار القسم دون تحديد نهاية.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="sm:justify-between">
                <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="rounded-full bg-primary px-8 text-primary-foreground shadow-glow-soft">
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
