import { z } from "zod";
import { makeSlug } from "../helper/make-slug.js";

// Enums and helpers
const tripTypeEnum = z.enum(["regular", "plus", "private", "vip"]);
const packageTypeEnum = z.enum(["umrah", "hajj", "trip"]);
const stringMinMax = z.string().min(2).max(150);
const flightClassEnum = z.enum(["economy", "business", "first"]).optional();
const flightTypeEnum = z.enum(["departure", "return"]);
const roomTypeEnum = z.enum(["quad", "triple", "double"]);

// Nested schemas
const flightSchema = z.object({
  flightType: flightTypeEnum,
  flightDate: z.coerce.date(),
  airline: stringMinMax,
  flightNumber: stringMinMax,
  flightClass: flightClassEnum,
  departureAirport: stringMinMax,
  arrivalAirport: stringMinMax,
  sequence: z.number().int().positive(),
});

const hotelSchema = z.object({
  city: stringMinMax,
  country: stringMinMax,
  hotelName: stringMinMax,
  star: z.number().int().min(1).max(5),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  sequence: z.number().int().positive(),
});

const priceSchema = z.object({
  roomType: roomTypeEnum,
  price: z.number().int().positive(),
  dpAmount: z.number().int().positive().optional(),
  childPrice: z.number().int().positive().optional(),
  infantPrice: z.number().int().positive().optional(),
  currency: z.string().min(2).max(10),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

const bonusSchema = z.object({
  bonusName: stringMinMax,
  description: z.string().min(2).max(255),
  isOptional: z.boolean().optional(),
});

const itinerarySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: stringMinMax,
  description: z.string().min(2).max(255),
  city: stringMinMax,
});

// Main package schema
export const packageSchema = z.object({
  title: stringMinMax,
  slug: z.string().optional(),
  packageType: packageTypeEnum,
  tripType: tripTypeEnum,
  durationDays: z.number().int().positive(),
  quota: z.number().int().positive(),
  isPublish: z.boolean().optional(),
  flights: z.array(flightSchema),
  hotels: z.array(hotelSchema),
  prices: z.array(priceSchema),
  bonuses: z.array(bonusSchema).optional(),
  itineraries: z.array(itinerarySchema).optional(),
});

/**
 * createSchema: for creating a new package, auto-generates slug from title
 * updateSchema: for updating a package, updates slug if title is present
 */
export const createSchema = packageSchema.transform((data) => {
  return { ...data, slug: makeSlug(data.title) };
});

export const updateSchema = packageSchema.partial().transform((data) => {
  if (data.title) {
    return { ...data, slug: makeSlug(data.title) };
  }
  return data;
});
