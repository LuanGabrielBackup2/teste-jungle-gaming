import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
} from "../../hooks/useCart";
import { useQuote } from "../../hooks/useQuote";
import { useSession } from "../../hooks/useSession";
import { Skeleton, ErrorState } from "../shared";
import { addDecimals, formatEth } from "../../lib/decimal";

export function CartPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading, isError, refetch } = useCart();
  const { data: session } = useSession();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();

  const quoteRequest =
    cart && cart.items.length > 0
      ? {
          items: cart.items.map((i) => ({
            nftId: i.nftId,
            editionId: i.editionId,
            quantity: i.quantity,
          })),
          couponCode: appliedCoupon,
        }
      : null;

  const { data: quote, isLoading: quoteLoading } = useQuote(quoteRequest);

  if (isLoading) return <CartSkeleton />;

  if (isError) {
    return (
      <div className="section">
        <ErrorState
          message="Não foi possível carregar o carrinho."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  function handleProceedToCheckout() {
    if (!session) {
      navigate({ to: "/login", search: { redirect: "/checkout" } });
      return;
    }
    navigate({ to: "/checkout" });
  }

  return (
    <div className="section">
      <div className="mb-10">
        <span className="eyebrow block mb-3">MEU CARRINHO</span>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-1px" }}
        >
          {isEmpty ? "Carrinho vazio" : `${items.length} ${items.length === 1 ? "item" : "itens"}`}
        </h1>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <span className="text-6xl" aria-hidden>◇</span>
          <p className="text-gray-400 text-sm">Seu carrinho está vazio.</p>
          <Link to="/" className="button button-light">
            EXPLORAR NFTs ↗
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* ── Items ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={`${item.nftId}-${item.editionId}`}
                className="flex gap-4 border border-gray-100 p-4"
              >
                <Link to="/nft/$id" params={{ id: item.nftId }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover shrink-0"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to="/nft/$id"
                    params={{ id: item.nftId }}
                    className="text-sm font-semibold hover:text-[#75943d]"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{item.editionLabel}</p>

                  <div className="flex items-center gap-4 mt-3">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() =>
                          updateItem.mutate({
                            nftId: item.nftId,
                            editionId: item.editionId,
                            quantity: item.quantity - 1,
                          })
                        }
                        disabled={item.quantity <= 1 || updateItem.isPending}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="px-2 py-1 text-xs disabled:opacity-40"
                      >
                        −
                      </button>
                      <span
                        className="px-3 py-1 text-xs font-semibold min-w-[2rem] text-center"
                        aria-label={`Quantidade: ${item.quantity}`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateItem.mutate({
                            nftId: item.nftId,
                            editionId: item.editionId,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={item.quantity >= item.available || updateItem.isPending}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="px-2 py-1 text-xs disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold ml-auto">
                      {formatEth(
                        addDecimals(
                          "0",
                          `${parseFloat(item.price) * item.quantity}`
                        )
                      )}{" "}
                      ETH
                    </span>

                    <button
                      onClick={() =>
                        removeItem.mutate({
                          nftId: item.nftId,
                          editionId: item.editionId,
                        })
                      }
                      disabled={removeItem.isPending}
                      aria-label={`Remover ${item.name} do carrinho`}
                      className="text-gray-300 hover:text-red-400 text-lg ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Summary ────────────────────────────────────────────────── */}
          <div className="border border-gray-100 p-6 flex flex-col gap-4">
            <h2
              className="text-sm font-bold uppercase tracking-widest"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Resumo
            </h2>

            {/* Coupon */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedCoupon(couponInput || undefined);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Código do cupom"
                aria-label="Código do cupom"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#a4c65b]"
              />
              <button type="submit" className="outline-button px-3 py-2 text-xs">
                Aplicar
              </button>
            </form>

            {quote?.couponError && (
              <p role="alert" className="text-xs text-red-500">
                {quote.couponError}
              </p>
            )}
            {quote?.couponValid && (
              <p className="text-xs text-[#75943d] font-semibold">
                ✓ Cupom aplicado
              </p>
            )}

            {/* Pricing */}
            {quoteLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : quote ? (
              <dl className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd className="font-semibold">{formatEth(quote.subtotal)} ETH</dd>
                </div>
                {parseFloat(quote.discount) > 0 && (
                  <div className="flex justify-between text-[#75943d]">
                    <dt>Desconto</dt>
                    <dd>−{formatEth(quote.discount)} ETH</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Taxa de rede</dt>
                  <dd className="font-semibold">{formatEth(quote.networkFee)} ETH</dd>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 text-sm font-bold">
                  <dt>Total</dt>
                  <dd>{formatEth(quote.total)} ETH</dd>
                </div>
              </dl>
            ) : null}

            <button
              onClick={handleProceedToCheckout}
              className="button button-light w-full justify-center mt-2"
            >
              {session ? "IR PARA PAGAMENTO ↗" : "ENTRAR PARA COMPRAR ↗"}
            </button>

            <Link to="/" className="text-xs text-center text-link">
              ← Continuar comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="section flex flex-col gap-4">
      <Skeleton className="h-6 w-48 mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 border border-gray-100 p-4">
          <Skeleton className="w-20 h-20 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
            <Skeleton className="h-6 w-32 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
