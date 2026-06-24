// Shared zod schemas (TECH-VALIDATION). Server validates every mutation.

import { z } from "zod";
import { MAX_PRICE_VND, MIN_PRICE_VND, PRICE_STEP_VND } from "./money";

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Tên hiển thị cần ít nhất 2 ký tự")
  .max(40, "Tên hiển thị tối đa 40 ký tự");

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự")
  .max(100)
  .regex(/[a-z]/, "Cần ít nhất một chữ thường")
  .regex(/[A-Z]/, "Cần ít nhất một chữ hoa")
  .regex(/[0-9]/, "Cần ít nhất một chữ số");

export const emailSchema = z.string().trim().toLowerCase().email("Email không hợp lệ");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
});

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, "Mã phòng gồm 6 ký tự");

export const joinSessionSchema = z.object({ code: roomCodeSchema });

const priceVndSchema = z
  .number()
  .int()
  .min(MIN_PRICE_VND)
  .max(MAX_PRICE_VND)
  .refine((v) => v % PRICE_STEP_VND === 0, "Giá phải là bội số của 1.000");

const quantitySchema = z.number().int().min(1).max(20);
const clientActionId = z.string().uuid();

// WebSocket / command payloads
export const produceSchema = z.object({
  clientActionId,
  quantity: z.number().int().min(0).max(20),
});

export const listSchema = z.object({
  clientActionId,
  inventoryLotId: z.string().uuid(),
  quantity: quantitySchema,
  askPriceVnd: priceVndSchema,
});

export const buySchema = z.object({
  clientActionId,
  listingId: z.string().uuid(),
  quantity: quantitySchema,
});

export const offerSchema = z.object({
  clientActionId,
  listingId: z.string().uuid(),
  quantity: quantitySchema,
  offerPriceVnd: priceVndSchema,
});

export const respondOfferSchema = z.object({
  clientActionId,
  offerId: z.string().uuid(),
  action: z.enum(["ACCEPT", "REJECT", "COUNTER"]),
  counterPriceVnd: priceVndSchema.optional(),
});

export const applyPolicySchema = z.object({
  clientActionId,
  policyType: z.enum([
    "INFO_DISCLOSURE",
    "COLD_STORAGE",
    "EXPORT_PROMOTION",
    "TECH_SUPPORT",
    "NONE",
  ]),
  targetIds: z.array(z.string().uuid()).max(3).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
