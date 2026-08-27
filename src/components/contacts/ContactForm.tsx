"use client";

import { type ChangeEvent, useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import ContactAvatar from "./ContactAvatar";
import Field from "@/components/ui/Field";
import Button, { buttonClasses } from "@/components/ui/Button";
import {
  CONTACT_FIELD_GROUPS,
  type ContactTextField,
} from "@/lib/contacts/schema";
import {
  MAX_PHOTO_BYTES,
  PHOTO_ACCEPT,
  photoFileError,
} from "@/lib/contacts/photo";
import {
  EMPTY_FORM_STATE,
  type Contact,
  type FormState,
} from "@/lib/contacts/types";

export type ContactFormAction = (
  state: FormState,
  formData: FormData,
) => Promise<FormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * Create/edit form. The field list comes from `CONTACT_FIELD_GROUPS`, and the
 * action is a bound server action — so a submit is a plain POST that works
 * before hydration and reports errors through `useActionState`.
 */
export default function ContactForm({
  action,
  contact,
  submitLabel,
  cancelHref,
}: {
  action: ContactFormAction;
  contact?: Contact;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [photoPreview, setPhotoPreview] = useState(contact?.photo ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [localPhotoError, setLocalPhotoError] = useState<
    string | null | undefined
  >(undefined);
  const photoInput = useRef<HTMLInputElement>(null);

  function valueFor(name: ContactTextField): string {
    return state.values?.[name] ?? contact?.[name] ?? "";
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setRemovePhoto(false);

    if (!file) {
      setLocalPhotoError(null);
      setPhotoPreview(contact?.photo ?? null);
      return;
    }

    const error = photoFileError(file);
    setLocalPhotoError(error);
    if (error) {
      setPhotoPreview(contact?.photo ?? null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoPreview(reader.result);
    };
    reader.onerror = () => {
      setLocalPhotoError("That image could not be read. Choose another file.");
      setPhotoPreview(contact?.photo ?? null);
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    if (photoInput.current) photoInput.current.value = "";
    setPhotoPreview(null);
    setRemovePhoto(Boolean(contact?.photo));
    setLocalPhotoError(null);
  }

  const photoError =
    localPhotoError === undefined ? state.fieldErrors?.photo : localPhotoError;
  const avatarContact = {
    first_name: state.values?.first_name ?? contact?.first_name ?? "New",
    last_name: state.values?.last_name ?? contact?.last_name ?? "contact",
    email: state.values?.email ?? contact?.email ?? "new-contact",
    photo: photoPreview,
  };

  return (
    <form action={formAction} noValidate className="space-y-8">
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>{state.message}</span>
        </div>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="sr-only">Profile photo</legend>
        <div className="border-b border-hairline pb-2">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Profile photo
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Add a clear headshot. Your initials remain the fallback.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/50 p-4 sm:flex-row sm:items-center">
          <ContactAvatar contact={avatarContact} size="xl" />
          <div className="min-w-0 flex-1">
            <label
              htmlFor="field-photo"
              className="mb-1.5 block text-[13px] font-medium text-foreground"
            >
              Image file
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                optional
              </span>
            </label>
            <input
              ref={photoInput}
              id="field-photo"
              name="photo"
              type="file"
              accept={PHOTO_ACCEPT}
              onChange={handlePhotoChange}
              aria-invalid={photoError ? true : undefined}
              aria-describedby={photoError ? "field-photo-error" : "field-photo-help"}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/70"
            />
            <p id="field-photo-help" className="mt-1.5 text-[12px] text-muted-foreground">
              JPEG, PNG, or WebP. Maximum {MAX_PHOTO_BYTES / 1024 / 1024} MB.
            </p>
            {photoError ? (
              <p
                id="field-photo-error"
                role="alert"
                className="mt-1.5 text-[13px] text-destructive"
              >
                {photoError}
              </p>
            ) : null}
          </div>
          {photoPreview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearPhoto}
              className="self-start sm:self-center"
            >
              {contact?.photo && photoPreview === contact.photo ? (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              )}
              {contact?.photo && photoPreview === contact.photo
                ? "Remove photo"
                : "Clear selection"}
            </Button>
          ) : null}
          <input
            type="hidden"
            name="remove_photo"
            value={removePhoto ? "true" : "false"}
          />
        </div>
      </fieldset>

      {CONTACT_FIELD_GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-4">
          <legend className="sr-only">{group.title}</legend>

          <div className="border-b border-hairline pb-2">
            <h2 className="font-display text-sm font-semibold text-foreground">
              {group.title}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {group.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                defaultValue={valueFor(field.name)}
                error={state.fieldErrors?.[field.name]}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-2 border-t border-hairline pt-4">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className={buttonClasses("secondary")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
