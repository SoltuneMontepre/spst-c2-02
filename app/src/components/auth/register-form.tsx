"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useRegisterForm } from "@/hooks/use-auth-forms";

export function RegisterForm() {
  const { form, onSubmit, formError, verifyUrl, submitted, pending } =
    useRegisterForm();
  const { register, formState } = form;

  if (submitted) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="font-medium">Kiểm tra email để xác minh tài khoản.</p>
        {verifyUrl ? (
          <p className="text-muted-foreground">
            Bản dev: xác minh nhanh tại{" "}
            <a className="text-primary underline" href={verifyUrl}>
              liên kết này
            </a>
            .
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Tên hiển thị" htmlFor="reg-name" error={formState.errors.displayName?.message}>
        <Input id="reg-name" autoComplete="nickname" {...register("displayName")} />
      </Field>
      <Field label="Email" htmlFor="reg-email" error={formState.errors.email?.message}>
        <Input id="reg-email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Mật khẩu" htmlFor="reg-password" error={formState.errors.password?.message}>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
      </Field>
      {formError ? <p className="text-sm text-danger">{formError}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang tạo…" : "Tạo tài khoản"}
      </Button>
    </form>
  );
}
