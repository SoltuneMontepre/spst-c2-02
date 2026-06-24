"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResetForm } from "@/hooks/use-auth-forms";

export function ResetForm({ token }: { token: string }) {
  const { form, onSubmit, formError, submitted, pending } = useResetForm(token);
  const { register, formState } = form;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Đặt lại mật khẩu</CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex flex-col gap-3 text-sm">
            <p>Mật khẩu đã được đặt lại.</p>
            <Link href="/auth" className="text-primary underline">
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field
              label="Mật khẩu mới"
              htmlFor="reset-password"
              error={formState.errors.password?.message}
            >
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
            </Field>
            {formError ? <p className="text-sm text-danger">{formError}</p> : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Đang lưu…" : "Đặt lại mật khẩu"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
