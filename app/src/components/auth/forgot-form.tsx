"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForgotForm } from "@/hooks/use-auth-forms";

export function ForgotForm() {
  const { form, onSubmit, submitted, pending } = useForgotForm();
  const { register, formState } = form;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Quên mật khẩu</CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra
            hộp thư của bạn.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="Email" htmlFor="forgot-email" error={formState.errors.email?.message}>
              <Input id="forgot-email" type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Đang gửi…" : "Gửi liên kết đặt lại"}
            </Button>
          </form>
        )}
        <Link href="/auth" className="mt-4 block text-center text-xs text-muted-foreground underline">
          Về đăng nhập
        </Link>
      </CardContent>
    </Card>
  );
}
