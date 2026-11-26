import { createFileRoute } from "@tanstack/react-router";
import { NFTDetailPage } from "../../components/nft/NFTDetailPage";

export const Route = createFileRoute("/nft/$id")({
  component: NFTDetailPage,
});
