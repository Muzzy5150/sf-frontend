import React from "react";
import { render, screen, within } from "@testing-library/react";
import ContactDetailPage from "@/app/contacts/[id]/page";
import { getContact } from "@/lib/contacts/api";
import { makeContact } from "../../mocks/handlers";

jest.mock("@/lib/contacts/api", () => ({ getContact: jest.fn() }));

describe("contact detail addresses", () => {
  it("shows the normal placeholder when a contact has no addresses", async () => {
    jest.mocked(getContact).mockResolvedValue(makeContact({ addresses: [] }));

    render(await ContactDetailPage({ params: Promise.resolve({ id: "1" }) }));

    const label = screen.getByText("Addresses");
    expect(within(label.parentElement!).getByText("—")).toBeInTheDocument();
  });
});
