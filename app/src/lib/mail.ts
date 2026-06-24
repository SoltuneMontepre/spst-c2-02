// Transactional email via Brevo SMTP (TECH-AUTH). When SMTP is not configured,
// emails are logged instead so dev flows keep working.

import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const tx = getTransport();
  if (!tx) {
    console.warn(`[mail] SMTP not configured; would send "${subject}" to ${to}`);
    return;
  }
  await tx.sendMail({
    from: process.env.MAIL_FROM ?? "Thanh Long Market <no-reply@localhost>",
    to,
    subject,
    html,
  });
}

function layout(title: string, bodyHtml: string, cta: { href: string; label: string }) {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#2b1f25">
    <h1 style="color:#e93970;font-size:20px">Thanh Long Market</h1>
    <h2 style="font-size:16px">${title}</h2>
    <p style="color:#7d6470;font-size:14px">${bodyHtml}</p>
    <a href="${cta.href}" style="display:inline-block;margin-top:12px;background:#e93970;color:#fff;
       padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${cta.label}</a>
    <p style="color:#b3a698;font-size:12px;margin-top:16px">Nếu nút không hoạt động, dán liên kết: ${cta.href}</p>
  </div>`;
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await send(
    to,
    "Xác minh tài khoản Thanh Long Market",
    layout(
      "Xác minh email của bạn",
      "Nhấn nút bên dưới để kích hoạt tài khoản và vào phiên chợ.",
      { href: url, label: "Xác minh email" },
    ),
  );
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  await send(
    to,
    "Đặt lại mật khẩu Thanh Long Market",
    layout(
      "Đặt lại mật khẩu",
      "Bạn vừa yêu cầu đặt lại mật khẩu. Liên kết có hiệu lực trong 1 giờ.",
      { href: url, label: "Đặt lại mật khẩu" },
    ),
  );
}
