"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/field";
import { useLoginForm } from "@/hooks/use-auth-forms";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const { form, onSubmit, formError, pending } = useLoginForm(callbackUrl);
  const { register, formState } = form;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Email" htmlFor="login-email" error={formState.errors.email?.message}>
        <Input id="login-email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field
        label="Mật khẩu"
        htmlFor="login-password"
        error={formState.errors.password?.message}
      >
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          {...register("password")}
        />
      </Field>
      {formError ? <p className="text-sm text-danger">{formError}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
      <Link href="/auth/forgot" className="text-center text-xs text-muted-foreground underline">
        Quên mật khẩu?
      </Link>
    </form>
  );
}
