import React from "react";
import { render, screen } from "@testing-library/react";
import ContactWallets from "@/components/contacts/ContactWallets";

it("displays wallet networks and public addresses", () => {
  render(
    <ContactWallets
      wallets={[
        { id: 1, chain: "Ethereum", address: "0xabc" },
        { id: 2, chain: "Solana", address: "9xQe-demo" },
      ]}
    />,
  );

  expect(screen.getByText("Ethereum")).toBeInTheDocument();
  expect(screen.getByText("Solana")).toBeInTheDocument();
  expect(screen.getByText("0xabc")).toBeInTheDocument();
});
