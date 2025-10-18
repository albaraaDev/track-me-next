import { AppShell } from "@/components/layout/app-shell";
import { MainHeader } from "@/components/layout/main-header";

const statIdeas = [
  {
    title: "المؤشرات الرئيسية",
    description:
      "متوسط الالتزام، عدد العادات المتواصلة، وأعلى مشروع نشاطاً خلال الفترة المحددة.",
  },
  {
    title: "المخططات الذكية",
    description:
      "Sparkline لكل مشروع وجدول حرارة أسبوعي لمعرفة الأيام الأقوى والأضعف على الفور.",
  },
  {
    title: "التوصيات الشخصية",
    description:
      "اقتراحات تعتمد على بياناتك المحلية، مثل العادات المتعثرة أو فرص تعزيز التكرار.",
  },
];

export default function StatsPage() {
  return (
    <AppShell
      header={
        <div className="flex flex-col gap-4">
          <MainHeader />
          <header className="glass-panel rounded-3xl p-6 shadow-glass">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">لوحة تحليلات ذكية</p>
              <h1 className="text-2xl font-semibold">الإحصاءات العامة</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                هنا ستجد تحليلات متقدمة لعاداتك ومشاريعك، مع إمكانية اختيار نطاق زمني (أسبوع، أسبوعان،
                شهر) وتصفية البيانات حسب المشاريع أو الأقسام.
              </p>
            </div>
          </header>
        </div>
      }
    >
      <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up">
        <h2 className="text-lg font-semibold">ماذا سنبني هنا؟</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {statIdeas.map((idea) => (
            <article key={idea.title} className="glass-panel-muted rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-foreground">{idea.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {idea.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6 shadow-glass animate-fade-in-up">
        <h3 className="text-lg font-semibold">خيارات النطاق الزمني</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          سنوفر أزراراً سريعة لاختيار نطاق (7 أيام، 14 يوماً، 30 يوماً) بالإضافة لإمكانية التحديد
          المخصص. سيتم تحديث المؤشرات والمخططات لحظياً وفقاً لاختياراتك.
        </p>
      </section>
    </AppShell>
  );
}
