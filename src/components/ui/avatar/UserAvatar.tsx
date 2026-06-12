import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const sizePx: Record<Size, number> = { sm: 32, md: 40, lg: 48, xl: 64 };

// Consistent, hash-based background per identity (matches AvatarText's palette).
const COLORS = [
  "bg-brand-100 text-brand-600",
  "bg-pink-100 text-pink-600",
  "bg-cyan-100 text-cyan-600",
  "bg-orange-100 text-orange-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-yellow-100 text-yellow-600",
  "bg-error-100 text-error-600",
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function colorFor(seed: string) {
  const sum = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COLORS[sum % COLORS.length];
}

/**
 * Avatar that prefers an image and falls back to initials on a hash-based color.
 * Pass `firstName`/`lastName` (preferred) or `name`.
 */
export default function UserAvatar({
  src,
  firstName,
  lastName,
  name,
  size = "md",
  className = "",
}: {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  name?: string;
  size?: Size;
  className?: string;
}) {
  const label = name ?? [firstName, lastName].filter(Boolean).join(" ") ?? "";

  if (src) {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden rounded-full ${sizeClass[size]} ${className}`}
      >
        <Image src={src} alt={label || "avatar"} width={sizePx[size]} height={sizePx[size]} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${sizeClass[size]} ${colorFor(label || "?")} ${className}`}
      aria-label={label || undefined}
    >
      {initialsOf(label)}
    </span>
  );
}
