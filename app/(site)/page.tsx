import { Hero } from "@/components/home/hero";
import { TrustStrip } from "@/components/home/trust-strip";
import { HowItWorks } from "@/components/home/how-it-works";
import { RoomTour } from "@/components/three/room-tour";
import { ServicesGrid } from "@/components/home/services-grid";
import { BeforeAfter } from "@/components/home/before-after";
import { Testimonials } from "@/components/home/testimonials";
import { Faq } from "@/components/home/faq";
import { RecentJobs } from "@/components/home/recent-jobs";
import { CtaFinale } from "@/components/home/cta-finale";
import { getHomeData } from "@/lib/home-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { services, featured, recent } = await getHomeData();

  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <RoomTour />
      <ServicesGrid services={services} />
      <BeforeAfter items={featured} />
      <Testimonials />
      <RecentJobs jobs={recent} />
      <Faq />
      <CtaFinale />
    </>
  );
}
