import { z } from "zod";
import {
  ADDRESS_TYPES,
  type AddressDraft,
  type AddressInput,
  type ContactInput,
  type ContactTextField,
  type CryptoWalletDraft,
  type CryptoWalletInput,
  WALLET_CHAINS,
} from "./types";

export type { ContactTextField } from "./types";

/**
 * Client/server-shared validation for the contact form.
 *
 * The rules mirror the API's Pydantic models (`ContactCreate` / `ContactReplace`)
 * so the user sees a mistake before a round trip — the API stays the authority,
 * and anything it rejects anyway is surfaced by `toFieldErrors` in `./api.ts`.
 */

/** Optional text: trimmed, and blank becomes `null` (the API clears the field). */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => value || null)
    .nullable()
    .default(null);
}

function requiredText(max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);
}

export const ADDRESS_FIELD_LIMITS = {
  address: 300,
  city: 120,
  state: 120,
  postal_code: 20,
  country: 120,
} as const;

export const addressInputSchema = z.object({
  type: z.enum(ADDRESS_TYPES, "Choose Home, Work, or Other"),
  address: requiredText(ADDRESS_FIELD_LIMITS.address, "Street address"),
  city: optionalText(ADDRESS_FIELD_LIMITS.city, "City"),
  state: optionalText(ADDRESS_FIELD_LIMITS.state, "State / region"),
  postal_code: optionalText(ADDRESS_FIELD_LIMITS.postal_code, "Postal code"),
  country: optionalText(ADDRESS_FIELD_LIMITS.country, "Country"),
}) satisfies z.ZodType<AddressInput, unknown>;

const addressDraftSchema = z.object({
  type: z.enum(ADDRESS_TYPES),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string(),
});

export const cryptoWalletInputSchema = z.object({
  chain: z.enum(WALLET_CHAINS, "Choose a supported network"),
  address: requiredText(256, "Wallet address"),
}) satisfies z.ZodType<CryptoWalletInput, unknown>;

const cryptoWalletDraftSchema = z.object({
  chain: z.enum(WALLET_CHAINS),
  address: z.string(),
});

export const contactInputSchema = z.object({
  first_name: requiredText(100, "First name"),
  last_name: requiredText(100, "Last name"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(320, "Email must be 320 characters or fewer")
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  phone: optionalText(40, "Phone"),
  company: optionalText(200, "Company"),
  job_title: optionalText(200, "Job title"),
  addresses: z.array(addressInputSchema),
  crypto_wallets: z.array(cryptoWalletInputSchema),
  notes: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .default(null),
  photo: z.string().nullable().default(null),
}) satisfies z.ZodType<ContactInput, unknown>;

/** Collapse a ZodError into one message per field, keyed by input name. */
export function zodFieldErrors(
  error: z.ZodError,
): Partial<Record<keyof ContactInput, string>> {
  const fieldErrors: Partial<Record<keyof ContactInput, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) {
      const addressIndex = key === "addresses" ? issue.path[1] : undefined;
      fieldErrors[key as keyof ContactInput] =
        typeof addressIndex === "number"
          ? `Address ${addressIndex + 1}: ${issue.message}`
          : issue.message;
    }
  }
  return fieldErrors;
}

/* ------------------------------------------------------------------ */
/* Form metadata — one source of truth for the fields and their limits */
/* ------------------------------------------------------------------ */

export interface ContactFieldSpec {
  name: ContactTextField;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  maxLength: number;
  placeholder?: string;
  autoComplete?: string;
  /** Column span inside the section grid. */
  wide?: boolean;
}

export interface ContactFieldGroup {
  title: string;
  description: string;
  fields: ContactFieldSpec[];
}

export const CONTACT_FIELD_GROUPS: ContactFieldGroup[] = [
  {
    title: "Identity",
    description: "First name, last name, and email are required.",
    fields: [
      {
        name: "first_name",
        label: "First name",
        required: true,
        maxLength: 100,
        placeholder: "Ada",
        autoComplete: "given-name",
      },
      {
        name: "last_name",
        label: "Last name",
        required: true,
        maxLength: 100,
        placeholder: "Lovelace",
        autoComplete: "family-name",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        maxLength: 320,
        placeholder: "ada@example.com",
        autoComplete: "email",
      },
      {
        name: "phone",
        label: "Phone",
        type: "tel",
        maxLength: 40,
        placeholder: "+1-415-555-0101",
        autoComplete: "tel",
      },
    ],
  },
  {
    title: "Work",
    description: "Where they work and what they do.",
    fields: [
      {
        name: "company",
        label: "Company",
        maxLength: 200,
        placeholder: "Analytical Engines",
        autoComplete: "organization",
      },
      {
        name: "job_title",
        label: "Job title",
        maxLength: 200,
        placeholder: "Mathematician",
        autoComplete: "organization-title",
      },
    ],
  },
  {
    title: "Notes",
    description: "Anything worth remembering. No length limit.",
    fields: [
      {
        name: "notes",
        label: "Notes",
        type: "textarea",
        maxLength: 10_000,
        placeholder: "Met at the SF hackathon.",
        wide: true,
      },
    ],
  },
];

export const CONTACT_FIELDS: ContactFieldSpec[] = CONTACT_FIELD_GROUPS.flatMap(
  (group) => group.fields,
);

/** Pull the contact fields out of a submitted form, as raw strings. */
export function formDataToValues(formData: FormData): ContactFormValues {
  const textValues = Object.fromEntries(
    CONTACT_FIELDS.map((field) => [
      field.name,
      String(formData.get(field.name) ?? ""),
    ]),
  ) as Record<ContactTextField, string>;

  const serializedAddresses = String(formData.get("addresses") ?? "[]");
  const serializedWallets = String(formData.get("crypto_wallets") ?? "[]");
  let addresses: unknown;
  try {
    addresses = JSON.parse(serializedAddresses);
  } catch {
    addresses = serializedAddresses;
  }

  let crypto_wallets: unknown;
  try {
    crypto_wallets = JSON.parse(serializedWallets);
  } catch {
    crypto_wallets = serializedWallets;
  }

  return { ...textValues, addresses, crypto_wallets };
}

export type ContactFormValues = Record<ContactTextField, string> & {
  addresses: unknown;
  crypto_wallets: unknown;
};

/** Preserve editable address rows after failed validation without trusting JSON shape. */
export function addressDraftsFromUnknown(value: unknown): AddressDraft[] {
  const parsed = z.array(addressDraftSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function walletDraftsFromUnknown(value: unknown): CryptoWalletDraft[] {
  const parsed = z.array(cryptoWalletDraftSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}
