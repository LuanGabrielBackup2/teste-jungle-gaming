import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "../../components/profile/ProfilePage";
import { requireAuth } from "../../lib/sessionLoader";

export const Route = createFileRoute("/profile/")({
  beforeLoad: ({ context }) => requireAuth(context.queryClient, "/profile"),
  component: ProfilePage,
});
