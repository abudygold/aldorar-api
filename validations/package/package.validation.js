import { z } from "zod";
import { makeSlug } from "../../utils/make-slug.js";

/* Common fields (reusable) */
const tripTypeEnum = z.enum(["regular", "plus", "private"]);
const packageTypeEnum = z.enum(["umrah", "hajj", "trip"]);
const flightTypeEnum = z.enum(["direct", "transit"]);
const stringMinMax = z.string().min(2).max(150);
const filghtDate = z.coerce.date();
const hotelStarSchema = z.number().int().min(1).max(5);

/* CREATE SCHEMA */
export const createSchema = z.object({
  title: stringMinMax,

  packageType: packageTypeEnum.optional().default("umrah"),
  tripType: tripTypeEnum.default("regular"),
  durationDays: z.number().int().positive(),
  quota: z.number().int(),

  departureDate: filghtDate,
  departureAirline: stringMinMax,
  departureFlightType: flightTypeEnum,
  departureLanding: stringMinMax,

  returnDate: filghtDate,
  returnAirline: stringMinMax,
  returnFlightType: flightTypeEnum,
  returnLanding: stringMinMax,

  madinahHotelName: stringMinMax,
  madinahHotelStar: hotelStarSchema,
  mekkahHotelName: stringMinMax,
  mekkahHotelStar: hotelStarSchema,

  isPlusThaif: z.boolean().optional().default(false),
  isHighSpeedTrain: z.boolean().optional().default(false),
  isPublish: z.boolean().optional().default(false),
});

export const updateSchema = createSchema
  .partial()
  .extend({
    slug: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  })
  .transform((data) => {
    // Logic: If title exists and slug doesn't, create it
    if (data.title) {
      return { ...data, slug: makeSlug(data.title) };
    }
    return data;
  });
