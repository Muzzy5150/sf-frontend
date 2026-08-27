import "server-only";

import { Buffer } from "node:buffer";
import { photoFileError } from "./photo";

export class PhotoValidationError extends Error {}

function signatureMatches(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((byte, index) => bytes[index] === byte);
  }
  return (
    mimeType === "image/webp" &&
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  );
}

/** Resolve an optional file input without losing the photo already on a contact. */
export async function resolveContactPhoto(
  formData: FormData,
  existingPhoto: string | null,
): Promise<string | null> {
  const entry = formData.get("photo");
  const removeRequested = formData.get("remove_photo") === "true";

  if (typeof entry === "string" || !entry || entry.size === 0) {
    return removeRequested ? null : existingPhoto;
  }

  const metadataError = photoFileError(entry);
  if (metadataError) throw new PhotoValidationError(metadataError);

  const bytes = new Uint8Array(await entry.arrayBuffer());
  if (!signatureMatches(entry.type, bytes)) {
    throw new PhotoValidationError(
      "Photo content does not match the selected image type.",
    );
  }

  return `data:${entry.type};base64,${Buffer.from(bytes).toString("base64")}`;
}
