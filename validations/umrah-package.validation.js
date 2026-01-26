import { z } from "zod";

/* Common fields (reusable) */
const flightTypeEnum = z.enum(["direct", "transit"]);
const umrahTypeEnum = z.enum(["regular", "plus", "private"]);
const hotelStarSchema = z.number().int().min(1).max(5);

/* CREATE SCHEMA */
export const createSchema = z.object({
  title: z.string().min(3).max(150),
  slug: z.string().min(3).max(160),

  umrahType: umrahTypeEnum.default("regular"),
  departureDate: z.coerce.date(),
  durationDays: z.number().int().positive(),
  quota: z.number().int(),

  airline: z.string().min(2).max(100),
  flightType: flightTypeEnum,
  landingCity: z.string().min(2).max(100),

  madinahHotelName: z.string().min(2).max(150),
  madinahHotelStar: hotelStarSchema,
  mekkahHotelName: z.string().min(2).max(150),
  mekkahHotelStar: hotelStarSchema,

  isPlusThaif: z.boolean().default(false),
  isHighSpeedTrain: z.boolean().default(false),
  isAvailable: z.boolean().optional(),
  isPublish: z.boolean().optional(),
});

export const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
