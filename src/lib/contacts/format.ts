import type { Address, Contact } from "./types";

/** Presentation helpers shared by the list, the detail page, and the cards. */

/** Up to two letters for the avatar bubble. */
export function initials(contact: Pick<Contact, "first_name" | "last_name">) {
  return `${contact.first_name.at(0) ?? ""}${contact.last_name.at(0) ?? ""}`
    .toUpperCase()
    .trim();
}

/**
 * Stable hue per contact so the same person keeps the same avatar colour
 * across renders and machines (no randomness, no hydration mismatch).
 */
export function avatarHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  return hash;
}

// Rendered on the server and hydrated on the client, so pin the locale and zone
// rather than letting each side pick its own and mismatch.
const TIMESTAMP_FORMAT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${TIMESTAMP_FORMAT.format(date)} UTC`;
}

/** "Ada Lovelace · Mathematician at Analytical Engines"-style subtitle. */
export function jobLine(contact: Contact): string | null {
  if (contact.job_title && contact.company) {
    return `${contact.job_title} at ${contact.company}`;
  }
  return contact.job_title ?? contact.company ?? null;
}

/** City/region/postal line for a nested postal address. */
export function addressLocalityLine(address: Address): string | null {
  const locality = [address.city, address.state].filter(Boolean).join(", ");
  const line = [locality, address.postal_code].filter(Boolean).join(" ");
  return line || null;
}

const ADDRESS_TYPE_ORDER = { Home: 0, Work: 1, Other: 2 } as const;

/** Stable display order requested by the challenge: Home, then Work, then Other. */
export function sortAddresses(addresses: Address[]): Address[] {
  return [...addresses].sort(
    (left, right) =>
      ADDRESS_TYPE_ORDER[left.type] - ADDRESS_TYPE_ORDER[right.type] ||
      left.id - right.id,
  );
}
