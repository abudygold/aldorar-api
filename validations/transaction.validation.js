import { z } from "zod";

const paymentStatusEnum = z.enum([
  "unpaid",
  "dp_paid",
  "partially_paid",
  "paid",
  "cancelled",
  "refunded",
]);
const bookingStatusEnum = z.enum([
  "draft",
  "confirmed",
  "cancelled",
  "completed",
]);

// Zod validation schema for transaction object
const documentSchema = z.object({
  document_type: z.string(),
  file_url: z.string(),
  status: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const paymentSchema = z.object({
  payment_type: z.string(),
  payment_method: z.string(),
  amount: z.number().int().positive(),
  payment_date: z.coerce.date(),
});

const travelerInfoSchema = z.object({
  full_name: z.string(),
  nik: z.string(),
  birth_place: z.string(),
  birth_date: z.coerce.date(),
  gender: z.enum(["male", "female"]),
  phone: z.string(),
  email: z.string().email(),
  address: z.string(),
});

const travelerSchema = z.object({
  tripTransactionId: z.string().uuid(),
  travelerId: z.string().uuid(),
});

export const transactionSchema = z.object({
  tripPackageId: z.string(),
  invoiceNumber: z.string(),
  createdBy: z.string(),
  totalParticipant: z.number().int().positive(),
  pricePerPerson: z.number().positive(),
  subtotal: z.number().positive(),
  groupDiscount: z.number().nonnegative().optional(),
  additionalFee: z.number().nonnegative().optional(),
  marketingFee: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
  totalPaid: z.number().nonnegative().optional(),
  paymentStatus: paymentStatusEnum.optional(),
  bookingStatus: bookingStatusEnum.optional(),
  note: z.string().optional(),
  travelers: z.array(travelerSchema),
  sequenceNumber: z.number().int().positive().optional(),
});

export const createSchema = transactionSchema.transform((data) => {
  const now = new Date();
  const year = now.getFullYear();
  const day = String(now.getDate()).padStart(2, "0");

  // Format sequence number menjadi 4 digit (0001, 0002, dst)
  const paddedNumber = String(data.sequenceNumber).padStart(4, "0");

  return {
    ...data,
    paymentStatus: data.paymentStatus?.toLowerCase() || "unpaid",
    bookingStatus: data.bookingStatus?.toLowerCase() || "draft",
    invoiceNumber: `INV-${year}-${day}${paddedNumber}`,
  };
});

export const updateSchema = transactionSchema.partial();
