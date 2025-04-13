import { z } from 'zod';
import { SortBy, SortOrder } from './enums'; // Assuming these enums exist

export const SuggestionQuerySchema = z.object({
  sortBy: z.nativeEnum(SortBy).optional(),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.ASC),
  minAge: z.coerce.number()
    .min(18)
    .max(100)
    .optional(),
  maxAge: z.coerce.number()
    .min(18)
    .max(100)
    .optional(),
  minFameRating: z.coerce.number()
    .min(0)
    .max(5)
    .optional(),
  maxDistance: z.coerce.number()
    .min(1)
    .optional(),
  tags: z.union([
    z.string().transform(val => [val]),
    z.array(z.string())
  ]).optional(),
  page: z.coerce.number()
    .min(1)
    .default(1),
  limit: z.coerce.number()
    .min(1)
    .max(100)
    .default(20)
}).refine(data => {
  if (data.minAge && data.maxAge) {
    return data.maxAge >= data.minAge;
  }
  return true;
}, {
  message: "maxAge must be greater than or equal to minAge",
  path: ["maxAge"]
});

export type SuggestionQueryDto = z.infer<typeof SuggestionQuerySchema>;