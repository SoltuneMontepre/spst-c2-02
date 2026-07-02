"use client";

import { useState, useRef, useEffect, Children, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

function getItemProps(child: React.ReactElement): SelectItemProps | null {
  if (isValidElement(child)) {
    return child.props as SelectItemProps;
  }
  return null;
}

export function Select({
  value,
  onChange,
  placeholder = "Chọn...",
  children,
  className,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  let selectedLabel = placeholder;
  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      const props = getItemProps(child);
      if (props && props.value === value && props.children) {
        selectedLabel = String(props.children);
      }
    }
  });

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full rounded-[14px] border border-border bg-surface h-[39px] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn(!value && "text-muted-foreground")}>{selectedLabel}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-[14px] border border-border bg-surface shadow-lg overflow-hidden">
          {Children.map(children, (child) => {
            if (isValidElement(child)) {
              const props = getItemProps(child);
              if (props) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      onChange?.(props.value);
                      setOpen(false);
                    }}
                    className="block w-full text-left px-[15px] py-[9.75px] text-sm hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:bg-muted"
                  >
                    {props.children}
                  </button>
                );
              }
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
}

export function SelectItem(_props: SelectItemProps) {
  // SelectItem is a marker component; rendering is handled by Select
  return null;
}
