import { File as NodeFile } from "node:buffer";
import {
  PhotoValidationError,
  resolveContactPhoto,
} from "@/lib/contacts/photo.server";
import { MAX_PHOTO_BYTES, photoFileError } from "@/lib/contacts/photo";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXISTING_PHOTO = "data:image/png;base64,existing";

describe("photo file validation", () => {
  it("accepts the supported image MIME types", () => {
    expect(photoFileError({ type: "image/jpeg", size: 1 })).toBeNull();
    expect(photoFileError({ type: "image/png", size: 1 })).toBeNull();
    expect(photoFileError({ type: "image/webp", size: 1 })).toBeNull();
  });

  it("rejects unsupported types and excessive size", () => {
    expect(photoFileError({ type: "image/gif", size: 1 })).toMatch(/JPEG/);
    expect(
      photoFileError({ type: "image/png", size: MAX_PHOTO_BYTES + 1 }),
    ).toMatch(/2 MB/);
  });
});

describe("resolveContactPhoto", () => {
  it("preserves an existing photo when no replacement is selected", async () => {
    await expect(resolveContactPhoto(new FormData(), EXISTING_PHOTO)).resolves.toBe(
      EXISTING_PHOTO,
    );
  });

  it("removes an existing photo only when explicitly requested", async () => {
    const formData = new FormData();
    formData.set("remove_photo", "true");

    await expect(resolveContactPhoto(formData, EXISTING_PHOTO)).resolves.toBeNull();
  });

  it("encodes a valid replacement as a data URI", async () => {
    const formData = new FormData();
    formData.set(
      "photo",
      new NodeFile([PNG_BYTES], "avatar.png", {
        type: "image/png",
      }) as unknown as Blob,
    );

    await expect(resolveContactPhoto(formData, EXISTING_PHOTO)).resolves.toBe(
      "data:image/png;base64,iVBORw0KGgo=",
    );
  });

  it("rejects content that does not match the declared MIME type", async () => {
    const formData = new FormData();
    formData.set(
      "photo",
      new NodeFile([PNG_BYTES], "avatar.jpg", {
        type: "image/jpeg",
      }) as unknown as Blob,
    );

    await expect(resolveContactPhoto(formData, null)).rejects.toBeInstanceOf(
      PhotoValidationError,
    );
  });
});
