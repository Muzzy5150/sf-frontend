import {
  CONTACT_FIELDS,
  addressDraftsFromUnknown,
  contactInputSchema,
  formDataToValues,
  zodFieldErrors,
} from "@/lib/contacts/schema";

function values(overrides: Record<string, unknown> = {}) {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    company: "",
    job_title: "",
    addresses: [],
    notes: "",
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
    expect(parsed.photo).toBeNull();
  });

  it("trims what the user typed", () => {
    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires the three fields the API requires", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
  });

  it("rejects a malformed email", () => {
    const result = contactInputSchema.safeParse(values({ email: "not-an-email" }));
    expect(zodFieldErrors(result.error!).email).toBe("Enter a valid email address");
  });

  it("enforces the API's length limits", () => {
    const result = contactInputSchema.safeParse(
      values({
        first_name: "a".repeat(101),
        addresses: [
          {
            type: "Home",
            address: "1 Market St",
            city: "",
            state: "",
            postal_code: "9".repeat(21),
            country: "",
          },
        ],
      }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
      addresses: "Address 1: Postal code must be 20 characters or fewer",
    });
  });

  it("validates and normalizes nested address rows", () => {
    const parsed = contactInputSchema.parse(
      values({
        addresses: [
          {
            type: "Work",
            address: "  88 Market St  ",
            city: "  San Francisco ",
            state: "",
            postal_code: "94105",
            country: "USA",
          },
        ],
      }),
    );

    expect(parsed.addresses).toEqual([
      {
        type: "Work",
        address: "88 Market St",
        city: "San Francisco",
        state: null,
        postal_code: "94105",
        country: "USA",
      },
    ]);
  });

  it("rejects an invalid address type and a blank street", () => {
    const invalidType = contactInputSchema.safeParse(
      values({
        addresses: [
          {
            type: "Vacation",
            address: "1 Main St",
            city: "",
            state: "",
            postal_code: "",
            country: "",
          },
        ],
      }),
    );
    const blankStreet = contactInputSchema.safeParse(
      values({
        addresses: [
          {
            type: "Home",
            address: " ",
            city: "",
            state: "",
            postal_code: "",
            country: "",
          },
        ],
      }),
    );

    expect(zodFieldErrors(invalidType.error!).addresses).toMatch(/Home, Work, or Other/);
    expect(zodFieldErrors(blankStreet.error!).addresses).toBe(
      "Address 1: Street address is required",
    );
  });
});

describe("formDataToValues", () => {
  it("pulls every known field out, defaulting to an empty string", () => {
    const formData = new FormData();
    formData.set("first_name", "Grace");
    formData.set("email", "grace@example.com");
    formData.set(
      "addresses",
      JSON.stringify([
        {
          type: "Home",
          address: "1 Main St",
          city: "",
          state: "",
          postal_code: "",
          country: "",
        },
      ]),
    );
    formData.set("ignored", "nope");

    const extracted = formDataToValues(formData);

    expect(extracted.first_name).toBe("Grace");
    expect(extracted.last_name).toBe("");
    expect(extracted.addresses).toEqual([
      expect.objectContaining({ type: "Home", address: "1 Main St" }),
    ]);
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "addresses"].sort(),
    );
  });

  it("preserves incomplete address drafts after failed validation", () => {
    expect(
      addressDraftsFromUnknown([
        {
          type: "Other",
          address: "",
          city: "Somewhere",
          state: "",
          postal_code: "",
          country: "",
        },
      ]),
    ).toHaveLength(1);
  });
});
