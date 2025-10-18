"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { useAppActions, useAppStore } from "@/store/app-store";
import { PWARegister } from "@/components/pwa-register";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const { markHydrated } = useAppActions();
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  React.useEffect(() => {
    let isMounted = true;
    const rehydrate = async () => {
      try {
        await useAppStore.persist.rehydrate();
      } finally {
        if (isMounted) {
          markHydrated();
        }
      }
    };
    void rehydrate();
    return () => {
      isMounted = false;
    };
  }, [markHydrated]);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <PWARegister />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
