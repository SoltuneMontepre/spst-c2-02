import { auth } from "@/lib/auth";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Rounds } from "@/components/landing/rounds";
import { Roles } from "@/components/landing/roles";
import { ClosingCta } from "@/components/landing/closing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export default async function LandingPage() {
  const session = await auth();
  const ctaHref = session?.user ? "/home" : "/auth";
  const ctaLabel = session?.user ? "Vào sảnh chính" : "Bắt đầu";

  return (
    <>
      <LandingNav ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <main className="flex flex-1 flex-col">
        <Hero ctaHref={ctaHref} ctaLabel={ctaLabel} />
        <Features />
        <Rounds />
        <Roles />
        <ClosingCta ctaHref={ctaHref} ctaLabel={ctaLabel} />
      </main>
      <LandingFooter />
    </>
  );
}
