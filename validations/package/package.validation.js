import { z } from "zod";

/* Common fields (reusable) */
const tripTypeEnum = z.enum(["regular", "plus", "private"]);
const packageTypeEnum = z.enum(["umrah", "hajj", "trip"]);
const flightTypeEnum = z.enum(["direct", "transit"]);
const stringMinMax = z.string().min(2).max(150);
const filghtDate = z.coerce.date();

/* CREATE SCHEMA */
export const createSchema = z.object({
  title: stringMinMax,

  packageType: packageTypeEnum,
  tripType: tripTypeEnum,
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

  isPlusThaif: z.boolean(),
  isHighSpeedTrain: z.boolean(),
  isPublish: z.boolean().optional(),
});

export const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
