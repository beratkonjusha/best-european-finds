import { createServerFn } from "@tanstack/react-start";
import { fetchListingDetail } from "./listings.server";

export const getListingDetail = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data }) => fetchListingDetail(data.id));
