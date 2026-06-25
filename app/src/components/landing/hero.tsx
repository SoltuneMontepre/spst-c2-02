import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="grid w-full items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28 lg:px-8">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Mô phỏng thị trường đa người chơi
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Giá chạy, <span className="text-primary">giá trị</span> neo.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Vào vai người sản xuất, người tiêu dùng, trung gian hay Nhà nước trong một
            phiên chợ thanh long thời gian thực — và tự tay tạo ra dữ liệu chứng minh quy
            luật giá trị và cung–cầu.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={ctaHref} className={cn(buttonVariants({ size: "lg" }))}>
              {ctaLabel}
            </Link>
            <Link
              href="#cach-choi"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Cách chơi
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <Image
            src="/dragonfruit.svg"
            alt="Thanh long"
            width={340}
            height={340}
            priority
            className="drop-shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
