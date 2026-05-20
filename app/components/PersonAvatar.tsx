import { cn } from "~/lib/utils";
import { avatarColorClassFromId, getInitials } from "~/lib/avatarUi";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-11 text-sm",
} as const;

export function PersonAvatar({
  name,
  avatarColor,
  avatarUrl,
  size = "md",
  className,
}: {
  name: string;
  avatarColor?: string | null;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const colorClass = avatarColorClassFromId(avatarColor, name);
  const initials = getInitials(name, size === "xs" ? 1 : 2);

  if (avatarUrl?.trim()) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-border/60", SIZES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-black/5",
        SIZES[size],
        colorClass,
        className
      )}
      title={name}
    >
      {initials}
    </span>
  );
}
