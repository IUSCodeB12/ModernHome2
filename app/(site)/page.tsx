import { Hero } from "@/components/home/hero";
import { TrustStrip } from "@/components/home/trust-strip";
import { HowItWorks } from "@/components/home/how-it-works";
import { ServiceShowcase } from "@/components/home/service-showcase";
import { ServicesGrid } from "@/components/home/services-grid";
import { BeforeAfter } from "@/components/home/before-after";
import { Testimonials } from "@/components/home/testimonials";
import { Faq } from "@/components/home/faq";
import { RecentJobs } from "@/components/home/recent-jobs";
import { CtaFinale } from "@/components/home/cta-finale";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomeData } from "@/lib/home/data";
import { localBusinessLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { services, featured, recent, heroSlides, showcase } = await getHomeData();

  return (
    <>
      <JsonLd data={localBusinessLd()} />
      <Hero slides={heroSlides} />
      <TrustStrip />
      <HowItWorks />
      <ServiceShowcase panels={showcase} />
      <ServicesGrid services={services} />
      <BeforeAfter items={featured} />
      <Testimonials />
      <RecentJobs jobs={recent} />
      <Faq />
      <CtaFinale />
    </>
  );
}
