import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useNFT } from "../../hooks/useNFTs";
import { useFavorites, useToggleFavorite } from "../../hooks/useFavorites";
import { useAddToCart } from "../../hooks/useCart";
import { useSession } from "../../hooks/useSession";
import { Skeleton, ErrorState } from "../shared";
import { Route } from "../../routes/nft/$id";

export function NFTDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: nft, isLoading, isError, refetch } = useNFT(id);
  const { data: session } = useSession();
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const addToCart = useAddToCart();

  const [selectedEditionId, setSelectedEditionId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);

  if (isLoading) return <NFTDetailSkeleton />;

  if (isError || !nft) {
    return (
      <div className="section">
        <ErrorState
          message={isError ? "NFT não encontrado ou indisponível." : "NFT não encontrado."}
          onRetry={isError ? () => refetch() : undefined}
        />
        <div className="flex justify-center mt-6">
          <Link to="/" className="text-link">← Voltar ao catálogo</Link>
        </div>
      </div>
    );
  }

  const edition = nft.editions.find((e) => e.id === (selectedEditionId || nft.editions[0]?.id));
  const activeEdition = edition ?? nft.editions[0];
  const isFavorited = !!favorites?.find((f) => f.nftId === nft.id);

  function handleToggleFavorite() {
    if (!session) {
      navigate({ to: "/login", search: { redirect: `/nft/${id}` } });
      return;
    }
    toggleFavorite.mutate({ nftId: nft.id, isFavorited });
  }

  async function handleAddToCart() {
    if (!activeEdition) return;
    try {
      await addToCart.mutateAsync({
        nftId: nft.id,
        editionId: activeEdition.id,
        quantity,
      });
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 2000);
    } catch {
      // Error handled by mutation
    }
  }

  const maxQty = Math.min(activeEdition?.maxPerOrder ?? 1, activeEdition?.available ?? 1);

  return (
    <div className="section">
      {/* Breadcrumb */}
      <nav aria-label="Navegação estrutural" className="text-xs text-gray-400 mb-8 flex gap-2">
        <Link to="/">Início</Link>
        <span aria-hidden>›</span>
        <span>{nft.category}</span>
        <span aria-hidden>›</span>
        <span className="text-gray-700" aria-current="page">{nft.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* ── Gallery ───────────────────────────────────────────────────── */}
        <div>
          <div
            className="relative overflow-hidden bg-gray-100"
            style={{ aspectRatio: "1 / 1.05" }}
          >
            <img
              src={nft.images[activeImage] ?? nft.image}
              alt={`${nft.name} — imagem ${activeImage + 1} de ${nft.images.length}`}
              className="w-full h-full object-cover"
            />
            {nft.tags[0] && (
              <span className="nft-tag">{nft.tags[0]}</span>
            )}
          </div>
          {/* Thumbnails */}
          {nft.images.length > 1 && (
            <div className="flex gap-3 mt-3" role="list" aria-label="Miniaturas">
              {nft.images.map((img, i) => (
                <button
                  key={i}
                  role="listitem"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Ver imagem ${i + 1}`}
                  aria-pressed={activeImage === i}
                  className={`w-16 h-16 overflow-hidden border-2 ${
                    activeImage === i ? "border-[#a4c65b]" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="eyebrow">{nft.category}</span>
            <h1
              className="text-3xl font-extrabold mt-2 leading-tight"
              style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-1px" }}
            >
              {nft.name}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Coleção: {nft.collection} · Rede: {nft.network}
            </p>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-3">
            <img
              src={nft.creator.avatar}
              alt={`Avatar de ${nft.creator.name}`}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div>
              <p className="text-xs text-gray-400">Criador</p>
              <p className="text-sm font-semibold">{nft.creator.name}</p>
            </div>
            <button
              onClick={handleToggleFavorite}
              aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-pressed={isFavorited}
              className={`ml-auto text-2xl transition-colors ${
                isFavorited ? "text-rose-500" : "text-gray-300 hover:text-rose-400"
              }`}
            >
              {isFavorited ? "♥" : "♡"}
            </button>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">{nft.description}</p>

          {/* Edition selector */}
          {nft.editions.length > 1 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Edição
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Selecionar edição">
                {nft.editions.map((ed) => (
                  <button
                    key={ed.id}
                    role="radio"
                    aria-checked={
                      (selectedEditionId || nft.editions[0].id) === ed.id
                    }
                    onClick={() => {
                      setSelectedEditionId(ed.id);
                      setQuantity(1);
                    }}
                    disabled={ed.available === 0}
                    className={`px-4 py-2 text-xs border transition-colors disabled:opacity-40 ${
                      (selectedEditionId || nft.editions[0].id) === ed.id
                        ? "border-[#a4c65b] bg-[#f0f7e0] text-[#75943d] font-bold"
                        : "border-gray-200 hover:border-[#a4c65b]"
                    }`}
                  >
                    {ed.label}
                    {ed.available === 0 && " (esgotado)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-extrabold"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              {activeEdition?.price}
            </span>
            <span className="text-sm text-gray-400">ETH</span>
          </div>

          {/* Availability */}
          {activeEdition && (
            <p className="text-xs text-gray-400">
              {activeEdition.available} disponíveis · máx {activeEdition.maxPerOrder} por pedido
            </p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Quantidade
            </p>
            <div className="flex items-center border border-gray-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
                className="px-3 py-2 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                −
              </button>
              <span
                className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center"
                aria-live="polite"
                aria-label={`Quantidade: ${quantity}`}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                aria-label="Aumentar quantidade"
                className="px-3 py-2 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={
              !activeEdition ||
              activeEdition.available === 0 ||
              addToCart.isPending
            }
            aria-live="polite"
            className="button button-light w-full justify-center disabled:opacity-50"
          >
            {addToCart.isPending
              ? "Adicionando…"
              : addedFeedback
              ? "✓ Adicionado ao carrinho!"
              : activeEdition?.available === 0
              ? "Esgotado"
              : "ADICIONAR AO CARRINHO ↗"}
          </button>

          {addToCart.isError && (
            <p role="alert" className="text-xs text-red-500">
              Não foi possível adicionar. Verifique a disponibilidade.
            </p>
          )}

          <Link to="/cart" className="text-link text-center text-xs">
            Ver carrinho →
          </Link>
        </div>
      </div>
    </div>
  );
}

function NFTDetailSkeleton() {
  return (
    <div className="section">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <Skeleton className="w-full" style={{ aspectRatio: "1 / 1.05" }} />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
