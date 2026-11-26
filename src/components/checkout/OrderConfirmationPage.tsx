import { Link } from "@tanstack/react-router";
import { useOrder } from "../../hooks/useOrders";
import { Skeleton, ErrorState } from "../shared";
import { formatEth } from "../../lib/decimal";
import { Route } from "../../routes/order/$id";

export function OrderConfirmationPage() {
  const { id } = Route.useParams();
  const { data: order, isLoading, isError } = useOrder(id);

  if (isLoading || (order?.status === "pending" && !isError)) {
    return (
      <div className="section max-w-xl mx-auto text-center flex flex-col items-center gap-6">
        <div className="animate-spin text-4xl" aria-label="Aguardando confirmação">◷</div>
        <p className="text-sm text-gray-400">
          Aguardando confirmação da transação…
        </p>
        <Skeleton className="h-3 w-48" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="section">
        <ErrorState message="Pedido não encontrado." />
      </div>
    );
  }

  const isConfirmed = order.status === "confirmed";
  const isRefused = order.status === "refused";

  return (
    <div className="section max-w-xl mx-auto">
      {/* Status banner */}
      <div
        className={`p-6 mb-10 text-center ${
          isConfirmed
            ? "bg-[#f0f7e0] border border-[#a4c65b]"
            : isRefused
            ? "bg-red-50 border border-red-200"
            : "bg-amber-50 border border-amber-200"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="text-4xl" aria-hidden>
          {isConfirmed ? "✓" : isRefused ? "✕" : "◷"}
        </span>
        <h1
          className="text-2xl font-bold mt-3"
          style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-1px" }}
        >
          {isConfirmed
            ? "Pedido confirmado!"
            : isRefused
            ? "Pedido recusado"
            : "Pedido pendente"}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {isConfirmed
            ? "Sua compra foi processada com sucesso."
            : isRefused
            ? "A transação foi recusada. Nenhum valor foi cobrado."
            : "Aguardando processamento da rede."}
        </p>
      </div>

      {/* Order details */}
      <section aria-labelledby="order-details-heading" className="flex flex-col gap-6">
        <h2
          id="order-details-heading"
          className="text-xs font-bold uppercase tracking-widest"
        >
          Detalhes do pedido
        </h2>

        <dl className="text-xs flex flex-col gap-2">
          <div className="flex justify-between">
            <dt className="text-gray-500">ID do pedido</dt>
            <dd className="font-mono font-semibold">{order.id}</dd>
          </div>
          {order.txHash && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Hash da transação</dt>
              <dd className="font-mono text-[#75943d] break-all">{order.txHash}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Rede</dt>
            <dd className="capitalize">{order.network}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Carteira</dt>
            <dd className="font-mono break-all">{order.walletAddress}</dd>
          </div>
        </dl>

        {/* Items */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3">Itens</h3>
          <div className="flex flex-col gap-3">
            {order.items.map((item) => (
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
                  {formatEth(item.subtotal)} ETH
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <dl className="flex flex-col gap-2 text-xs border-t border-gray-100 pt-4">
          <div className="flex justify-between">
            <dt className="text-gray-500">Subtotal</dt>
            <dd className="font-semibold">{formatEth(order.subtotal)} ETH</dd>
          </div>
          {parseFloat(order.discount) > 0 && (
            <div className="flex justify-between text-[#75943d]">
              <dt>Desconto</dt>
              <dd>−{formatEth(order.discount)} ETH</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Taxa de rede</dt>
            <dd className="font-semibold">{formatEth(order.networkFee)} ETH</dd>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2">
            <dt>Total</dt>
            <dd>{formatEth(order.total)} ETH</dd>
          </div>
        </dl>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-4">
          <Link to="/" className="button button-light w-full justify-center">
            CONTINUAR EXPLORANDO ↗
          </Link>
          {isRefused && (
            <Link to="/cart" className="outline-button w-full text-center text-xs py-3">
              Voltar ao carrinho
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
