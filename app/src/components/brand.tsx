import Image from "next/image";
import { cn } from "@/lib/utils";

export function Brand({
  size = 28,
  withText = true,
  className,
}: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/dragonfruit.svg"
        alt="Thanh Long Market"
        width={size}
        height={size}
        priority
      />
      {withText ? (
        <span className="font-semibold tracking-tight">Thanh Long Market</span>
      ) : null}
    </span>
  );
}
