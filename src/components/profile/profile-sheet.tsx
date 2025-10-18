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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppActions, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const avatarPalette = [
  { id: "avatar-01", icon: "🌟", color: "#38bdf8" },
  { id: "avatar-02", icon: "🔥", color: "#f97316" },
  { id: "avatar-03", icon: "🌿", color: "#34d399" },
  { id: "avatar-04", icon: "🎧", color: "#a855f7" },
  { id: "avatar-05", icon: "🚀", color: "#f59e0b" },
  { id: "avatar-06", icon: "📚", color: "#6366f1" },
];

const profileSchema = z.object({
  displayName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  avatarId: z.string(),
  avatarColor: z.string(),
  backgroundId: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const profile = useAppStore((state) => state.profile);
  const { setProfile } = useAppActions();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile.displayName,
      avatarId: profile.avatarId,
      avatarColor: profile.avatarColor,
      backgroundId: profile.backgroundId,
    },
  });

  React.useEffect(() => {
    form.reset({
      displayName: profile.displayName,
      avatarId: profile.avatarId,
      avatarColor: profile.avatarColor,
      backgroundId: profile.backgroundId,
    });
  }, [profile, form, open]);

  const selectedAvatar = avatarPalette.find((avatar) => avatar.id === form.watch("avatarId"));

  const handleSubmit = form.handleSubmit((values) => {
    setProfile({
      displayName: values.displayName.trim(),
      avatarId: values.avatarId,
      avatarColor: values.avatarColor,
      backgroundId: values.backgroundId,
    });
    toast({
      title: "تم تحديث الهوية",
      description: "تم حفظ اسمك وأيقونتك بنجاح.",
    });
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-panel max-h-[75vh] overflow-y-auto rounded-t-[2rem] border border-border p-6 pb-16 shadow-glow-soft"
      >
        <SheetHeader className="text-right">
          <SheetTitle>تخصيص الهوية</SheetTitle>
          <SheetDescription>
            اختر الاسم والأيقونة التي تعبر عنك، لتظهر في التحيات والواجهة الرئيسية.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسمك</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: صديقي المبدع" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">الأفتار</Label>
                <div className="grid grid-cols-3 gap-3">
                  {avatarPalette.map((avatar) => {
                    const selected = avatar.id === form.watch("avatarId");
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => {
                          form.setValue("avatarId", avatar.id);
                          form.setValue("avatarColor", avatar.color);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-3 transition",
                          selected
                            ? "border-primary bg-primary/10 text-primary shadow-glow-soft"
                            : "border-border/60 bg-white/5 text-muted-foreground hover:bg-white/10",
                        )}
                      >
                        <span className="text-3xl">{avatar.icon}</span>
                        <span className="text-xs font-semibold">#{avatar.id.slice(-2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-white/5 p-4">
                <p className="text-sm text-muted-foreground">معاينة</p>
                <div className="mt-3 flex items-center gap-3">
                  <div
                    className="flex size-16 items-center justify-center rounded-2xl text-2xl text-white shadow-inner"
                    style={{ background: selectedAvatar?.color ?? profile.avatarColor }}
                  >
                    {selectedAvatar?.icon ?? "🌟"}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">أهلاً</p>
                    <p className="text-lg font-semibold text-foreground">
                      {form.watch("displayName") || profile.displayName}
                    </p>
                  </div>
                </div>
              </div>

              <SheetFooter className="sm:justify-between">
                <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="rounded-full bg-primary px-8 text-primary-foreground shadow-glow-soft">
                  حفظ التخصيص
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
