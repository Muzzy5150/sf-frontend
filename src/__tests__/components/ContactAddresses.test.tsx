import React from "react";
import { render, screen } from "@testing-library/react";
import ContactAddresses from "@/components/contacts/ContactAddresses";
import { makeContact } from "../mocks/handlers";

describe("ContactAddresses", () => {
  it("renders typed addresses in Home, Work, Other order", () => {
    const base = makeContact().addresses[0];
    render(
      <ContactAddresses
        addresses={[
          { ...base, id: 3, type: "Other", address: "PO Box 42" },
          { ...base, id: 2, type: "Work", address: "88 Market St" },
          { ...base, id: 1, type: "Home", address: "1 Main St" },
        ]}
      />,
    );

    expect(screen.getAllByRole("article").map((node) => node.textContent)).toEqual([
      expect.stringContaining("Home"),
      expect.stringContaining("Work"),
      expect.stringContaining("Other"),
    ]);
    expect(screen.getAllByText("San Francisco, CA 94105")).toHaveLength(3);
  });

  it("renders nothing for an empty collection", () => {
    const { container } = render(<ContactAddresses addresses={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
