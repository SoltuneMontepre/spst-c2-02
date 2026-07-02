import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Table({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-surface shadow-sm overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center h-[38px] bg-muted/20 px-[17.5px] text-[10px] uppercase tracking-wide text-muted-foreground font-semibold",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center h-[50.75px] px-[17.5px] border-b border-border/60 last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1", className)} {...props} />;
}

export function TableCell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 text-sm", className)} {...props} />;
}
