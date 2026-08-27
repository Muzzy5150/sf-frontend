import type { CSSProperties } from "react";
import Image from "next/image";
import { avatarHue, initials } from "@/lib/contacts/format";
import type { Contact } from "@/lib/contacts/types";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-xl",
} as const;

const PIXELS = { sm: 32, md: 40, lg: 56, xl: 80 } as const;

/** Initials bubble, tinted with a hue derived from the contact's email. */
export default function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: Pick<Contact, "first_name" | "last_name" | "email" | "photo">;
  size?: keyof typeof SIZES;
}) {
  const style = {
    "--avatar-hue": avatarHue(contact.email),
  } as CSSProperties;
  const name = `${contact.first_name} ${contact.last_name}`.trim();

  return (
    <span
      aria-hidden={contact.photo ? undefined : "true"}
      style={style}
      className={`contact-avatar inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-display font-semibold ring-1 ring-border ${SIZES[size]}`}
    >
      {contact.photo ? (
        <Image
          src={contact.photo}
          alt={`${name} profile photo`}
          width={PIXELS[size]}
          height={PIXELS[size]}
          sizes={`${PIXELS[size]}px`}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        initials(contact)
      )}
    </span>
  );
}
