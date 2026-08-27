"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { ADDRESS_FIELD_LIMITS } from "@/lib/contacts/schema";
import {
  ADDRESS_TYPES,
  type AddressDraft,
  type AddressType,
} from "@/lib/contacts/types";

const CONTROL =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-input";

const POSTAL_FIELDS = [
  {
    name: "address",
    label: "Street address",
    placeholder: "123 Main Street",
    autoComplete: "street-address",
    wide: true,
  },
  {
    name: "city",
    label: "City",
    placeholder: "San Francisco",
    autoComplete: "address-level2",
  },
  {
    name: "state",
    label: "State / region",
    placeholder: "CA",
    autoComplete: "address-level1",
  },
  {
    name: "postal_code",
    label: "Postal code",
    placeholder: "94105",
    autoComplete: "postal-code",
  },
  {
    name: "country",
    label: "Country",
    placeholder: "USA",
    autoComplete: "country-name",
  },
] as const;

export function emptyAddress(type: AddressType = "Home"): AddressDraft {
  return {
    type,
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  };
}

export default function AddressFields({
  initialAddresses,
  error,
}: {
  initialAddresses: AddressDraft[];
  error?: string;
}) {
  const [addresses, setAddresses] = useState(initialAddresses);

  function updateAddress(index: number, update: Partial<AddressDraft>) {
    setAddresses(
      addresses.map((address, currentIndex) =>
        currentIndex === index ? { ...address, ...update } : address,
      ),
    );
  }

  function addAddress() {
    const nextType = ADDRESS_TYPES.find(
      (type) => !addresses.some((address) => address.type === type),
    );
    setAddresses([...addresses, emptyAddress(nextType ?? "Other")]);
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Addresses</legend>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">
            Addresses
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Add any number of Home, Work, or Other postal addresses.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addAddress}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-card/30 px-4 py-5 text-sm text-muted-foreground">
          <MapPin className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          No addresses yet. Add one when postal details are useful.
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-card/50 p-4"
            >
              <div className="mb-4 flex items-end justify-between gap-3">
                <div className="w-full max-w-48">
                  <label
                    htmlFor={`address-${index}-type`}
                    className="mb-1.5 block text-[13px] font-medium text-foreground"
                  >
                    Address {index + 1} type
                  </label>
                  {/* A keyed default keeps the current draft selected when
                      React resets the surrounding Server Action form. */}
                  <select
                    key={address.type}
                    id={`address-${index}-type`}
                    defaultValue={address.type}
                    onChange={(event) =>
                      updateAddress(index, {
                        type: event.currentTarget.value as AddressType,
                      })
                    }
                    className={CONTROL}
                  >
                    {ADDRESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setAddresses(
                      addresses.filter((_, currentIndex) => currentIndex !== index),
                    )
                  }
                  aria-label={`Remove address ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {POSTAL_FIELDS.map((field) => {
                  const id = `address-${index}-${field.name}`;
                  return (
                    <div
                      key={field.name}
                      className={
                        "wide" in field && field.wide ? "sm:col-span-2" : undefined
                      }
                    >
                      <label
                        htmlFor={id}
                        className="mb-1.5 block text-[13px] font-medium text-foreground"
                      >
                        <span className="sr-only">Address {index + 1} </span>
                        {field.label}
                        {field.name === "address" ? (
                          <span className="ml-1 text-destructive" aria-hidden="true">
                            *
                          </span>
                        ) : (
                          <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                            optional
                          </span>
                        )}
                      </label>
                      <input
                        id={id}
                        type="text"
                        value={address[field.name]}
                        required={field.name === "address"}
                        maxLength={ADDRESS_FIELD_LIMITS[field.name]}
                        placeholder={field.placeholder}
                        autoComplete={field.autoComplete}
                        onChange={(event) =>
                          updateAddress(index, {
                            [field.name]: event.currentTarget.value,
                          })
                        }
                        className={CONTROL}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
      <input type="hidden" name="addresses" value={JSON.stringify(addresses)} />
    </fieldset>
  );
}
