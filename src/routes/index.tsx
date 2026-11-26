import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "../components/layout/HomePage";
import { z } from "zod";

const homeSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z
    .enum(["recent", "price_asc", "price_desc", "popular"])
    .optional(),
  page: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: homeSearchSchema,
  component: HomePage,
});
