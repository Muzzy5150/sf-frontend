import React from "react";
import { render, screen } from "@testing-library/react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { makeContact } from "../mocks/handlers";

const PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYGBg+A8AAQQBAHAgJt0AAAAASUVORK5CYII=";

describe("ContactAvatar", () => {
  it("keeps the initials fallback when there is no photo", () => {
    const { container } = render(<ContactAvatar contact={makeContact()} />);

    expect(container).toHaveTextContent("AL");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders a circular profile image when a photo is present", () => {
    render(<ContactAvatar contact={makeContact({ photo: PHOTO })} size="lg" />);

    expect(
      screen.getByRole("img", { name: "Ada Lovelace profile photo" }),
    ).toHaveAttribute("src", PHOTO);
  });
});
