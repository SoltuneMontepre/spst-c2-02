import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

export const tagVariants = cva(
  "inline-flex items-center rounded-full px-[7px] py-[1.75px] text-[11px] font-semibold",
  {
    variants: {
      variant: {
        producer: "bg-emerald-100 text-emerald-700",
        consumer: "bg-orange-100 text-orange-700",
        intermediary: "bg-violet-100 text-violet-700",
        government: "bg-amber-100 text-amber-700",
        "status-active": "bg-success/15 text-success",
        "status-done": "bg-muted text-muted-foreground",
        default: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface TagProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

export function Tag({ className, variant, ...props }: TagProps) {
  return (
    <span className={cn(tagVariants({ variant }), className)} {...props} />
  );
}
