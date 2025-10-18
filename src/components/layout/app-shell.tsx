"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
};

export function AppShell({ header, children, footer, className }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 bg-glass-mesh opacity-80" aria-hidden />
      <div
        className={cn(
          "mx-auto flex w-full max-w-4xl flex-col gap-6 p-4",
          className,
        )}
      >
        {header}
        <main className="flex flex-1 flex-col gap-6">{children}</main>
        {footer ? <footer className="pb-8 text-sm text-muted-foreground">{footer}</footer> : null}
      </div>
    </div>
  );
}
