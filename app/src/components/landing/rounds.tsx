const ROUNDS = [
  { n: 1, title: "Thị trường cơ sở", body: "Cung và cầu bình thường; giá trị 10 nghìn Đồng làm mốc so sánh." },
  { n: 2, title: "Được mùa", body: "Năng lực đưa hàng ra chợ tăng 50% — quan sát dư cung kéo giá xuống." },
  { n: 3, title: "Thanh long viral", body: "Nhu cầu tăng 50% — cầu vượt cung, người mua tranh giá." },
  { n: 4, title: "Công nghệ phổ biến", body: "Năng suất xã hội tăng, trục giá trị giảm còn 6 nghìn Đồng." },
];

export function Rounds() {
  return (
    <section id="cach-choi" className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 flex flex-col gap-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Bốn vòng có chủ đích</h2>
        <p className="text-muted-foreground">
          Mỗi vòng cô lập một biến số để bài học hiện ra rõ ràng.
        </p>
      </div>
      <ol className="grid gap-5 md:grid-cols-4">
        {ROUNDS.map((r) => (
          <li
            key={r.n}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {r.n}
            </span>
            <h3 className="font-semibold">{r.title}</h3>
            <p className="text-sm text-muted-foreground">{r.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
