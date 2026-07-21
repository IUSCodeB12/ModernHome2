import Link from "next/link";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"] });

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#141210] px-4 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,177,99,0.14),transparent_62%)]" />
      <div className="relative flex flex-col items-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-white/95 text-sm font-bold text-neutral-900">
          MH
        </span>
        <p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-white/50">
          404
        </p>
        <h1
          className={`${fraunces.className} mt-3 text-4xl text-white sm:text-5xl`}
          style={{ letterSpacing: "-0.02em" }}
        >
          This page moved out.
        </h1>
        <p className="mt-3 max-w-sm text-white/60">
          The page you&apos;re after doesn&apos;t exist — but your next quote is
          only a few taps away.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition-transform hover:scale-[1.03]"
          >
            Back home
          </Link>
          <Link
            href="/quote"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Get an instant quote
          </Link>
        </div>
      </div>
    </div>
  );
}
