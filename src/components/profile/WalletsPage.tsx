import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useWallets, useUpsertWallet } from "../../hooks/useProfile";
import { Skeleton } from "../shared";
import type { WalletNetwork } from "../../types";

const NETWORKS: WalletNetwork[] = ["ethereum", "polygon", "solana"];

function WalletForm({
  label,
  initial,
  onSave,
  isPending,
}: {
  label: "primary" | "secondary";
  initial?: { address: string; network: WalletNetwork; name: string };
  onSave: (data: {
    label: "primary" | "secondary";
    address: string;
    network: WalletNetwork;
    name: string;
  }) => void;
  isPending: boolean;
}) {
  const [address, setAddress] = useState(initial?.address ?? "");
  const [network, setNetwork] = useState<WalletNetwork>(initial?.network ?? "ethereum");
  const [walletName, setWalletName] = useState(initial?.name ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!address.trim()) e.address = "Endereço obrigatório";
    if (!walletName.trim()) e.walletName = "Nome obrigatório";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSave({ label, address, network, name: walletName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={`wallet-name-${label}`} className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Nome da carteira
        </label>
        <input
          id={`wallet-name-${label}`}
          type="text"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          aria-invalid={!!errors.walletName}
          aria-describedby={errors.walletName ? `wallet-name-${label}-error` : undefined}
          className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b]"
          placeholder="Ex: MetaMask Principal"
        />
        {errors.walletName && (
          <span id={`wallet-name-${label}-error`} role="alert" className="text-xs text-red-500">
            {errors.walletName}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`wallet-address-${label}`} className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Endereço
        </label>
        <input
          id={`wallet-address-${label}`}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? `wallet-address-${label}-error` : undefined}
          className="border border-gray-200 px-4 py-3 text-sm font-mono outline-none focus:border-[#a4c65b]"
          placeholder="0x..."
        />
        {errors.address && (
          <span id={`wallet-address-${label}-error`} role="alert" className="text-xs text-red-500">
            {errors.address}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`wallet-network-${label}`} className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Rede
        </label>
        <select
          id={`wallet-network-${label}`}
          value={network}
          onChange={(e) => setNetwork(e.target.value as WalletNetwork)}
          className="border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#a4c65b] bg-white"
        >
          {NETWORKS.map((n) => (
            <option key={n} value={n}>
              {n.charAt(0).toUpperCase() + n.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-live="polite"
        className="button button-light self-start disabled:opacity-60"
      >
        {isPending ? "Salvando…" : saved ? "✓ Salvo!" : "SALVAR CARTEIRA"}
      </button>
    </form>
  );
}

export function WalletsPage() {
  const { data: wallets, isLoading } = useWallets();
  const upsert = useUpsertWallet();

  const primary = wallets?.find((w) => w.label === "primary");
  const secondary = wallets?.find((w) => w.label === "secondary");

  if (isLoading) {
    return (
      <div className="section max-w-xl mx-auto flex flex-col gap-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="section max-w-xl mx-auto">
      <div className="mb-10">
        <span className="eyebrow block mb-3">MINHAS CARTEIRAS</span>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "Manrope, sans-serif", letterSpacing: "-1px" }}
        >
          Gerenciar carteiras
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Configure sua carteira principal e secundária para transações.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {(["primary", "secondary"] as const).map((label) => {
          const wallet = label === "primary" ? primary : secondary;
          return (
            <section key={label} aria-labelledby={`${label}-heading`}>
              <div className="flex items-center gap-3 mb-5">
                <h2
                  id={`${label}-heading`}
                  className="text-sm font-bold uppercase tracking-widest"
                >
                  Carteira {label === "primary" ? "Principal" : "Secundária"}
                </h2>
                {wallet && (
                  <span className="text-xs text-[#75943d] font-semibold border border-[#a4c65b] px-2 py-0.5">
                    Configurada
                  </span>
                )}
              </div>

              {wallet && (
                <div className="bg-gray-50 px-4 py-3 mb-4 text-xs font-mono text-gray-500 break-all">
                  {wallet.address}
                  <span className="ml-2 text-[#75943d]">({wallet.network})</span>
                </div>
              )}

              <WalletForm
                label={label}
                initial={wallet}
                onSave={(data) => upsert.mutate(data)}
                isPending={upsert.isPending}
              />
            </section>
          );
        })}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100">
        <Link to="/profile" className="text-link text-xs">
          ← Voltar ao perfil
        </Link>
      </div>
    </div>
  );
}
