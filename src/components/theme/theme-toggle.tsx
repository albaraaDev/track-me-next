"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark =
    mounted && (theme === "system" ? resolvedTheme === "dark" : theme === "dark");

  const toggleTheme = React.useCallback(() => {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  }, [isDark, mounted, setTheme]);

  const icon = mounted ? (
    isDark ? (
      <Sun className="size-5" />
    ) : (
      <Moon className="size-5" />
    )
  ) : (
    <Moon className="size-5 opacity-0" aria-hidden />
  );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex size-10 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-glow-soft transition hover:border-border hover:bg-card",
        "backdrop-blur",
        className,
      )}
      aria-label="تبديل النمط اللوني"
      disabled={!mounted}
    >
      {icon}
    </button>
  );
}
