import Link from "next/link";
import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav({
  ctaHref,
  ctaLabel,
}: {
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/">
          <Brand />
        </Link>
        <Link href={ctaHref} className={cn(buttonVariants({ size: "sm" }))}>
          {ctaLabel}
        </Link>
      </nav>
    </header>
  );
}
