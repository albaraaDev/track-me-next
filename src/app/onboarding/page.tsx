import { AppShell } from "@/components/layout/app-shell";
import { MainHeader } from "@/components/layout/main-header";

export default function OnboardingPage() {
  return (
    <AppShell
      header={
        <div className="flex flex-col gap-4">
          <MainHeader />
        </div>
      }
    >
      <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up text-center">
        <h1 className="text-2xl font-semibold">مرحبا بك!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          ستظهر هنا تجربة الترحيب الأولى لاختيار الأفتار والاسم والخلفية. الواجهة ستكون عبارة عن Bottom
          Sheet أنيق يسمح لك بضبط الهوية الشخصية خلال ثوانٍ.
        </p>
      </section>
    </AppShell>
  );
}
