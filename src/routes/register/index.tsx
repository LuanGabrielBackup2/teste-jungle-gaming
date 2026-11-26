import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "../../components/auth/RegisterPage";
import { z } from "zod";

const registerSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/register/")({
  validateSearch: registerSearchSchema,
  component: RegisterPage,
});
