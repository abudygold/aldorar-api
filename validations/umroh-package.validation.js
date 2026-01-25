import { z } from "zod";

/* Common fields (reusable) */
const flightTypeEnum = z.enum(["direct", "transit"]);
const umrohTypeEnum = z.enum(["regular", "plus", "private"]);
const priceSchema = z.number().positive();
const hotelStarSchema = z.number().int().min(1).max(5);

/* CREATE SCHEMA */
export const createUmrohPackageSchema = z.object({
  title: z.string().min(3).max(150),
  slug: z.string().min(3).max(160),

  isAvailable: z.boolean().optional(),
  isPublish: z.boolean().optional(),

  departureDate: z.coerce.date(),
  durationDays: z.number().int().positive(),

  umrohType: umrohTypeEnum.default("regular"),
  flightType: flightTypeEnum,

  isPlusThaif: z.boolean().default(false),
  isHighSpeedTrain: z.boolean().default(false),

  airline: z.string().min(2).max(100),
  landingCity: z.string().min(2).max(100),

  madinahHotelName: z.string().min(2).max(150),
  madinahHotelStar: hotelStarSchema,

  mekkahHotelName: z.string().min(2).max(150),
  mekkahHotelStar: hotelStarSchema,

  startPrice: priceSchema,
  priceQuad: priceSchema,
  priceTriple: priceSchema,
  priceDouble: priceSchema,
});

export const updateUmrohPackageSchema = createUmrohPackageSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
