import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "../../components/checkout/CheckoutPage";
import { requireAuth } from "../../lib/sessionLoader";

export const Route = createFileRoute("/checkout/")({
  beforeLoad: ({ context }) => requireAuth(context.queryClient, "/checkout"),
  component: CheckoutPage,
});
