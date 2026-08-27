import { MapPin } from "lucide-react";
import { addressLocalityLine, sortAddresses } from "@/lib/contacts/format";
import type { Address } from "@/lib/contacts/types";

export default function ContactAddresses({ addresses }: { addresses: Address[] }) {
  if (addresses.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sortAddresses(addresses).map((address) => {
        const locality = addressLocalityLine(address);
        return (
          <article
            key={address.id}
            className="rounded-md border border-border bg-background/50 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <MapPin
                className="h-3.5 w-3.5 text-primary"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground">
                {address.type}
              </span>
            </div>
            <p className="font-medium text-foreground">{address.address}</p>
            {locality ? <p className="mt-0.5 text-muted-foreground">{locality}</p> : null}
            {address.country ? (
              <p className="mt-0.5 text-muted-foreground">{address.country}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
