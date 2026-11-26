import { createFileRoute } from "@tanstack/react-router";
import { OrderConfirmationPage } from "../../components/checkout/OrderConfirmationPage";

export const Route = createFileRoute("/order/$id")({
  component: OrderConfirmationPage,
});
