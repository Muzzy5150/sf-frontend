export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const ALLOWED_PHOTO_TYPES = PHOTO_ACCEPT.split(",");

export function photoFileError(file: Pick<File, "size" | "type">): string | null {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo must be 2 MB or smaller.";
  }
  return null;
}
