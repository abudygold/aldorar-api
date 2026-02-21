import { z } from "zod";

const paymentTypeEnum = z.enum(["dp", "installment", "full_payment", "refund"]);
const paymentStatusEnum = z.enum([
  "unpaid",
  "dp_paid",
  "partially_paid",
  "paid",
  "cancelled",
  "refunded",
]);

const paymentSchema = z.object({
  tripTransactionId: z.string().uuid(),
  paymentNumber: z.string().max(50),
  paymentMethod: z.string().max(50),
  paymentChannel: z.string().max(50),
  amount: z.number().int().positive(),
  paymentType: paymentTypeEnum.default("installment"),
  paymentStatus: paymentStatusEnum.default("unpaid"),
  // paidAt: z.coerce.date(),
  // receivedBy: z.string().max(100).optional(),
  referenceNumber: z.string().optional(),
  note: z.string().optional(),
  sequenceNumber: z.number().int().positive().optional(),
});

export const createSchema = paymentSchema.transform((data) => {
  const now = new Date();
  const year = now.getFullYear();
  const day = String(now.getDate()).padStart(2, "0");

  // Format sequence number menjadi 4 digit (0001, 0002, dst)
  const paddedNumber = String(data.sequenceNumber).padStart(4, "0");

  return {
    ...data,
    paymentNumber: `PAY-${year}-${day}${paddedNumber}`,
  };
});

export const updateSchema = paymentSchema
  .omit({ sequenceNumber: true })
  .partial();
