import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PlacesUsage = { month: string; calls: number; limit: number; warnAt: number; blockAt: number };

export const getPlacesUsage = createServerFn({ method: "GET" }).handler(async (): Promise<PlacesUsage> => {
  const { readUsage } = await import("./places-usage.server");
  return readUsage();
});

export const setPlacesLimit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ limit: z.number().int().min(10).max(1_000_000) }).parse(data))
  .handler(async ({ data }): Promise<PlacesUsage> => {
    const { readUsage, writeLimit } = await import("./places-usage.server");
    await writeLimit(data.limit);
    return readUsage();
  });
