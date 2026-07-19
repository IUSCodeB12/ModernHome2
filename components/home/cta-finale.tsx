import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/reveal";

export function CtaFinale() {
  return (
    <section className="relative overflow-hidden bg-[#171513]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,177,99,0.18),transparent_65%)]" />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center">
        <Reveal>
          <h2 className="text-4xl text-white sm:text-6xl">
            Know the price before we knock.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            No callouts to get a number. Answer a few questions and see your
            estimate instantly — then book a time that suits.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-neutral-900 hover:bg-white/90">
              <Link href="/quote">
                Get an instant quote <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/services">Browse services</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
