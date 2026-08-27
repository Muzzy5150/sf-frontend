import { saveContactAction } from "@/app/contacts/actions";
import {
  getContact,
  replaceContact,
} from "@/lib/contacts/api";
import { CONTACT_FIELDS } from "@/lib/contacts/schema";
import { EMPTY_FORM_STATE } from "@/lib/contacts/types";
import { makeContact } from "../../mocks/handlers";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/contacts/api", () => ({
  apiErrorMessage: jest.fn(),
  createContact: jest.fn(),
  deleteContact: jest.fn(),
  getContact: jest.fn(),
  replaceContact: jest.fn(),
  toFieldErrors: jest.fn(),
}));

const PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYGBg+A8AAQQBAHAgJt0AAAAASUVORK5CYII=";

function validFormData(): FormData {
  const values: Record<string, string> = {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
  };
  const formData = new FormData();
  for (const field of CONTACT_FIELDS) {
    formData.set(field.name, values[field.name] ?? "");
  }
  formData.set("addresses", "[]");
  formData.set("remove_photo", "false");
  return formData;
}

describe("saveContactAction photo preservation", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(replaceContact).mockResolvedValue(makeContact({ photo: PHOTO }));
  });

  it("carries the current photo through PUT when no replacement is selected", async () => {
    jest.mocked(getContact).mockResolvedValue(makeContact({ photo: PHOTO }));

    await saveContactAction(1, EMPTY_FORM_STATE, validFormData());

    expect(getContact).toHaveBeenCalledWith(1);
    expect(replaceContact).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ photo: PHOTO }),
    );
  });

  it("does not reload or preserve the photo after explicit removal", async () => {
    const formData = validFormData();
    formData.set("remove_photo", "true");

    await saveContactAction(1, EMPTY_FORM_STATE, formData);

    expect(getContact).not.toHaveBeenCalled();
    expect(replaceContact).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ photo: null }),
    );
  });

  it("sends validated addresses through PUT without regressing photo preservation", async () => {
    const formData = validFormData();
    formData.set(
      "addresses",
      JSON.stringify([
        {
          type: "Work",
          address: " 88 Market St ",
          city: "San Francisco",
          state: "CA",
          postal_code: "94105",
          country: "USA",
        },
      ]),
    );
    jest.mocked(getContact).mockResolvedValue(makeContact({ photo: PHOTO }));

    await saveContactAction(1, EMPTY_FORM_STATE, formData);

    expect(replaceContact).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        photo: PHOTO,
        addresses: [
          {
            type: "Work",
            address: "88 Market St",
            city: "San Francisco",
            state: "CA",
            postal_code: "94105",
            country: "USA",
          },
        ],
      }),
    );
  });
});
