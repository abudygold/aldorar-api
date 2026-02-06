import { z } from "zod";

const uuid = z.string().uuid();
const varchar50 = z.string().max(50);
const varchar40 = z.string().max(40);

export const createSchema = z.object({
  tripTransactionId: uuid,
  paymentCode: varchar40,
  provider: varchar50,
  method: varchar50.optional(),
  amount: z.number().positive(),
  expiredAt: z.string().datetime().optional(),
  externalReference: z.string().max(100).optional(),
  rawResponse: z.any().optional(),
});

export const updateSchema = z
  .object({
    provider: varchar50.optional(),
    method: varchar50.optional(),
    amount: z.number().positive().optional(),
    status: z
      .enum(["pending", "success", "failed", "expired", "refunded"])
      .optional(),
    paidAt: z.string().datetime().optional(),
    rawResponse: z.any().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
