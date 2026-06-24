import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthCard } from "@/components/auth/auth-card";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) redirect(callbackUrl ?? "/home");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AuthCard callbackUrl={callbackUrl ?? "/home"} />
    </main>
  );
}
