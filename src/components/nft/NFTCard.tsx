import { Link } from "@tanstack/react-router";
import type { NFT } from "../../types";

interface NFTCardProps {
  nft: NFT;
  isFavorited?: boolean;
  onToggleFavorite?: (nftId: string, current: boolean) => void;
  isAuthenticated?: boolean;
}

export function NFTCard({
  nft,
  isFavorited = false,
  onToggleFavorite,
  isAuthenticated = false,
}: NFTCardProps) {
  const lowestPrice = nft.editions.reduce((min, e) =>
    parseFloat(e.price) < parseFloat(min.price) ? e : min
  );

  return (
    <article className="nft-card">
      <div className="nft-image-wrap">
        <Link to="/nft/$id" params={{ id: nft.id }}>
          <img
            src={nft.image}
            alt={`Arte digital: ${nft.name}`}
            loading="lazy"
          />
        </Link>
        {nft.tags[0] && (
          <span className="nft-tag" aria-label={`Tag: ${nft.tags[0]}`}>
            {nft.tags[0]}
          </span>
        )}
        {onToggleFavorite && (
          <button
            className={`favorite${isFavorited ? " favorited" : ""}`}
            onClick={() => {
              if (!isAuthenticated) {
                // Will be handled by the parent — navigate to login
                onToggleFavorite(nft.id, isFavorited);
                return;
              }
              onToggleFavorite(nft.id, isFavorited);
            }}
            aria-label={
              isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"
            }
            aria-pressed={isFavorited}
          >
            {isFavorited ? "♥" : "♡"}
          </button>
        )}
      </div>
      <div className="nft-info">
        <div>
          <h3>
            <Link to="/nft/$id" params={{ id: nft.id }}>
              {nft.name}
            </Link>
          </h3>
          <span>ID do token: #{nft.id.replace("nft-", "").padStart(4, "0")}</span>
        </div>
        <strong>
          {lowestPrice.price} <small>ETH</small>
        </strong>
      </div>
    </article>
  );
}
