import { z } from "zod";

const travelerSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.coerce.date().optional(),
  nationality: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  passportNumber: z.string().optional(),
  passportIssuedDate: z.coerce.date().optional(),
  passportExpiredDate: z.coerce.date().optional(),
  passportIssuedCountry: z.string().optional(),
  totalTripCount: z.number().int().nonnegative().optional(),
});

export const travelersSchema = z.object({
  travelers: z.array(travelerSchema),
});

export const createSchema = travelersSchema;

export const updateSchema = travelerSchema.partial();
