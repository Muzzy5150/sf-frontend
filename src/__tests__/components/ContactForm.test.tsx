import React, { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "@/components/contacts/ContactForm";
import { makeContact } from "../mocks/handlers";
import type { FormState } from "@/lib/contacts/types";

const PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYGBg+A8AAQQBAHAgJt0AAAAASUVORK5CYII=";

function renderForm(action: jest.Mock, contact?: ReturnType<typeof makeContact>) {
  return render(
    <ContactForm
      action={action as never}
      contact={contact}
      submitLabel="Create contact"
      cancelHref="/contacts"
    />,
  );
}

describe("ContactForm", () => {
  it("renders every editable field", () => {
    renderForm(jest.fn());

    expect(screen.getByLabelText(/first name/i)).toBeRequired();
    expect(screen.getByLabelText(/last name/i)).toBeRequired();
    expect(screen.getByLabelText(/^email/i)).toBeRequired();
    expect(screen.getByLabelText(/phone/i)).not.toBeRequired();
    expect(screen.getByLabelText(/notes/i).tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText(/image file/i)).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp",
    );
  });

  it("previews the existing photo and can explicitly remove it", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action, makeContact({ photo: PHOTO }));

    expect(
      screen.getByRole("img", { name: /ada lovelace profile photo/i }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /remove photo/i }));
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));
    await waitFor(() => expect(action).toHaveBeenCalled());

    expect(action.mock.calls[0][1].get("remove_photo")).toBe("true");
  });

  it("shows immediate feedback for an unsupported image type", () => {
    renderForm(jest.fn());
    const file = new File(["gif"], "avatar.gif", { type: "image/gif" });

    fireEvent.change(screen.getByLabelText(/image file/i), {
      target: { files: [file] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/JPEG, PNG, or WebP/);
  });

  it("keeps the server photo validation error visible", async () => {
    const action = jest.fn(
      async (): Promise<FormState> => ({
        status: "error",
        message: "Please choose a valid profile photo.",
        fieldErrors: {
          photo: "Photo content does not match the selected image type.",
        },
      }),
    );
    renderForm(action);
    const file = new File(["not actually a png"], "avatar.png", {
      type: "image/png",
    });

    fireEvent.change(screen.getByLabelText(/image file/i), {
      target: { files: [file] },
    });
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    expect(
      await screen.findByText(
        "Photo content does not match the selected image type.",
      ),
    ).toBeInTheDocument();
  });

  it("ignores stale photo reads and invalidates a pending read when cleared", () => {
    const readers: MockFileReader[] = [];
    const NativeFileReader = globalThis.FileReader;

    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      abort = jest.fn();
      readAsDataURL = jest.fn();

      constructor() {
        readers.push(this);
      }
    }

    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
    const view = renderForm(jest.fn());

    try {
      const input = screen.getByLabelText(/image file/i);
      const first = new File(["first"], "first.png", { type: "image/png" });
      const second = new File(["second"], "second.png", { type: "image/png" });
      const third = new File(["third"], "third.png", { type: "image/png" });
      const secondPreview = "data:image/png;base64,c2Vjb25k";

      fireEvent.change(input, { target: { files: [first] } });
      fireEvent.change(input, { target: { files: [second] } });

      expect(readers[0].abort).toHaveBeenCalledTimes(1);
      act(() => {
        readers[1].result = secondPreview;
        readers[1].onload?.();
      });
      expect(
        screen.getByRole("img", { name: /new contact profile photo/i }),
      ).toHaveAttribute("src", secondPreview);

      act(() => {
        readers[0].result = "data:image/png;base64,Zmlyc3Q=";
        readers[0].onload?.();
      });
      expect(
        screen.getByRole("img", { name: /new contact profile photo/i }),
      ).toHaveAttribute("src", secondPreview);

      fireEvent.change(input, { target: { files: [third] } });
      fireEvent.click(screen.getByRole("button", { name: /clear selection/i }));
      expect(readers[2].abort).toHaveBeenCalledTimes(1);

      act(() => {
        readers[2].result = "data:image/png;base64,dGhpcmQ=";
        readers[2].onload?.();
      });
      expect(
        screen.queryByRole("img", { name: /new contact profile photo/i }),
      ).not.toBeInTheDocument();
    } finally {
      view.unmount();
      globalThis.FileReader = NativeFileReader;
    }
  });

  it("prefills from an existing contact", () => {
    renderForm(jest.fn(), makeContact());

    expect(screen.getByLabelText(/first name/i)).toHaveValue("Ada");
    expect(screen.getByLabelText(/^email/i)).toHaveValue("ada@example.com");
    // Nulls become empty inputs rather than the string "null".
    expect(screen.getByLabelText(/street address/i)).toHaveValue("");
  });

  it("submits the entered values to the action", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action);

    await userEvent.type(screen.getByLabelText(/first name/i), "Grace");
    await userEvent.type(screen.getByLabelText(/last name/i), "Hopper");
    await userEvent.type(screen.getByLabelText(/^email/i), "grace@example.com");
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());

    const formData = action.mock.calls[0][1];
    expect(formData.get("first_name")).toBe("Grace");
    expect(formData.get("email")).toBe("grace@example.com");
  });

  it("shows the summary and the per-field errors the action returns", async () => {
    const action = jest.fn(
      async (): Promise<FormState> => ({
        status: "error",
        message: "That email address is already taken.",
        fieldErrors: { email: "This email is already in use." },
        values: { first_name: "Grace" },
      }),
    );
    renderForm(action);

    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((node) => node.textContent)).toEqual(
      expect.arrayContaining([
        "That email address is already taken.",
        "This email is already in use.",
      ]),
    );
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("links back out without submitting", () => {
    renderForm(jest.fn());
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/contacts",
    );
  });
});
