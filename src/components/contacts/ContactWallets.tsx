import { Wallet } from "lucide-react";
import type { CryptoWallet } from "@/lib/contacts/types";

export default function ContactWallets({ wallets }: { wallets: CryptoWallet[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {wallets.map((wallet) => (
        <article key={wallet.id} className="rounded-md border border-border bg-background/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
              {wallet.chain}
            </span>
          </div>
          <p className="break-all font-mono text-[13px] text-foreground">{wallet.address}</p>
        </article>
      ))}
    </div>
  );
}
