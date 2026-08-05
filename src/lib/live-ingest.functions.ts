import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requestLiveIngest } from "./live-ingest.server";

const liveSearchSchema = z.object({
  q: z.string().trim().max(200),
  category: z.enum(["all", "real_estate", "apartments", "cars", "motorcycles"]),
  country: z.string().max(2),
  regionId: z.string().max(80),
  cityId: z.string().max(80),
  radius: z.number().min(0).max(500),
  sourceIds: z.array(z.string().uuid()).max(50),
  priceMin: z.string().regex(/^\d*$/).max(12),
  priceMax: z.string().regex(/^\d*$/).max(12),
});

export const startLiveIngest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => liveSearchSchema.parse(input))
  .handler(async ({ data }) => requestLiveIngest(data));