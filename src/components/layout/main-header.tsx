"use client";

import * as React from "react";
import { UploadCloud, DownloadCloud, User2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { getAvatarById } from "@/lib/avatars";

const morningGreetings = ["صباح النشاط!", "صباح العزيمة!", "صباح مليء بالإنجاز!"];
const afternoonGreetings = ["نهار مشرق!", "استمر، أنت تقترب!", "نهار العمل مستمر!"];
const eveningGreetings = ["مساء الهدوء!", "راجع إنجازاتك اليوم!", "مساء مفعم بالراحة!"];

function pickGreeting(): string {
  const hour = new Date().getHours();
  const list =
    hour < 12 ? morningGreetings : hour < 18 ? afternoonGreetings : eveningGreetings;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex] ?? list[0];
}

type MainHeaderProps = {
  onRequestProfile?: () => void;
  onRequestImport?: () => void;
  onRequestExport?: () => void;
};

export function MainHeader({
  onRequestProfile,
  onRequestImport,
  onRequestExport,
}: MainHeaderProps) {
  const profile = useAppStore((state) => state.profile);
  const [greeting, setGreeting] = React.useState("مرحباً بك!");
  React.useEffect(() => {
    setGreeting(pickGreeting());
  }, []);
  const initials = profile.displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
  const avatar = getAvatarById(profile.avatarId);
  const avatarGlyph = avatar?.icon ?? initials;

  return (
    <header className="glass-panel rounded-3xl p-4 shadow-glass sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onRequestProfile}
            className="group relative flex size-12 items-center justify-center rounded-2xl border border-white/40 text-lg font-semibold text-white shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shrink-0"
            style={{
              background: profile.avatarColor,
            }}
            aria-label="تعديل الهوية الشخصية"
          >
            <span className="flex size-full items-center justify-center rounded-2xl bg-white/10 backdrop-blur group-hover:bg-white/20 transition text-2xl">
              {avatarGlyph ? (
                <span aria-hidden>{avatarGlyph}</span>
              ) : (
                <User2 className="size-6" />
              )}
            </span>
          </button>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">مرحباً {profile.displayName}</p>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">{greeting}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="glass-panel-muted border border-border/60 text-xs text-foreground shadow-glow-soft hover:bg-card inline-flex size-10"
            onClick={onRequestImport}
          >
            <UploadCloud className="size-4 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="glass-panel-muted border border-border/60 text-xs text-foreground shadow-glow-soft hover:bg-card inline-flex size-10"
            onClick={onRequestExport}
          >
            <DownloadCloud className="size-4 text-red-500" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
