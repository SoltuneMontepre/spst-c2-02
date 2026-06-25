"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { useForgotForm } from "@/hooks/use-auth-forms";

export function ForgotForm() {
  const { form, onSubmit, formError, resetUrl, submitted, googleAccount, pending } =
    useForgotForm();
  const { register, formState } = form;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Quên mật khẩu</CardTitle>
      </CardHeader>
      <CardContent>
        {googleAccount ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
              Tài khoản này đăng nhập bằng <strong>Google</strong>, không dùng mật khẩu.
              Hãy chọn <strong>Đăng nhập bằng Google</strong> tại trang đăng nhập.
            </p>
            <GoogleButton callbackUrl="/home" />
            <Link
              href="/auth"
              className="text-center text-xs text-muted-foreground underline"
            >
              Về đăng nhập
            </Link>
          </div>
        ) : submitted ? (
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra
              hộp thư của bạn.
            </p>
            {resetUrl ? (
              <p>
                Bản dev: đặt lại nhanh tại{" "}
                <a className="text-primary underline" href={resetUrl}>
                  liên kết này
                </a>
                .
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              Chỉ áp dụng cho tài khoản đăng ký bằng email và mật khẩu. Nếu bạn đăng nhập bằng
              Google, hãy dùng nút Google tại trang đăng nhập.
            </p>
            <Field label="Email" htmlFor="forgot-email" error={formState.errors.email?.message}>
              <Input id="forgot-email" type="email" autoComplete="email" {...register("email")} />
            </Field>
            {formError ? <p className="text-sm text-danger">{formError}</p> : null}
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
