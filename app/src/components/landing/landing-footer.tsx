import { Brand } from "@/components/brand";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <Brand size={22} />
        <p>Chủ đề SPST-C2-02 · Kinh tế Chính trị Mác–Lênin, Chương 2</p>
      </div>
    </footer>
  );
}
