import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "../../hooks/useCart";
import { useWallets } from "../../hooks/useProfile";
import { useValidateQuote } from "../../hooks/useQuote";
import { useCreateOrder } from "../../hooks/useOrders";
import { useSession } from "../../hooks/useSession";
import { Skeleton, ErrorState } from "../shared";
import { formatEth } from "../../lib/decimal";
import { nanoid } from "../../lib/nanoid";
import type { Quote, WalletNetwork } from "../../types";

type Step = "review" | "confirm";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: session } = useSession();
  const validateQuote = useValidateQuote();
  const createOrder = useCreateOrder();

  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<WalletNetwork>("ethereum");
  const [step, setStep] = useState<Step>("review");
  const [freshQuote, setFreshQuote] = useState<Quote | null>(null);
  const [priceChangedWarning, setPriceChangedWarning] = useState(false);

  if (cartLoading || walletsLoading) {
    return (
      <div className="section max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="section">
        <ErrorState message="Seu carrinho está vazio." />
      </div>
    );
  }

  const walletId = selectedWalletId || wallets?.[0]?.id || "";
  const selectedWallet = wallets?.find((w) => w.id === walletId);

  async function handleReviewOrder() {
    if (!walletId) return;
    setPriceChangedWarning(false);
    const quote = await validateQuote.mutateAsync({
      items: items.map((i) => ({
        nftId: i.nftId,
        editionId: i.editionId,
        quantity: i.quantity,
      })),
    });

    const hasChanges = quote.items.some(
      (qi) => qi.priceChanged || qi.availabilityChanged
    );
    if (hasChanges) {
      setPriceChangedWarning(true);
    }

    setFreshQuote(quote);
    setStep("confirm");
  }

  async function handleConfirmOrder() {
    if (!freshQuote || !walletId || !session) return;

    try {
      const order = await createOrder.mutateAsync({
        idempotencyKey: nanoid(32),
        items: items.map((i) => ({
          nftId: i.nftId,
          editionId: i.editionId,
          quantity: i.quantity,
        })),
        walletId,
        network: selectedNetwork,
        quoteSnapshot: freshQuote,
      });

      navigate({ to: "/order/$id", params: { id: order.id } });
    } catch {
      // Error shown via createOrder.isError
    }
  }

  const quote = freshQuote;

  return (
    <div className="section max-w-2xl mx-auto">
      <div className="mb-10">
        <span className="eyebrow block mb-3">PAGAMENTO</span>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-1px" }}
        >
          {step === "review" ? "Revisar pedido" : "Confirmar compra"}
        </h1>
      </div>

      {/* Price changed warning */}
      {priceChangedWarning && (
        <div
          role="alert"
          className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 mb-6"
        >
          ⚠ Alguns preços ou disponibilidades mudaram. Revise o resumo antes de confirmar.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* ── Left ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Items */}
          <section aria-labelledby="items-heading">
            <h2 id="items-heading" className="text-xs font-bold uppercase tracking-widest mb-4">
              Itens
            </h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={`${item.nftId}-${item.editionId}`} className="flex gap-3 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.editionLabel} · ×{item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap">
                    {formatEth(`${parseFloat(item.price) * item.quantity}`)} ETH
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Wallet selector */}
          <section aria-labelledby="wallet-heading">
            <h2 id="wallet-heading" className="text-xs font-bold uppercase tracking-widest mb-4">
              Carteira
            </h2>
            {!wallets || wallets.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhuma carteira cadastrada.{" "}
                <a href="/wallets" className="text-[#a4c65b] font-semibold">
                  Adicionar carteira
                </a>
              </p>
            ) : (
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Selecionar carteira">
                {wallets.map((w) => (
                  <label
                    key={w.id}
                    className={`flex items-center gap-3 border p-3 cursor-pointer ${
                      (walletId || wallets[0].id) === w.id
                        ? "border-[#a4c65b] bg-[#f0f7e0]"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="wallet"
                      value={w.id}
                      checked={(walletId || wallets[0].id) === w.id}
                      onChange={() => setSelectedWalletId(w.id)}
                      className="accent-[#a4c65b]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{w.name}</p>
                      <p className="text-xs font-mono text-gray-400 truncate">{w.address}</p>
                    </div>
                    <span className="text-xs text-gray-400 capitalize shrink-0">{w.label}</span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Network selector */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="network-select"
              className="text-xs font-semibold uppercase tracking-widest text-gray-500"
            >
              Rede
            </label>
            <select
              id="network-select"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value as WalletNetwork)}
              className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b] bg-white"
            >
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="solana">Solana</option>
            </select>
          </div>
        </div>

        {/* ── Right: summary ─────────────────────────────────────────────── */}
        <div className="border border-gray-100 p-6 flex flex-col gap-4 self-start">
          <h2 className="text-xs font-bold uppercase tracking-widest">Resumo</h2>

          {quote ? (
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
          ) : (
            <p className="text-xs text-gray-400">
              Clique em "Revisar" para calcular o total.
            </p>
          )}

          {/* Wallet confirm display */}
          {selectedWallet && step === "confirm" && (
            <div className="bg-gray-50 p-3 text-xs">
              <p className="font-semibold mb-1">Pagando com:</p>
              <p className="text-gray-500 font-mono break-all">{selectedWallet.address}</p>
              <p className="text-gray-400 mt-1 capitalize">{selectedWallet.network}</p>
            </div>
          )}

          {createOrder.isError && (
            <p role="alert" className="text-xs text-red-500">
              Falha ao criar pedido. Tente novamente.
            </p>
          )}

          {step === "review" ? (
            <button
              onClick={handleReviewOrder}
              disabled={!walletId || validateQuote.isPending}
              className="button button-light w-full justify-center disabled:opacity-50"
            >
              {validateQuote.isPending ? "Verificando preços…" : "REVISAR PEDIDO ↗"}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmOrder}
                disabled={createOrder.isPending}
                className="button button-light w-full justify-center disabled:opacity-50"
              >
                {createOrder.isPending ? "Enviando…" : "CONFIRMAR COMPRA ↗"}
              </button>
              <button
                onClick={() => {
                  setStep("review");
                  setFreshQuote(null);
                  setPriceChangedWarning(false);
                }}
                className="outline-button w-full text-xs py-2"
              >
                Voltar e editar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
