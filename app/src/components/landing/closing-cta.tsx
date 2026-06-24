import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClosingCta({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground">
        <h2 className="max-w-xl text-3xl font-bold tracking-tight">
          Sẵn sàng mở phiên chợ của riêng bạn?
        </h2>
        <p className="max-w-md text-primary-foreground/85">
          Tạo phòng trong vài giây, mời cả lớp bằng một mã sáu ký tự và bắt đầu trải nghiệm.
        </p>
        <Link
          href={ctaHref}
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "text-secondary-foreground",
          )}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
