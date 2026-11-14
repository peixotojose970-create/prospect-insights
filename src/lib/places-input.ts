import { z } from "zod";

export const placeIdSchema = z.string().trim().min(3).max(400).regex(/^[A-Za-z0-9_-]+$/, "Identificação de empresa inválida.");
export const photoRefSchema = z.string().trim().max(600).regex(/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/, "Referência de foto inválida.");