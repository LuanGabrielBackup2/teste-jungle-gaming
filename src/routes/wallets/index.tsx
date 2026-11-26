import { createFileRoute } from "@tanstack/react-router";
import { WalletsPage } from "../../components/profile/WalletsPage";
import { requireAuth } from "../../lib/sessionLoader";

export const Route = createFileRoute("/wallets/")({
  beforeLoad: ({ context }) => requireAuth(context.queryClient, "/wallets"),
  component: WalletsPage,
});
