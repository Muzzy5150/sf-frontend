"use client";

import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  WALLET_CHAINS,
  type CryptoWalletDraft,
  type WalletChain,
} from "@/lib/contacts/types";

const CONTROL =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary";

export default function CryptoWalletFields({
  initialWallets,
  error,
}: {
  initialWallets: CryptoWalletDraft[];
  error?: string;
}) {
  const [wallets, setWallets] = useState(initialWallets);

  function update(index: number, change: Partial<CryptoWalletDraft>) {
    setWallets((currentWallets) =>
      currentWallets.map((wallet, current) =>
        current === index ? { ...wallet, ...change } : wallet,
      ),
    );
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Crypto wallets</legend>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">
            Crypto wallets
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Store public addresses across supported networks.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setWallets((current) => [
              ...current,
              { chain: "Bitcoin", address: "" },
            ])
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add wallet
        </Button>
      </div>

      {wallets.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-card/30 px-4 py-5 text-sm text-muted-foreground">
          <Wallet className="h-5 w-5" aria-hidden="true" />
          No crypto wallets yet.
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet, index) => (
            <div key={index} className="rounded-lg border border-border bg-card/50 p-4">
              <div className="grid gap-4 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
                <label className="text-[13px] font-medium">
                  Network
                  <select
                    aria-label={`Wallet ${index + 1} network`}
                    value={wallet.chain}
                    onChange={(event) =>
                      update(index, { chain: event.currentTarget.value as WalletChain })
                    }
                    className={`${CONTROL} mt-1.5`}
                  >
                    {WALLET_CHAINS.map((chain) => (
                      <option key={chain}>{chain}</option>
                    ))}
                  </select>
                </label>
                <label className="text-[13px] font-medium">
                  Wallet address
                  <input
                    aria-label={`Wallet ${index + 1} address`}
                    value={wallet.address}
                    onChange={(event) => update(index, { address: event.currentTarget.value })}
                    required
                    maxLength={256}
                    placeholder="Public wallet address"
                    className={`${CONTROL} mt-1.5 font-mono`}
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove wallet ${index + 1}`}
                  onClick={() =>
                    setWallets((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error ? <p role="alert" className="text-[13px] text-destructive">{error}</p> : null}
      <input type="hidden" name="crypto_wallets" value={JSON.stringify(wallets)} />
    </fieldset>
  );
}
