import Link from "next/link";
import { ResetForm } from "@/components/auth/reset-form";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Thiếu mã đặt lại.{" "}
          <Link href="/auth/forgot" className="text-primary underline">
            Yêu cầu liên kết mới
          </Link>
        </p>
      )}
    </main>
  );
}
