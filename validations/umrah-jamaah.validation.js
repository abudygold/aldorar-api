import { z } from "zod";

const nameSchema = z.string().min(2).max(150);

export const createSchema = z.object({
  umrahTransactionId: z.string().uuid(),
  fullName: nameSchema,
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.string(), // ISO date
  passportNumber: z.string().max(50),
  passportIssuedAt: z.string().max(100),
  passportExpiredAt: z.coerce.date(),
});

export const updateSchema = createSchema
  .omit({ umrahTransactionId: true }) // tidak boleh pindah transaksi
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
