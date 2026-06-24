"use client";

import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { googleSignIn } from "@/hooks/use-auth-forms";

export function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => googleSignIn(callbackUrl)}
    >
      <FcGoogle className="size-5" />
      Tiếp tục với Google
    </Button>
  );
}
