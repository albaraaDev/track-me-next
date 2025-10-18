import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "تراك مي",
  description:
    "منصة عربية أنيقة لإدارة المشاريع الشخصية وتعقب العادات بطريقة عصرية وسهلة الاستخدام.",
  manifest: "/manifest.json",
  applicationName: "Track Me",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-512x512.png", sizes: "512x512" }],
    shortcut: [{ url: "/icons/icon-192x192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    title: "Track Me",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
