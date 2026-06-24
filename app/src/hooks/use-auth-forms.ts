"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { z } from "zod";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import { apiFetch, ApiClientError } from "./use-api";

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type ForgotValues = z.infer<typeof forgotPasswordSchema>;
type ResetValues = z.infer<typeof resetPasswordSchema>;

export function useLoginForm(callbackUrl: string) {
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      setFormError(
        "Sai thông tin đăng nhập hoặc email chưa xác minh. Kiểm tra lại giúp bạn nhé.",
      );
      return;
    }
    window.location.href = callbackUrl;
  });

  return { form, onSubmit, formError, pending: form.formState.isSubmitting };
}

export function useRegisterForm() {
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await apiFetch<{ verifyUrl?: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setVerifyUrl(res.verifyUrl ?? null);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "EMAIL_IN_USE") {
        setFormError("Email này đã có tài khoản. Hãy đăng nhập hoặc đặt lại mật khẩu.");
      } else {
        setFormError("Không thể tạo tài khoản. Vui lòng thử lại.");
      }
    }
  });

  return {
    form,
    onSubmit,
    formError,
    verifyUrl,
    submitted: form.formState.isSubmitSuccessful,
    pending: form.formState.isSubmitting,
  };
}

export function useForgotForm() {
  const form = useForm<ForgotValues>({ resolver: zodResolver(forgotPasswordSchema) });
  const onSubmit = form.handleSubmit(async (values) => {
    await apiFetch("/api/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify(values),
    });
  });
  return { form, onSubmit, submitted: form.formState.isSubmitSuccessful, pending: form.formState.isSubmitting };
}

export function useResetForm(token: string) {
  const form = useForm<Pick<ResetValues, "password">>({
    resolver: zodResolver(resetPasswordSchema.pick({ password: true })),
  });
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiFetch("/api/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, password: values.password }),
      });
    } catch (err) {
      const code = err instanceof ApiClientError ? err.code : "";
      setFormError(
        code === "TOKEN_EXPIRED"
          ? "Liên kết đã hết hạn. Hãy yêu cầu liên kết mới."
          : "Liên kết không hợp lệ hoặc đã dùng.",
      );
    }
  });

  return { form, onSubmit, formError, submitted: form.formState.isSubmitSuccessful && !formError, pending: form.formState.isSubmitting };
}

export function googleSignIn(callbackUrl: string) {
  return signIn("google", { callbackUrl });
}
