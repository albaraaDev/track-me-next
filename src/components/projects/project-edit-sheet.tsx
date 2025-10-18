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

const editProjectSchema = z
  .object({
    name: z.string().trim().min(2, "اسم المشروع مطلوب"),
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

type EditProjectValues = z.infer<typeof editProjectSchema>;

type ProjectEditSheetProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProjectEditSheet({ projectId, open, onOpenChange }: ProjectEditSheetProps) {
  const { updateProject } = useAppActions();
  const project = useAppStore((state) => state.projects.find((item) => item.id === projectId));
  const toInputDate = React.useCallback((value: string | null | undefined) => {
    const parsed = parseAppDate(value ?? undefined);
    return parsed ? toAppDateString(parsed) : "";
  }, []);

  const form = useForm<EditProjectValues>({
    resolver: zodResolver(editProjectSchema),
    mode: "onChange",
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      icon: project?.icon ?? "🚀",
      startDate: toInputDate(project?.startDate),
      endDate: toInputDate(project?.endDate),
    },
  });

  React.useEffect(() => {
    if (!project) return;
    form.reset({
      name: project.name,
      description: project.description ?? "",
      icon: project.icon ?? "🚀",
      startDate: toInputDate(project.startDate),
      endDate: toInputDate(project.endDate),
    });
  }, [project, form, open, toInputDate]);

  const handleSubmit = form.handleSubmit((values) => {
    updateProject(projectId, {
      name: values.name.trim(),
      description: values.description?.trim() || "",
      icon: values.icon?.trim() || "🚀",
      startDate: values.startDate,
      endDate: values.endDate ? values.endDate : null,
    });
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-panel max-h-[80vh] overflow-y-auto rounded-t-[2rem] border border-border p-6 pb-16 shadow-glow-soft sm:max-h-[70vh]"
      >
        <SheetHeader className="text-right">
          <SheetTitle>تعديل المشروع</SheetTitle>
          <SheetDescription>
            قم بتحديث تفاصيل المشروع، ويمكنك تعديل الاسم، النبذة، الأيقونة أو التواريخ بكل سهولة.
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
                    <FormLabel>اسم المشروع</FormLabel>
                    <FormControl>
                      <Input placeholder="اسم المشروع" {...field} />
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
                      <Textarea rows={3} placeholder="اكتب نبذة تلخص أهداف المشروع" {...field} />
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
                    <FormLabel>أيقونة المشروع</FormLabel>
                    <FormControl>
                      <Input placeholder="إيموجي أو رمز مختصر" {...field} />
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
                      <FormDescription>اتركه فارغاً إذا أردت مشروعاً مفتوحاً بلا نهاية.</FormDescription>
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
