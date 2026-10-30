import { CtaBand } from "@/components/home/CTA";
import { Hero } from "@/components/home/Hero";
import { Marquee, Stats } from "@/components/home/Marquee";
import { PricingPreview, type PlanCardData } from "@/components/home/PricingPreview";
import { Programs } from "@/components/home/Programs";
import { SchedulePreview, type ClassRow } from "@/components/home/SchedulePreview";
import { Testimonials } from "@/components/home/Testimonials";
import { TrainersPreview, type TrainerCardData } from "@/components/home/TrainersPreview";
import { WhyUs } from "@/components/home/WhyUs";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { one, query } from "@/lib/db";

/** Homepage data refreshes every minute so admin edits appear without a redeploy. */
export const revalidate = 60;

interface HomeData {
  stats: { value: number; suffix?: string; label: string; note: string }[];
  classes: ClassRow[];
  trainers: TrainerCardData[];
  plans: PlanCardData[];
  today: number;
}

const FALLBACK: HomeData = {
  stats: [
    { value: 1200, suffix: "+", label: "Active members", note: "and growing weekly" },
    { value: 13, label: "Weekly classes", note: "across 7 days" },
    { value: 4, label: "Certified coaches", note: "on the floor daily" },
    { value: 56, label: "Check-ins logged", note: "at the front desk" },
  ],
  classes: [],
  trainers: [],
  plans: [],
  today: new Date().getDay(),
};

async function getHomeData(): Promise<HomeData> {
  const today = new Date().getDay();
  try {
    const [members, classCount, coachCount, checkins, classes, trainers, plans] =
      await Promise.all([
        one<{ n: number }>(`SELECT count(*)::int AS n FROM members WHERE status = 'active'`),
        one<{ n: number }>(`SELECT count(*)::int AS n FROM classes WHERE is_active`),
        one<{ n: number }>(`SELECT count(*)::int AS n FROM trainers WHERE is_visible`),
        one<{ n: number }>(`SELECT count(*)::int AS n FROM check_ins`),
        query<Record<string, unknown>>(
          `SELECT c.id, c.name, c.category, c.day_of_week, c.start_time::text AS start,
                  c.end_time::text AS end, c.location, c.intensity, c.capacity,
                  u.full_name AS trainer
             FROM classes c
             LEFT JOIN users u ON u.id = c.trainer_id
            WHERE c.is_active
            ORDER BY c.day_of_week, c.start_time`
        ),
        query<Record<string, unknown>>(
          `SELECT u.id, u.full_name AS name, u.avatar_media_id, t.specialties,
                  t.experience_years AS years, t.bio
             FROM trainers t
             JOIN users u ON u.id = t.user_id
            WHERE t.is_visible AND u.status = 'active'
            ORDER BY t.sort_order, u.full_name
            LIMIT 4`
        ),
        query<Record<string, unknown>>(
          `SELECT id, name, tagline, price_ngn, duration_days, features, is_popular
             FROM plans WHERE is_active ORDER BY sort_order`
        ),
      ]);

    const allPlans: PlanCardData[] = plans.map((p) => ({
      id: Number(p.id),
      name: p.name as string,
      tagline: (p.tagline as string) ?? null,
      price: Number(p.price_ngn),
      days: Number(p.duration_days),
      features: (p.features as string[]) ?? [],
      popular: Boolean(p.is_popular),
    }));

    const CORE = ["Monthly Starter", "Quarterly Pro", "Annual Elite"];
    const corePlans = CORE.map((n) => allPlans.find((p) => p.name === n)).filter(
      Boolean
    ) as PlanCardData[];
    const previewPlans =
      corePlans.length >= 3 ? corePlans : allPlans.filter((p) => p.popular).concat(allPlans).slice(0, 3);

    return {
      today,
      stats: [
        {
          value: members?.n ?? 0,
          suffix: "+",
          label: "Active members",
          note: "training with us right now",
        },
        {
          value: classCount?.n ?? 0,
          label: "Weekly classes",
          note: "coached, capped, booked",
        },
        {
          value: coachCount?.n ?? 0,
          label: "Certified coaches",
          note: "on the floor daily",
        },
        {
          value: checkins?.n ?? 0,
          label: "Check-ins logged",
          note: "tracked at the desk",
        },
      ],
      classes: classes.map((c) => ({
        id: Number(c.id),
        name: c.name as string,
        category: c.category as string,
        day: Number(c.day_of_week),
        start: c.start as string,
        end: c.end as string,
        location: c.location as string,
        intensity: c.intensity as ClassRow["intensity"],
        capacity: Number(c.capacity),
        trainer: (c.trainer as string | null) ?? null,
      })),
      trainers: trainers.map((t) => ({
        id: Number(t.id),
        name: t.name as string,
        specialties: (t.specialties as string[]) ?? [],
        years: Number(t.years ?? 0),
        avatarMediaId: (t.avatar_media_id as number | null) ?? null,
        bio: (t.bio as string | null) ?? null,
      })),
      plans: previewPlans,
    };
  } catch (err) {
    console.error("[home] falling back to static data:", err);
    return { ...FALLBACK, today };
  }
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div className="relative">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Stats stats={data.stats} />
        <Programs />
        <WhyUs />
        <SchedulePreview classes={data.classes} today={data.today} />
        <Testimonials />
        <TrainersPreview trainers={data.trainers} />
        <PricingPreview plans={data.plans} />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
